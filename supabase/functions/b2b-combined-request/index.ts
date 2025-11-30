// B2B Combined Transcription + Document Generation API with Summary (Simplified Single File)
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { AssemblyAI } from "https://esm.sh/assemblyai@4.0.0";
import OpenAI from "https://esm.sh/openai@4.22.0";
import { recordStaffActivity, getUserIdFromSessionToken } from "../_shared/staffActivityTracker.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
/**
 * Safely extracts organization usage data with proper null handling
 * @param {any} data - Raw data from Supabase RPC call
 * @param {any} error - Error from Supabase RPC call
 * @returns {Object} Safely processed usage data
 */ function extractUsageData(data, error) {
  console.log(data);
  const defaults = {
    total_requests: 0,
    request_limit: null,
    remaining_requests: null,
    is_limit_exceeded: false
  };
  if (error) {
    console.warn('Database error fetching usage data:', error.message || error);
    return {
      ...defaults,
      error: true
    };
  }
  if (!data) {
    console.warn('No data returned from usage query');
    return {
      ...defaults,
      error: false
    };
  }
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('Usage query returned empty array');
    return {
      ...defaults,
      error: false
    };
  }
  const usageRecord = data[0];
  if (!usageRecord || typeof usageRecord !== 'object') {
    console.warn('Invalid usage record format');
    return {
      ...defaults,
      error: false
    };
  }
  return {
    total_requests: Number(usageRecord.total_requests) || 0,
    request_limit: usageRecord.request_limit !== null ? Number(usageRecord.request_limit) : null,
    remaining_requests: usageRecord.remaining_requests !== null ? Number(usageRecord.remaining_requests) : null,
    is_limit_exceeded: Boolean(usageRecord.is_limit_exceeded),
    error: false
  };
}
// Rate limiting store
const rateLimitStore = new Map();
serve(async (req)=>{
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
  let success = false;
  let errorMessage = "";
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // Extract and validate session token
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({
        error: "Authentication required"
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
      return new Response(JSON.stringify({
        error: sessionError || "Invalid or expired session"
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
      return new Response(JSON.stringify({
        error: "Organization not found"
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Rate limiting
    const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
    const rateLimitKey = `${organizationId}_${currentHour}`;
    const rateLimitData = rateLimitStore.get(rateLimitKey) || {
      count: 0,
      resetTime: currentHour
    };
    if (rateLimitData.count >= organization.rate_limit_per_hour) {
      return new Response(JSON.stringify({
        error: "Rate limit exceeded"
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    rateLimitStore.set(rateLimitKey, {
      count: rateLimitData.count + 1,
      resetTime: currentHour
    });
    // Parse form data
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const documentFormat = formData.get("document_format");
    const languageCode = formData.get("languageCode") || null; // Auto-detect by default
    const useSpeechModelNano = formData.get("useSpeechModelNano") === "true";
    const modelName = formData.get("model_name") || "gpt-4-turbo";
    const requestId = formData.get("requestId") || crypto.randomUUID();
    const includeSummary = formData.get("include_summary") !== "false"; // Default to true
    const acceptSuggestions = formData.get("acceptSuggestions");
    if (!audioFile || !documentFormat) {
      return new Response(JSON.stringify({
        error: "Audio file and document format are required"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Calculate credits (transcription + document + summary if requested)
    const requestSize = audioFile.size / (1024 * 1024);
    const transcriptionCredits = Math.max(1, Math.ceil(requestSize * 0.5));
    const documentCredits = getDocumentCredits(documentFormat);
    const totalCredits = transcriptionCredits + documentCredits;
    console.log("Accepting suggestions?");
    console.log(acceptSuggestions);
    // // Deduct credits
    // const { data: creditResult, error: creditError } = await supabase.rpc('deduct_organization_credits', {
    //   p_organization_id: organizationId,
    //   p_credits_to_deduct: totalCredits,
    //   p_source: 'combined_transcription_generation',
    //   p_source_reference: requestId,
    //   p_description: `Combined transcription + document generation - ${documentFormat}${includeSummary ? ' + summary' : ''}`
    // });
    // if (creditError || !creditResult?.success) {
    //   return new Response(JSON.stringify({
    //     error: creditResult?.error || "Credit deduction failed"
    //   }), {
    //     status: 402,
    //     headers: {
    //       ...corsHeaders,
    //       "Content-Type": "application/json"
    //     }
    //   });
    // }
    // STEP 1: Transcribe audio with AssemblyAI (exactly like frontend)
    const assemblyAIApiKey = Deno.env.get("ASSEMBLYAI_API_KEY");
    if (!assemblyAIApiKey) {
      throw new Error("AssemblyAI API key not configured");
    }
    const client = new AssemblyAI({
      apiKey: assemblyAIApiKey
    });
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);
    console.log("Uploading audio to AssemblyAI...");
    const uploadResponse = await client.files.upload(audioBytes);
    // Configure transcription with auto-detection and speaker diarization
    const transcriptConfig = {
      audio: uploadResponse,
      speaker_labels: true,
      language_code: languageCode || 'en_us',
      speech_model: useSpeechModelNano ? 'nano' : undefined
    };
    const transcript = await client.transcripts.transcribe(transcriptConfig);
    // Process the utterances from the transcript
    const utterances = [];
    if (transcript.utterances && transcript.utterances.length > 0) {
      // Map the speakers to more user-friendly names (A -> Doctor, B -> Patient, etc.)
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
    const transcriptionResult = {
      text: transcript.text || "No transcription available.",
      utterances: utterances,
      isMock: false,
      provider: "assemblyai"
    };
    // STEP 2: Generate document and summary with OpenAI
    const conversationText = transcriptionResult.utterances?.map((segment)=>`${segment.speaker}: ${segment.text}`).join('\n\n') || transcriptionResult.text || "";
    let generatedDocument = "";
    let generatedSummary = "";
    if (documentFormat === 'dictation') {
      generatedDocument = conversationText;
      // Even for dictation, generate a summary if requested
      if (includeSummary) {
        const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openAIApiKey) {
          throw new Error("OpenAI API key not configured");
        }
        const openai = new OpenAI({
          apiKey: openAIApiKey
        });
        const summaryCompletion = await openai.chat.completions.create({
          model: modelName,
          messages: [
            {
              role: "system",
              content: "You are an expert medical professional that creates concise, accurate patient summaries from medical conversations and extracts patient identifying information."
            },
            {
              role: "user",
              content: getSummaryPrompt(conversationText)
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        });
        generatedSummary = summaryCompletion.choices[0]?.message?.content || "";
      }
    } else {
      const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openAIApiKey) {
        throw new Error("OpenAI API key not configured");
      }
      const openai = new OpenAI({
        apiKey: openAIApiKey
      });
      const promptTemplate = acceptSuggestions === "true" ? getPromptForFormatWithSuggestions(documentFormat, conversationText) : getPromptForFormat(documentFormat, conversationText);
      // Also fix the system message logic
      const systemMessage = acceptSuggestions === "true" ? "You are an expert medical professional specializing in creating accurate and comprehensive medical documentation from transcripts." : "You are an expert medical professional specializing in creating accurate and comprehensive medical documentation from transcripts. You must ONLY use information explicitly mentioned in the provided transcript. Do NOT add, infer, or hallucinate any medical information not directly stated in the conversation. If specific information is not mentioned in the transcript, clearly indicate 'Not mentioned in transcript' or leave the section blank rather than making assumptions.";
      // The OpenAI call would become:
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: "system",
            content: systemMessage
          },
          {
            role: "user",
            content: promptTemplate
          }
        ],
        max_tokens: 4000,
        temperature: 0.3
      });
      generatedDocument = completion.choices[0]?.message?.content || "";
      // Generate summary if requested
      if (includeSummary) {
        const summaryCompletion = await openai.chat.completions.create({
          model: modelName,
          messages: [
            {
              role: "system",
              content: "You are an expert medical professional specializing in creating concise consultation summaries. You must ONLY use information explicitly mentioned in the provided transcript. Do NOT add, infer, or hallucinate any medical information not directly stated in the conversation."
            },
            {
              role: "user",
              content: getSummaryPrompt(conversationText)
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        });
        generatedSummary = summaryCompletion.choices[0]?.message?.content || "";
      }
    }
    const processingTime = Date.now() - startTime;
    success = true;

    // Track staff activity
    await recordStaffActivity(supabase, {
      userId,
      organizationId,
      activityType: 'combined_request',
      creditsUsed: totalCredits,
      requestId,
      documentFormat,
      transcriptionProvider: 'assemblyai',
      modelUsed: modelName,
      processingTimeMs: processingTime,
      metadata: {
        language_code: languageCode || 'auto-detected',
        include_summary: includeSummary,
        use_nano_model: useSpeechModelNano,
        audio_file_size_mb: requestSize
      }
    });

    // STEP 3: Handle storage if organization allows it
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
        document_data: {
          document: generatedDocument,
          summary: generatedSummary,
          format: documentFormat,
          model_used: modelName
        },
        metadata: {
          audio_filename: audioFile.name,
          file_size_mb: requestSize,
          language_code: languageCode || "auto-detected",
          model_name: modelName,
          processing_time_ms: processingTime,
          summary_included: includeSummary,
          speaker_diarization: true
        },
        expires_at: expiresAt.toISOString()
      });
    }
    // log usage
    await supabase.rpc('increment_organization_requests', {
      org_id: organizationId
    });
    const { data, error } = await supabase.rpc('get_organization_request_usage', {
      p_org_id: organizationId
    });
    const usageData = extractUsageData(data, error);
    const response = {
      success: true,
      request_id: requestId,
      transcription: transcriptionResult,
      document: generatedDocument || "",
      summary: generatedSummary || "",
      document_format: documentFormat,
      credits_used: totalCredits,
      processing_time_ms: processingTime,
      organization_id: organizationId,
      usage: {
        total_requests: usageData.total_requests,
        request_limit: usageData.request_limit,
        remaining_requests: usageData.remaining_requests,
        is_limit_exceeded: usageData.is_limit_exceeded
      }
    };
    // STEP 4: Send webhook if configured
    if (organization.webhook_url) {
      try {
        const webhookPayload = {
          event: "transcription_and_document.completed",
          ...response,
          timestamp: new Date().toISOString()
        };
        await fetch(organization.webhook_url, {
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
    console.error("Combined API error:", error);
    success = false;
    errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({
      error: "Combined processing failed",
      details: errorMessage
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } finally{
  // Log API usage
  // if (organizationId) {
  //   const processingTime = Date.now() - startTime;
  //   try {
  //     const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  //     await supabase.from('api_usage_logs').insert({
  //       organization_id: organizationId,
  //       function_called: 'transcribe_and_generate',
  //       endpoint: '/functions/v1/b2b-combined',
  //       credits_used: success ? getDocumentCredits("combined") : 0,
  //       processing_time_ms: processingTime,
  //       success: success,
  //       error_message: success ? null : errorMessage,
  //       ip_address: req.headers.get("x-forwarded-for"),
  //       user_agent: req.headers.get("user-agent")
  //     });
  //   } catch (logError) {
  //     console.error("Failed to log API usage:", logError);
  //   }
  // }
  }
});
function getDocumentCredits(format) {
  const creditsMap = {
    'dictation': 1,
    'soap': 2,
    'progress': 2,
    'consultation': 3,
    'h&p': 4,
    'discharge': 4,
    'procedure': 3,
    'operative': 4,
    'emergency': 3,
    'psychiatric': 3,
    'therapy': 2,
    'radiology': 2,
    'pathology': 3,
    'cardiology': 3,
    'pulmonary': 3,
    'neurology': 3,
    'dentistry': 3,
    'oncology': 4,
    'pediatric': 3,
    'prenatal': 3,
    'followup': 2,
    'referral': 2,
    'medication': 2,
    'custom': 3,
    'combined': 5
  };
  return creditsMap[format] || 3;
}
function getSummaryPrompt(conversationText) {
  return `Analyze this medical conversation and create a concise consultation summary:

${conversationText}

Please create a brief summary using ONLY information explicitly mentioned in the transcript. The summary should include:

**CONSULTATION SUMMARY:**

**Patient Concerns:** [Only the main complaints and symptoms as stated by the patient]

**Key Findings:** [Only the examination findings, test results, or observations mentioned in the conversation]

**Clinical Assessment:** [Only the provider's conclusions and diagnoses as stated in the transcript]

**Management Plan:** [Only the treatment plans, medications, or follow-up instructions discussed]

**Next Steps:** [Only the specific follow-up plans or referrals mentioned]`;
}
function getPromptForFormat(format, conversationText) {
  console.log("using strict mode");
  // Anti-hallucination clause to be added to all prompts
  const antiHallucinationClause = `

CRITICAL INSTRUCTIONS:
- If a section cannot be completed due to missing information and cannot be inferred, clearly state this`;
  const prompts = {
    'soap': `Analyze this medical conversation and create comprehensive SOAP notes:

${conversationText}

Please create detailed SOAP notes with:
- Subjective: Patient's history, complaints, and self-reported symptoms (ONLY as mentioned in transcript)
- Objective: Clinical observations, vital signs, test results mentioned (ONLY as stated in transcript)
- Assessment: Provider's diagnostic impressions and conclusions (ONLY as stated in transcript)
- Plan: Treatment plans, medications, follow-ups, and referrals (ONLY as discussed in transcript)

Format professionally as would appear in an Electronic Health Record. ${antiHallucinationClause}`,
    'h&p': `Analyze this medical conversation and create a comprehensive History & Physical report:


${conversationText}

Please include ONLY information mentioned in the transcript:
- Chief Complaint
- History of Present Illness
- Past Medical History, Past Surgical History
- Drug History, Allergy History
- Social History, Family History
- Review of Systems
- Physical Examination
- Laboratory/Diagnostic Findings
- Differential Diagnosis, Diagnosis, Plan

Format professionally as would appear in an Electronic Health Record.${antiHallucinationClause}`,
    'progress': `Analyze this medical conversation and create a concise Progress Note:

${conversationText}

Please include ONLY information from the transcript:
- Subjective update
- Objective findings
- Assessment of current status
- Plan for continuing care

The note should be concise but complete, capturing key elements of the patient's current status and care plan.${antiHallucinationClause}`,
    'discharge': `Analyze this medical conversation and create a Discharge Summary:

${conversationText}

Please include ONLY information mentioned in the transcript:
- Admission Date and Discharge Date
- Admitting Diagnosis, Discharge Diagnosis
- Brief History and Hospital Course
- Significant Findings, Procedures Performed
- Discharge Condition, Discharge Instructions
- Medications on Discharge, Follow-up Instructions

Format professionally as would appear in an Electronic Health Record.${antiHallucinationClause}`,
    'consultation': `Analyze this medical conversation and create a Consultation Note:

${conversationText}

Please include ONLY information from the transcript:
- Reason for Consultation
- History of Present Illness
- Pertinent Past Medical History
- Examination Findings
- Results of Any Studies/Tests
- Assessment/Impression
- Recommendations, Plan of Action

Format professionally as would appear in an Electronic Health Record.${antiHallucinationClause}`,
    'procedure': `Analyze this medical conversation and create a Procedure Note:

${conversationText}

Please include ONLY information mentioned in the transcript:
- Procedure Performed, Date and Time
- Indication
- Pre-procedure Diagnosis, Post-procedure Diagnosis
- Anesthesia Used
- Description of Procedure, Findings
- Specimens Collected, Complications
- Estimated Blood Loss, Patient Tolerance
- Post-procedure Plan

Format professionally as would appear in an Electronic Health Record.${antiHallucinationClause}`,
    'operative': `Analyze this medical conversation and create an Operative Note:

${conversationText}

Please include ONLY information mentioned in the transcript:
- Date and Time of Operation
- Surgeon(s) and Assistant(s)
- Preoperative Diagnosis, Postoperative Diagnosis
- Procedure(s) Performed
- Indication for Surgery
- Description of Procedure
- Findings, Complications
- Estimated Blood Loss, Specimen(s)
- Postoperative Condition and Plan

Format professionally as would appear in an Electronic Health Record.${antiHallucinationClause}`,
    'emergency': `Analyze this medical conversation and create an Emergency Department Note:

${conversationText}

Please include ONLY information mentioned in the transcript:
- Chief Complaint and Triage Information
- History of Present Illness
- Past Medical History, Medications, Allergies
- Physical Examination
- Vital Signs and Assessment
- Diagnostic Studies and Results
- Emergency Department Course
- Diagnosis and Disposition
- Discharge Instructions or Admission Orders

Format professionally as would appear in an Electronic Health Record.${antiHallucinationClause}`,
    'psychiatric': `Analyze this medical conversation and create a Psychiatric Evaluation Note:

${conversationText}

Please include ONLY information mentioned in the transcript:
- Chief Complaint and Referral Source
- History of Present Illness
- Psychiatric History, Medical History
- Social History, Family History
- Mental Status Examination
- Risk Assessment
- Diagnostic Impression
- Treatment Plan and Recommendations

Format professionally as would appear in an Electronic Health Record.${antiHallucinationClause}`,
    'therapy': `Analyze this medical conversation and create a Therapy Session Note:

${conversationText}

Please include ONLY information mentioned in the transcript:
- Session Date and Duration
- Treatment Modality Used
- Patient's Presentation and Mood
- Issues Discussed
- Interventions and Techniques Used
- Patient Response and Progress
- Homework/Action Items
- Plan for Next Session

Format professionally as would appear in therapy documentation.${antiHallucinationClause}`,
    'radiology': `Analyze this medical conversation and create a Radiology Report:

${conversationText}

Please include ONLY information mentioned in the transcript:
- Examination Type and Date
- Clinical Information and Indication
- Technique and Contrast Information
- Findings (describe only what was discussed)
- Impression/Conclusion
- Recommendations for Follow-up

Format professionally as would appear in a radiology report.${antiHallucinationClause}`,
    'pathology': `Analyze this medical conversation and create a Pathology Report:

${conversationText}

Please include ONLY information mentioned in the transcript:
- Specimen Type and Source
- Clinical History and Indication
- Gross Description
- Microscopic Description
- Special Stains/Studies (if mentioned)
- Diagnosis
- Comments and Recommendations

Format professionally as would appear in a pathology report.${antiHallucinationClause}`,
    'cardiology': `Analyze this medical conversation and create a Cardiology Consultation Note:

${conversationText}

Please include ONLY information mentioned in the transcript:
- Reason for Consultation
- Cardiovascular History and Risk Factors
- Current Symptoms and Functional Status
- Physical Examination (cardiovascular focus)
- Diagnostic Studies and Results
- Assessment and Cardiac Diagnosis
- Recommendations and Treatment Plan

Format professionally as would appear in a cardiology consultation.${antiHallucinationClause}`,
    'pulmonary': `Analyze this medical conversation and create a Pulmonary Consultation Note:

${conversationText}

Please include ONLY information mentioned in the transcript:
- Reason for Consultation
- Respiratory History and Symptoms
- Environmental and Occupational Exposure
- Physical Examination (pulmonary focus)
- Pulmonary Function Tests and Imaging
- Assessment and Pulmonary Diagnosis
- Treatment Plan and Recommendations

Format professionally as would appear in a pulmonary consultation.${antiHallucinationClause}`,
    'neurology': `Analyze this medical conversation and create a Neurology Consultation Note:

${conversationText}

Please include ONLY information mentioned in the transcript:
- Reason for Consultation
- Neurological History and Symptoms
- Past Neurological Events
- Neurological Examination
- Cognitive Assessment (if performed)
- Diagnostic Studies and Results
- Assessment and Neurological Diagnosis
- Treatment Plan and Follow-up

Format professionally as would appear in a neurology consultation.${antiHallucinationClause}`,
    'dentistry': `Analyze this medical conversation and create a Dental Consultation Note:

${conversationText}

Please include ONLY information mentioned in the transcript:
- Chief Complaint and Reason for Visit
- Dental History and Current Symptoms
- Past Dental Treatments and Procedures
- Medical History Relevant to Dental Care
- Intraoral and Extraoral Examination
- Periodontal Assessment
- Radiographic Findings (if discussed)
- Oral Health Assessment and Diagnosis
- Treatment Plan and Recommendations
- Patient Education and Follow-up Instructions

Format professionally as would appear in a dental consultation note.${antiHallucinationClause}`,
    'oncology': `Analyze this medical conversation and create an Oncology Consultation Note:

${conversationText}

Please include ONLY information mentioned in the transcript:
- Reason for Consultation
- Cancer History and Staging
- Previous Treatments and Response
- Current Symptoms and Performance Status
- Physical Examination
- Laboratory and Imaging Results
- Assessment and Treatment Options
- Treatment Plan and Prognosis Discussion

Format professionally as would appear in an oncology consultation.${antiHallucinationClause}`,
    'pediatric': `Analyze this medical conversation and create a Pediatric Note:

${conversationText}

Please include ONLY information mentioned in the transcript:
- Chief Complaint and History from Parent/Guardian
- Birth History and Developmental Milestones
- Immunization Status
- Growth Parameters and Vital Signs
- Physical Examination
- Assessment and Pediatric Considerations
- Treatment Plan and Parent Education

Format professionally as would appear in pediatric documentation.${antiHallucinationClause}`,
    'prenatal': `Analyze this medical conversation and create a Prenatal Visit Note:

${conversationText}

Please include ONLY information mentioned in the transcript:
- Gestational Age and Last Menstrual Period
- Prenatal History and Previous Pregnancies
- Current Symptoms and Concerns
- Physical Examination and Measurements
- Fetal Assessment and Heart Rate
- Laboratory Results and Screenings
- Assessment and Plan
- Next Appointment and Instructions

Format professionally as would appear in prenatal care documentation.${antiHallucinationClause}`,
    'followup': `Analyze this medical conversation and create a Follow-up Visit Note:

${conversationText}

Please include ONLY information mentioned in the transcript:
- Interval History Since Last Visit
- Current Symptoms and Status
- Medication Compliance and Side Effects
- Physical Examination Changes
- Review of Recent Tests/Studies
- Assessment of Treatment Response
- Plan Modifications and Next Steps

Format professionally as would appear in follow-up documentation.${antiHallucinationClause}`,
    'referral': `Analyze this medical conversation and create a Referral Note:

${conversationText}

Please include ONLY information mentioned in the transcript:
- Reason for Referral
- Relevant Medical History
- Current Problem and Duration
- Previous Treatments Attempted
- Specific Questions for Consultant
- Urgency of Referral
- Patient Preferences and Concerns

Format professionally as would appear in referral documentation.${antiHallucinationClause}`,
    'medication': `Analyze this medical conversation and create a Medication Management Note:

${conversationText}

Please include ONLY information mentioned in the transcript:
- Current Medications and Dosages
- Medication Compliance and Issues
- Side Effects and Adverse Reactions
- Medication Effectiveness
- Drug Interactions Discussed
- Changes Made to Regimen
- Patient Education Provided
- Follow-up Plan for Monitoring

Format professionally as would appear in medication management documentation.${antiHallucinationClause}`,
    'custom': `Analyze this medical conversation and create a comprehensive Presenting Complaints Assessment:

${conversationText}

Please create a structured assessment using ONLY information mentioned in the transcript. Use the following format:

**PRESENTING COMPLAINTS:**
[List only the chief complaints and symptoms as stated by the patient in the transcript]

**HISTORY OF PRESENTING COMPLAINTS:**
[Include only the detailed history of current symptoms as discussed in the transcript]

**REVIEW OF SYSTEMS:**
[Document only the systems review information explicitly mentioned in the conversation]

**PAST MEDICAL HISTORY:**
[Include only past medical conditions mentioned in the transcript]

**PAST SURGICAL HISTORY:**
[List only surgical procedures discussed in the transcript]

**DRUG HISTORY:**
[Document only medications and drug history mentioned in the conversation]

**GYNAE HISTORY:**
[Include only gynecological history if discussed in the transcript]

**OBSTETRIC HISTORY:**
[Document only pregnancy/childbirth history if mentioned in the conversation]

**FAMILY AND SOCIAL HISTORY:**
[Include only family and social history information explicitly discussed in the transcript]

If any section has no information mentioned in the transcript, write "Not discussed in this consultation" for that section.${antiHallucinationClause}`
  };
  return prompts[format] || prompts['soap'];
}
const getPromptForFormatWithSuggestions = (format, conversationText)=>{
  const prompts = {
    "soap": `
I need you to analyze this medical conversation transcript and convert it into properly formatted SOAP notes. 
Please act as an expert medical professional with experience in medical documentation.

Here's the transcript:

${conversationText}

Please create comprehensive SOAP notes from this conversation, including:
- Subjective: Patient's history, complaints, and self-reported symptoms
- Objective: Clinical observations, vital signs, test results mentioned
- Assessment: The provider's diagnostic impressions and conclusions
- Plan: Treatment plans, medications, follow-ups, and referrals

Format it professionally as would appear in an Electronic Health Record.`,
    "h&p": `
I need you to analyze this medical conversation transcript and convert it into a comprehensive History & Physical (H&P) report.
Please act as an expert medical professional with experience in medical documentation.

Here's the transcript:

${conversationText}

Please create a detailed H&P report from this conversation, including:
- Chief Complaint
- History of Present Illness
- Past Medical History
- Past Surgical History
- Drug History
- Allergy History 
- Social History
- Family History
- Review of Systems
- Physical Examination
- Laboratory/Diagnostic Findings
- Differential Diagnosis
- Diagnosis
- Plan

Format it professionally as would appear in an Electronic Health Record. The differential diagnosis should be listed in order of likelihood., while the diagnosis should be the final conclusion.`,
    "progress": `
I need you to analyze this medical conversation transcript and convert it into a concise Progress Note.
Please act as an expert medical professional with experience in medical documentation.

Here's the transcript:

${conversationText}

Please create a professional Progress Note from this conversation, including:
- Subjective update
- Objective findings
- Assessment of current status
- Plan for continuing care

The note should be concise but complete, capturing the key elements of the patient's current status and care plan.`,
    "discharge": `
I need you to analyze this medical conversation transcript and convert it into a Discharge Summary.
Please act as an expert medical professional with experience in medical documentation.

Here's the transcript:

${conversationText}

Please create a comprehensive Discharge Summary from this conversation, including:
- Admission Date and Discharge Date
- Admitting Diagnosis
- Discharge Diagnosis
- Brief History and Hospital Course
- Significant Findings
- Procedures Performed
- Discharge Condition
- Discharge Instructions
- Medications on Discharge
- Follow-up Instructions

Format it professionally as would appear in an Electronic Health Record.`,
    "consultation": `
I need you to analyze this medical conversation transcript and convert it into a Consultation Note.
Please act as an expert medical professional with experience in medical documentation.

Here's the transcript:

${conversationText}

Please create a detailed Consultation Note from this conversation, including:
- Reason for Consultation
- History of Present Illness
- Pertinent Past Medical History
- Examination Findings
- Results of Any Studies/Tests
- Assessment/Impression
- Recommendations
- Plan of Action

Format it professionally as would appear in an Electronic Health Record.`,
    "procedure": `
I need you to analyze this medical conversation transcript and convert it into a Procedure Note.
Please act as an expert medical professional with experience in medical documentation.

Here's the transcript:

${conversationText}

Please create a detailed Procedure Note from this conversation, including:
- Procedure Performed
- Date and Time
- Indication
- Pre-procedure Diagnosis
- Post-procedure Diagnosis
- Anesthesia Used
- Description of Procedure
- Findings
- Specimens Collected
- Complications
- Estimated Blood Loss
- Patient Tolerance
- Post-procedure Plan

Format it professionally as would appear in an Electronic Health Record.`,
    "pediatric": `
I need you to analyze this pediatric medical conversation transcript and convert it into properly formatted notes.
Please act as an expert pediatrician with experience in medical documentation.

Here's the transcript:

${conversationText}

Please create comprehensive pediatric notes from this conversation, addressing these key areas:
- Growth & Development: Details on height, weight, developmental milestones
- Immunizations: Current vaccine status and recommended schedule
- Nutritional Status: Feeding patterns and nutritional assessment
- Behavioral Concerns: Information about sleep, behavior, social interaction
- Parental Guidance: Advice and education provided to caregivers

Format it professionally as would appear in a pediatric Electronic Health Record.`,
    "cardiology": `
I need you to analyze this cardiology medical conversation transcript and convert it into properly formatted cardiac notes.
Please act as an expert cardiologist with experience in medical documentation.

Here's the transcript:

${conversationText}

Please create comprehensive cardiology notes from this conversation, addressing these key areas:
- Cardiovascular History: Cardiac symptoms and relevant history
- ECG Findings: Detailed electrocardiogram interpretation if mentioned
- Cardiac Imaging: Results from echocardiogram, stress tests, or other imaging
- Risk Factors: Assessment of hypertension, dyslipidemia, diabetes, and other factors
- Cardiac Management Plan: Details on medications, interventions, and lifestyle modifications

Format it professionally as would appear in a cardiology Electronic Health Record.`,
    "psychiatric": `
I need you to analyze this psychiatric medical conversation transcript and convert it into properly formatted mental health notes.
Please act as an expert psychiatrist with experience in mental health documentation.

Here's the transcript:

${conversationText}

Please create comprehensive psychiatric notes from this conversation, addressing these key areas:
- Mental Status Examination: Observations on appearance, behavior, and cognitive function
- Mood & Anxiety: Assessment of depression, anxiety, and affect
- Thought Process: Evaluation of thought content, perceptions, and insight
- Risk Assessment: Analysis of suicidal/homicidal ideation and self-harm risk
- Psychiatric Plan: Details on medications, therapy recommendations, and follow-up

Format it professionally as would appear in a psychiatric Electronic Health Record.`,
    "followup": `
I need you to analyze this follow-up medical conversation transcript and convert it into properly formatted follow-up notes.
Please act as an expert medical professional with experience in medical documentation.

Here's the transcript:

${conversationText}

Please create comprehensive follow-up notes from this conversation, addressing these key areas:
- Follow-up Status: Assessment of previous treatment response
- Current Symptoms: Evaluation of ongoing or new symptoms
- Medication Review: Analysis of current medications and adherence
- Physical Examination: Relevant examination findings
- Plan Modifications: Updates to treatment plan based on current status

Format it professionally as would appear in an Electronic Health Record.`,
    "prenatal": `
I need you to analyze this prenatal medical conversation transcript and convert it into properly formatted prenatal care notes.
Please act as an expert obstetrician with experience in pregnancy documentation.

Here's the transcript:

${conversationText}

Please create comprehensive prenatal notes from this conversation, addressing these key areas:
- Gestational Age: Information on LMP, EDD, and current weeks of pregnancy
- Prenatal Screening: Results from genetic testing and anomaly scans
- Maternal Vitals: Data on blood pressure, weight, and urine analysis
- Fetal Assessment: Details on heart rate, movement, and growth
- Birth Plan: Information on delivery preferences and postpartum care plans

Format it professionally as would appear in a prenatal Electronic Health Record.`,
    "neurology": `
I need you to analyze this neurological medical conversation transcript and convert it into properly formatted neurology notes.
Please act as an expert neurologist with experience in neurological documentation.

Here's the transcript:

${conversationText}

Please create comprehensive neurology notes from this conversation, addressing these key areas:
- Neurological Examination: Detailed neurological assessment findings
- Cognitive Assessment: Evaluation of memory, orientation, and mental status
- Motor Function: Analysis of strength, reflexes, and coordination
- Sensory Function: Assessment of sensation and special senses
- Diagnostic Studies: Results from imaging, EEG, or other neurological tests

Format it professionally as would appear in a neurological Electronic Health Record.`,
    "dentistry": `
I need you to analyze this dental medical conversation transcript and convert it into properly formatted dental notes.
Please act as an expert dentist with experience in dental documentation.

Here's the transcript:

${conversationText}

Please create comprehensive dental notes from this conversation, addressing these key areas:
- Oral Examination: Detailed intraoral and extraoral assessment findings
- Periodontal Assessment: Evaluation of gum health, pocket depths, and periodontal status
- Dental Charting: Analysis of tooth conditions, restorations, and pathology
- Occlusal Assessment: Evaluation of bite, TMJ function, and jaw alignment
- Diagnostic Studies: Results from radiographs, photographs, or other dental imaging

Format it professionally as would appear in a dental Electronic Health Record.`,
    "oncology": `
I need you to analyze this medical conversation transcript and convert it into a detailed endocrinology consultation note.

Here's the transcript:

${conversationText}

Please create a comprehensive endocrinology note following this format:
[Insert detailed endocrinology-specific template]
`,
    "dictation": `
The following is a direct transcription for dictation purposes:

${conversationText}

This transcription is provided as dictated, with speaker labels for reference.`,
    'referral': `Analyze this medical conversation and create a Referral Note:

${conversationText}

Please include  information mentioned in the transcript:
- Reason for Referral
- Relevant Medical History
- Current Problem and Duration
- Previous Treatments Attempted
- Specific Questions for Consultant
- Urgency of Referral
- Patient Preferences and Concerns

Format professionally as would appear in referral documentation.`,
    'medication': `Analyze this medical conversation and create a Medication Management Note:

${conversationText}

Please include  information mentioned in the transcript:
- Current Medications and Dosages
- Medication Compliance and Issues
- Side Effects and Adverse Reactions
- Medication Effectiveness
- Drug Interactions Discussed
- Changes Made to Regimen
- Patient Education Provided
- Follow-up Plan for Monitoring

Format professionally as would appear in medication management documentation.`,
    'custom': `Analyze this medical conversation and create a comprehensive Presenting Complaints Assessment:

${conversationText}

Please create a structured assessment using information mentioned in the transcript. Use the following format:

**PRESENTING COMPLAINTS:**
[List only the chief complaints and symptoms as stated by the patient in the transcript]

**HISTORY OF PRESENTING COMPLAINTS:**
[Include only the detailed history of current symptoms as discussed in the transcript]

**REVIEW OF SYSTEMS:**
[Document only the systems review information explicitly mentioned in the conversation]

**PAST MEDICAL HISTORY:**
[Include only past medical conditions mentioned in the transcript]

**PAST SURGICAL HISTORY:**
[List only surgical procedures discussed in the transcript]

**DRUG HISTORY:**
[Document only medications and drug history mentioned in the conversation]

**GYNAE HISTORY:**
[Include only gynecological history if discussed in the transcript]

**OBSTETRIC HISTORY:**
[Document only pregnancy/childbirth history if mentioned in the conversation]

**FAMILY AND SOCIAL HISTORY:**
[Include only family and social history information explicitly discussed in the transcript]

If any section has no information mentioned in the transcript, write "Not discussed in this consultation" for that section.`
  };
  return prompts[format] || getPromptForFormat(format, conversationText);
};
