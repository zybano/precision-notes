// B2B Audio Transcription API - Replicating frontend AssemblyAI logic
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { AssemblyAI } from "https://esm.sh/assemblyai@4.22.0";
import { recordStaffActivity, getUserIdFromSessionToken } from "../_shared/staffActivityTracker.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
// Rate limiting store (in-memory, simple implementation)
const rateLimitStore = new Map();
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  const startTime = Date.now();
  let organizationId = null;
  let requestSize = 0;
  let success = false;
  let errorMessage = "";
  try {
    // Initialize Supabase client
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // Extract and validate session token
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      errorMessage = "Authentication required";
      return new Response(JSON.stringify({
        error: errorMessage
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    const sessionToken = authHeader.replace("Bearer ", "").trim();
    const { userId, organizationId: sessionOrgId, error: sessionError } = await getUserIdFromSessionToken(
      supabase,
      sessionToken
    );

    if (sessionError || !userId || !sessionOrgId) {
      errorMessage = sessionError || "Invalid or expired session";
      return new Response(JSON.stringify({
        error: errorMessage
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    organizationId = sessionOrgId;

    // Fetch organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      errorMessage = "Organization not found";
      return new Response(JSON.stringify({
        error: errorMessage
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Rate limiting check
    const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
    const rateLimitKey = `${organizationId}_${currentHour}`;
    const rateLimitData = rateLimitStore.get(rateLimitKey) || {
      count: 0,
      resetTime: currentHour
    };
    if (rateLimitData.count >= organization.rate_limit_per_hour) {
      errorMessage = "Rate limit exceeded";
      return new Response(JSON.stringify({
        error: errorMessage,
        limit: organization.rate_limit_per_hour,
        reset_time: new Date((currentHour + 1) * 60 * 60 * 1000).toISOString()
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Parse form data
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const languageCode = formData.get("languageCode") || "en_us";
    const useSpeechModelNano = formData.get("useSpeechModelNano") === "true";
    const webhook_url = formData.get("webhook_url") || organization.webhook_url;
    const requestId = formData.get("requestId") || crypto.randomUUID();
    if (!audioFile) {
      errorMessage = "Audio file is required";
      return new Response(JSON.stringify({
        error: errorMessage
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Calculate request size in MB
    requestSize = audioFile.size / (1024 * 1024);
    // Calculate credits needed (1 credit per minute, minimum 1 credit)
    const estimatedMinutes = Math.max(1, Math.ceil(requestSize * 0.5)); // Rough estimate
    const creditsNeeded = estimatedMinutes;
    // Deduct credits
    const { data: creditResult, error: creditError } = await supabase.rpc('deduct_organization_credits', {
      p_organization_id: organizationId,
      p_credits_to_deduct: creditsNeeded,
      p_source: 'transcription',
      p_source_reference: requestId,
      p_description: `Audio transcription - ${audioFile.name}`
    });
    if (creditError || !creditResult?.success) {
      errorMessage = creditResult?.error || "Failed to deduct credits";
      return new Response(JSON.stringify({
        error: errorMessage
      }), {
        status: 402,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Update rate limit
    rateLimitStore.set(rateLimitKey, {
      count: rateLimitData.count + 1,
      resetTime: currentHour
    });
    // Initialize AssemblyAI client - exactly like frontend
    const assemblyAIApiKey = Deno.env.get("VITE_ASSEMBLYAI_API_KEY") || Deno.env.get("ASSEMBLYAI_API_KEY");
    if (!assemblyAIApiKey) {
      errorMessage = "AssemblyAI API key not configured";
      throw new Error(errorMessage);
    }
    const client = new AssemblyAI({
      apiKey: assemblyAIApiKey
    });
    // Convert File to ArrayBuffer then to Uint8Array for AssemblyAI
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);
    console.log("Uploading audio file to AssemblyAI...");
    // Upload the audio file to AssemblyAI
    const uploadResponse = await client.files.upload(audioBytes);
    console.log("File uploaded to AssemblyAI:", uploadResponse);
    // Start transcription process with the uploaded file and speaker diarization
    const transcript = await client.transcripts.transcribe({
      audio: uploadResponse,
      language_code: languageCode,
      speaker_labels: true,
      speech_model: useSpeechModelNano ? 'nano' : undefined
    });
    console.log("AssemblyAI transcription completed:", transcript);
    // Process the utterances from the transcript - exactly like frontend
    const utterances = [];
    if (transcript.utterances && transcript.utterances.length > 0) {
      // Map the speakers to more user-friendly names (A -> Doctor, B -> Patient)
      transcript.utterances.forEach((utterance)=>{
        // Convert speaker labels like "A" or "B" to "Doctor" and "Patient"
        const speakerName = utterance.speaker === "A" ? "Doctor" : "Patient";
        utterances.push({
          speaker: speakerName,
          text: utterance.text,
          startTime: utterance.start,
          endTime: utterance.end
        });
      });
    } else {
      // If no utterances were detected but we have text, add it as a single utterance
      if (transcript.text) {
        utterances.push({
          speaker: "Unknown",
          text: transcript.text
        });
      }
    }
    // Prepare the transcription result - exactly like frontend
    const transcriptionResult = {
      text: transcript.text || "No transcription available.",
      utterances: utterances,
      isMock: false,
      provider: "assemblyai"
    };
    const processingTime = Date.now() - startTime;
    success = true;

    // Track staff activity
    await recordStaffActivity(supabase, {
      userId,
      organizationId,
      activityType: 'transcription',
      creditsUsed: creditsNeeded,
      requestId,
      transcriptionProvider: 'assemblyai',
      processingTimeMs: processingTime,
      metadata: {
        language_code: languageCode,
        use_nano_model: useSpeechModelNano,
        audio_file_size_mb: requestSize,
        utterance_count: transcriptionResult.utterances?.length || 0
      }
    });

    // Determine storage preference and handle accordingly
    const response = {
      success: true,
      request_id: requestId,
      transcription: transcriptionResult,
      credits_used: creditsNeeded,
      processing_time_ms: processingTime,
      organization_id: organizationId
    };
    // Store temporarily if organization allows it
    if (organization.data_storage_preference === 'temporary' || organization.data_storage_preference === 'permanent') {
      const expiresAt = new Date();
      if (organization.data_storage_preference === 'temporary') {
        expiresAt.setHours(expiresAt.getHours() + 48); // 48 hour expiry
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year for permanent
      }
      await supabase.from('temp_transcriptions').insert({
        organization_id: organizationId,
        request_id: requestId,
        transcription_data: transcriptionResult,
        metadata: {
          audio_filename: audioFile.name,
          file_size_mb: requestSize,
          language_code: languageCode,
          use_speech_model_nano: useSpeechModelNano
        },
        expires_at: expiresAt.toISOString()
      });
    }
    // Send webhook if configured
    if (webhook_url) {
      try {
        const webhookPayload = {
          event: "transcription.completed",
          request_id: requestId,
          organization_id: organizationId,
          transcription: transcriptionResult,
          credits_used: creditsNeeded,
          processing_time_ms: processingTime,
          timestamp: new Date().toISOString()
        };
        // TODO: Sign the webhook payload with organization.webhook_secret
        await fetch(webhook_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "PrecisionNote-Webhooks/1.0"
          },
          body: JSON.stringify(webhookPayload)
        });
      } catch (webhookError) {
        console.error("Webhook delivery failed:", webhookError);
      // Don't fail the main request if webhook fails
      }
    }
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Transcription error:", error);
    success = false;
    errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({
      error: "Transcription failed",
      details: errorMessage,
      request_id: crypto.randomUUID()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } finally{
    // Log API usage
    if (organizationId) {
      const processingTime = Date.now() - startTime;
      try {
        const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
        await supabase.from('api_usage_logs').insert({
          organization_id: organizationId,
          function_called: 'transcribe_audio',
          endpoint: '/functions/v1/b2b-transcribe-audio',
          credits_used: success ? Math.max(1, Math.ceil(requestSize * 0.5)) : 0,
          request_size_mb: requestSize,
          processing_time_ms: processingTime,
          success: success,
          error_message: success ? null : errorMessage,
          request_metadata: {
            audio_file_size: requestSize,
            language_code: req.headers.get("language-code"),
            use_nano_model: req.headers.get("use-nano-model") === "true"
          },
          ip_address: req.headers.get("x-forwarded-for") || req.headers.get("remote-addr"),
          user_agent: req.headers.get("user-agent")
        });
      } catch (logError) {
        console.error("Failed to log API usage:", logError);
      }
    }
  }
});
