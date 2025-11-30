// B2B Document Generation API (Text-to-Document) with Summary
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import OpenAI from "https://esm.sh/openai@4.22.0";
import { recordStaffActivity, getUserIdFromSessionToken } from "../_shared/staffActivityTracker.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
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
    // Parse JSON body
    const body = await req.json();
    const { transcript_text, document_format, model_name = "gpt-4-turbo", request_id = crypto.randomUUID(), include_summary = true // New parameter to control summary generation
     } = body;
    if (!transcript_text || !document_format) {
      return new Response(JSON.stringify({
        error: "transcript_text and document_format are required"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Calculate credits (document generation + summary if requested)
    const documentCredits = getDocumentCredits(document_format);
    const summaryCredits = include_summary ? 1 : 0; // 1 credit for summary generation
    const totalCredits = documentCredits + summaryCredits;
    // Deduct credits
    const { data: creditResult, error: creditError } = await supabase.rpc('deduct_organization_credits', {
      p_organization_id: organizationId,
      p_credits_to_deduct: totalCredits,
      p_source: 'document_generation',
      p_source_reference: request_id,
      p_description: `Document generation - ${document_format}${include_summary ? ' + summary' : ''}`
    });
    if (creditError || !creditResult?.success) {
      return new Response(JSON.stringify({
        error: creditResult?.error || "Credit deduction failed"
      }), {
        status: 402,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Generate document and summary with OpenAI
    let generatedDocument = "";
    let generatedSummary = "";
    if (document_format === 'dictation') {
      generatedDocument = transcript_text;
      // Even for dictation, generate a summary if requested
      if (include_summary) {
        const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openAIApiKey) {
          throw new Error("OpenAI API key not configured");
        }
        const openai = new OpenAI({
          apiKey: openAIApiKey
        });
        const summaryCompletion = await openai.chat.completions.create({
          model: model_name,
          messages: [
            {
              role: "system",
              content: "You are an expert medical professional specializing in creating concise consultation summaries. You must ONLY use information explicitly mentioned in the provided transcript. Do NOT add, infer, or hallucinate any medical information not directly stated in the conversation."
            },
            {
              role: "user",
              content: getSummaryPrompt(transcript_text)
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
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
      // Generate document
      const documentPrompt = getPromptForFormat(document_format, transcript_text);
      const documentCompletion = await openai.chat.completions.create({
        model: model_name,
        messages: [
          {
            role: "system",
            content: "You are an expert medical professional specializing in creating accurate and comprehensive medical documentation from transcripts. You must ONLY use information explicitly mentioned in the provided transcript. Do NOT add, infer, or hallucinate any medical information not directly stated in the conversation. If specific information is not mentioned in the transcript, clearly indicate 'Not mentioned in transcript' or leave the section blank rather than making assumptions."
          },
          {
            role: "user",
            content: documentPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      });
      generatedDocument = documentCompletion.choices[0]?.message?.content || "";
      // Generate summary if requested
      if (include_summary) {
        const summaryCompletion = await openai.chat.completions.create({
          model: model_name,
          messages: [
            {
              role: "system",
              content: "You are an expert medical professional specializing in creating concise consultation summaries. You must ONLY use information explicitly mentioned in the provided transcript. Do NOT add, infer, or hallucinate any medical information not directly stated in the conversation."
            },
            {
              role: "user",
              content: getSummaryPrompt(transcript_text)
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
      activityType: 'document_generation',
      creditsUsed: totalCredits,
      requestId: request_id,
      documentFormat: document_format,
      modelUsed: model_name,
      processingTimeMs: processingTime,
      metadata: {
        transcript_length: transcript_text.length,
        include_summary: include_summary,
        summary_generated: !!generatedSummary
      }
    });

    // Handle storage if organization allows it
    if (organization.data_storage_preference === 'temporary' || organization.data_storage_preference === 'permanent') {
      const expiresAt = new Date();
      if (organization.data_storage_preference === 'temporary') {
        expiresAt.setHours(expiresAt.getHours() + 48); // 48 hour expiry
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year for permanent
      }
      await supabase.from('temp_transcriptions').insert({
        organization_id: organizationId,
        request_id: request_id,
        transcription_data: {
          text: transcript_text,
          utterances: [],
          isMock: false,
          provider: "text_input"
        },
        document_data: {
          document: generatedDocument,
          summary: generatedSummary,
          format: document_format,
          model_used: model_name
        },
        metadata: {
          input_type: "text",
          text_length: transcript_text.length,
          model_name: model_name,
          processing_time_ms: processingTime,
          summary_included: include_summary
        },
        expires_at: expiresAt.toISOString()
      });
    }
    const response = {
      success: true,
      request_id: request_id,
      transcription: {
        text: transcript_text,
        utterances: [],
        isMock: false,
        provider: "text_input"
      },
      document: generatedDocument,
      summary: generatedSummary,
      document_format: document_format,
      credits_used: totalCredits,
      processing_time_ms: processingTime,
      organization_id: organizationId
    };
    // Send webhook if configured
    if (organization.webhook_url) {
      try {
        const webhookPayload = {
          event: "document.generated",
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
    console.error("Document generation API error:", error);
    success = false;
    errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({
      error: "Document generation failed",
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
  //       function_called: 'generate_document',
  //       endpoint: '/functions/v1/b2b-document-generation',
  //       credits_used: success ? getDocumentCredits(document_format) : 0,
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
    'oncology': 4,
    'pediatric': 3,
    'prenatal': 3,
    'followup': 2,
    'referral': 2,
    'medication': 2,
    'custom': 3
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

**Next Steps:** [Only the specific follow-up plans or referrals mentioned]

CRITICAL INSTRUCTIONS:
- You MUST ONLY use information explicitly mentioned in the provided transcript
- Do NOT add, infer, assume, or create any medical information not directly stated
- Keep the summary concise but comprehensive
- If information for any section is not mentioned in the transcript, state "Not discussed in this consultation"
- Be conservative and accurate - only document what was actually discussed`;
}
function getPromptForFormat(format, conversationText) {
  // Anti-hallucination clause to be added to all prompts
  const antiHallucinationClause = `

CRITICAL INSTRUCTIONS:
- You MUST ONLY use information explicitly mentioned in the provided transcript
- Do NOT add, infer, assume, or create any medical information not directly stated
- Be conservative and accurate - only document what was actually discussed
- If a section cannot be completed due to missing information, clearly state this rather than making assumptions`;
  const prompts = {
    'soap': `Analyze this medical conversation and create comprehensive SOAP notes:

${conversationText}

Please create detailed SOAP notes with:
- Subjective: Patient's history, complaints, and self-reported symptoms (ONLY as mentioned in transcript)
- Objective: Clinical observations, vital signs, test results mentioned (ONLY as stated in transcript)
- Assessment: Provider's diagnostic impressions and conclusions (ONLY as stated in transcript)
- Plan: Treatment plans, medications, follow-ups, and referrals (ONLY as discussed in transcript)

Format professionally as would appear in an Electronic Health Record.${antiHallucinationClause}`,
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
