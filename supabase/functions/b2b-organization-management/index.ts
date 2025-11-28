// Debug Version - B2B Organization Management API
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    // Debug logging
    const url = new URL(req.url);
    console.log("Full URL:", req.url);
    console.log("Pathname:", url.pathname);
    console.log("Method:", req.method);
    // Get the path segments
    const pathSegments = url.pathname.split('/').filter((segment)=>segment !== '');
    console.log("Path segments:", pathSegments);
    // Get the last segment (should be the action)
    const path = pathSegments[pathSegments.length - 1];
    console.log("Extracted path:", path);
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    // Route handler with debugging
    console.log(`Processing ${req.method} request for path: ${path}`);
    switch(req.method){
      case "POST":
        if (path === "create") {
          console.log("Routing to createOrganization");
          return await createOrganization(req, supabase);
        } else if (path === "b2b-organization-management") {
          console.log("Routing to createOrganization");
          return await createOrganization(req, supabase);
        } else if (path === "credits") {
          console.log("Routing to manageCredits");
          return await manageCredits(req, supabase);
        } else if (path === "rotate-key") {
          console.log("Routing to rotateApiKey");
          return await rotateApiKey(req, supabase);
        } else {
          console.log("No POST route found for path:", path);
        }
        break;
      case "GET":
        if (path === "usage") {
          console.log("Routing to getUsageStats");
          return await getUsageStats(req, supabase);
        } else if (path === "list") {
          console.log("Routing to listOrganizations");
          return await listOrganizations(req, supabase);
        } else {
          console.log("No GET route found for path:", path);
        }
        break;
      case "PUT":
        // For PUT requests, we might not have a specific path
        if (pathSegments.length >= 4) {
          console.log("Routing to updateOrganization");
          return await updateOrganization(req, supabase);
        }
        break;
      case "DELETE":
        // For DELETE requests, we might not have a specific path
        if (pathSegments.length >= 4) {
          console.log("Routing to deleteOrganization");
          return await deleteOrganization(req, supabase);
        }
        break;
    }
    // If we get here, no route was found
    console.log("No route found for:", req.method, path);
    console.log("Available routes:");
    console.log("POST: create, credits, rotate-key");
    console.log("GET: usage, list");
    console.log("PUT: (base path)");
    console.log("DELETE: (base path)");
    return new Response(JSON.stringify({
      error: "Route not found",
      debug: {
        method: req.method,
        pathname: url.pathname,
        extractedPath: path,
        pathSegments: pathSegments,
        availableRoutes: {
          POST: [
            "create",
            "credits",
            "rotate-key"
          ],
          GET: [
            "usage",
            "list"
          ],
          PUT: [
            "(base path)"
          ],
          DELETE: [
            "(base path)"
          ]
        }
      }
    }), {
      status: 404,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Organization management error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
// Rest of your functions remain the same...
async function createOrganization(req, supabase) {
  try {
    const body = await req.json();
    const { name, contact_email, contact_name, industry, initial_credits = 0, rate_limit_per_hour = 1000, allowed_document_types = [
      'soap',
      'progress',
      'h&p',
      'discharge',
      'consultation'
    ] } = body;
    if (!name) {
      return new Response(JSON.stringify({
        error: "Organization name is required"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const { data, error } = await supabase.rpc('create_organization', {
      p_name: name,
      p_contact_email: contact_email,
      p_contact_name: contact_name,
      p_industry: industry,
      p_initial_credits: initial_credits,
      p_rate_limit_per_hour: rate_limit_per_hour,
      p_allowed_document_types: allowed_document_types
    });
    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    return new Response(JSON.stringify(data), {
      status: 201,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Invalid request body"
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
}
async function manageCredits(req, supabase) {
  try {
    const body = await req.json();
    const { organization_id, credit_adjustment, description } = body;
    if (!organization_id || typeof credit_adjustment !== 'number') {
      return new Response(JSON.stringify({
        error: "Organization ID and credit adjustment are required"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const { data, error } = await supabase.rpc('manage_organization_credits', {
      p_organization_id: organization_id,
      p_credit_adjustment: credit_adjustment,
      p_description: description
    });
    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Invalid request body"
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
}
async function rotateApiKey(req, supabase) {
  try {
    const body = await req.json();
    const { organization_id } = body;
    if (!organization_id) {
      return new Response(JSON.stringify({
        error: "Organization ID is required"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const { data, error } = await supabase.rpc('rotate_organization_api_key', {
      p_organization_id: organization_id
    });
    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Invalid request body"
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
}
async function getUsageStats(req, supabase) {
  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organization_id');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    if (!organizationId) {
      return new Response(JSON.stringify({
        error: "Organization ID is required"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const { data, error } = await supabase.rpc('get_organization_usage', {
      p_organization_id: organizationId,
      p_start_date: startDate,
      p_end_date: endDate
    });
    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Invalid request"
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
}
async function listOrganizations(req, supabase) {
  try {
    const { data, error } = await supabase.from('organizations').select('id, name, contact_email, credits, rate_limit_per_hour, is_active, created_at, total_requests').order('created_at', {
      ascending: false
    });
    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    return new Response(JSON.stringify({
      organizations: data
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Failed to list organizations"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
}
async function updateOrganization(req, supabase) {
  try {
    const body = await req.json();
    const { organization_id, ...updates } = body;
    if (!organization_id) {
      return new Response(JSON.stringify({
        error: "Organization ID is required"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const allowedUpdates = {
      name: updates.name,
      contact_email: updates.contact_email,
      contact_name: updates.contact_name,
      industry: updates.industry,
      webhook_url: updates.webhook_url,
      data_storage_preference: updates.data_storage_preference,
      allowed_document_types: updates.allowed_document_types,
      rate_limit_per_hour: updates.rate_limit_per_hour,
      is_active: updates.is_active,
      updated_at: new Date().toISOString()
    };
    Object.keys(allowedUpdates).forEach((key)=>allowedUpdates[key] === undefined && delete allowedUpdates[key]);
    const { data, error } = await supabase.from('organizations').update(allowedUpdates).eq('id', organization_id).select().single();
    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      organization: data
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Invalid request body"
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
}
async function deleteOrganization(req, supabase) {
  try {
    const body = await req.json();
    const { organization_id } = body;
    if (!organization_id) {
      return new Response(JSON.stringify({
        error: "Organization ID is required"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const { data, error } = await supabase.from('organizations').update({
      is_active: false,
      updated_at: new Date().toISOString()
    }).eq('id', organization_id).select().single();
    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      message: "Organization deactivated successfully",
      organization: data
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Invalid request body"
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
}
