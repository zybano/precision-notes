import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NIGERIA_COUNTRY_CODE = 'NG';

serve(async (req) => {
    // Handle preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Parse the request body
        const { packageId, quantity, successUrl, cancelUrl, regionCode } = await req.json();

        // Validate inputs
        if ((!packageId && !quantity) || !successUrl || !cancelUrl) {
            return new Response(
                JSON.stringify({ error: "Missing required parameters" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create Supabase client using the anon key for user authentication
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? ""
        );

        // Get authenticated user
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Missing Authorization header" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

        if (userError || !userData.user) {
            return new Response(
                JSON.stringify({ error: "Authentication failed", details: userError?.message }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const user = userData.user;

        // Initialize Stripe
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
            apiVersion: "2023-10-16",
        });

        // Check if a Stripe customer exists for this user
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        let customerId;

        if (customers.data.length > 0) {
            customerId = customers.data[0].id;
        } else {
            // Create a new customer if one doesn't exist
            const newCustomer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    user_id: user.id
                }
            });
            customerId = newCustomer.id;
        }

        // First, fetch the consultation package
        let packageQuery = supabaseClient
            .from('consultation_packages')
            .select('*')
            .eq('is_active', true);

        if (packageId) {
            packageQuery = packageQuery.eq('id', packageId);
        } else if (quantity) {
            packageQuery = packageQuery.eq('quantity', quantity);
        }

        const { data: packages, error: packagesError } = await packageQuery.limit(1);

        if (packagesError || !packages || packages.length === 0) {
            return new Response(
                JSON.stringify({ error: "Package not found", details: packagesError?.message }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const consultationPackage = packages[0];
        let priceAmount = consultationPackage.price;
        let currencyCode = 'usd';
        let packageName = `${consultationPackage.quantity} Consultations`;

        // Check if we need to use regional pricing
        const isNigeria = regionCode === NIGERIA_COUNTRY_CODE;
        if (isNigeria) {
            // Fetch regional pricing
            const { data: regionalPricing, error: regionalError } = await supabaseClient
                .from('regional_consultation_pricing')
                .select('*')
                .eq('package_id', consultationPackage.id)
                .eq('country_code', NIGERIA_COUNTRY_CODE)
                .eq('is_active', true)
                .limit(1);

            if (!regionalError && regionalPricing && regionalPricing.length > 0) {
                priceAmount = regionalPricing[0].price;
                currencyCode = regionalPricing[0].currency.toLowerCase();
            }
        }

        // For demo/development purposes, create temporary product and price
        const product = await stripe.products.create({
            name: packageName,
            description: `${consultationPackage.quantity} Consultations for Precision Notes`,
        });

        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: priceAmount,
            currency: currencyCode,
        });

        // Create a checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: price.id,
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: successUrl,
            cancel_url: cancelUrl,
            payment_intent_data: {
                metadata: {
                    user_id: user.id,
                    package_id: consultationPackage.id,
                    quantity: consultationPackage.quantity,
                    region_code: regionCode || 'global'
                }
            },
            metadata: {
                user_id: user.id,
                package_id: consultationPackage.id,
                quantity: consultationPackage.quantity,
                region_code: regionCode || 'global'
            }
        });

        // Return the session URL
        return new Response(
            JSON.stringify({ url: session.url }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error creating checkout session:", error);

        return new Response(
            JSON.stringify({ error: error.message || "Failed to create checkout session" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});