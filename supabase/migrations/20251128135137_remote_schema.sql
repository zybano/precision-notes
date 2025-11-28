

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."add_user_credits"("p_user_id" "uuid", "p_amount" integer, "p_expiry_months" integer DEFAULT 12, "p_source" "text" DEFAULT 'purchase'::"text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    current_balance integer := 0;
    current_earned integer := 0;
    new_balance integer;
    new_earned integer;
    expiry_date timestamp with time zone;
BEGIN
    -- Calculate expiry date
    expiry_date := now() + (p_expiry_months || ' months')::interval;
    
    -- Try to get current values
    SELECT balance, total_earned INTO current_balance, current_earned
    FROM user_credits
    WHERE user_id = p_user_id;
    
    -- Calculate new values
    new_balance := COALESCE(current_balance, 0) + p_amount;
    new_earned := COALESCE(current_earned, 0) + p_amount;
    
    -- Upsert credits record
    INSERT INTO user_credits (
        user_id,
        balance,
        total_earned,
        total_used,
        expires_at,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_amount,
        p_amount,
        0,
        expiry_date,
        now(),
        now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        balance = new_balance,
        total_earned = new_earned,
        expires_at = GREATEST(user_credits.expires_at, expiry_date),
        updated_at = now();
    
    -- Log the operation
    PERFORM log_credit_operation(
        p_user_id,
        'ADD_SUCCESS',
        p_amount,
        COALESCE(current_balance, 0),
        new_balance,
        jsonb_build_object('source', p_source, 'expires_at', expiry_date)
    );
    
    -- Record transaction
    INSERT INTO transaction_history (
        user_id,
        amount,
        currency,
        payment_provider,
        transaction_type,
        status,
        metadata
    ) VALUES (
        p_user_id,
        p_amount,
        'CREDITS',
        'system',
        'credit',
        'completed',
        jsonb_build_object('source', p_source, 'expires_at', expiry_date)
    );
    
    RETURN new_balance;
END;
$$;


ALTER FUNCTION "public"."add_user_credits"("p_user_id" "uuid", "p_amount" integer, "p_expiry_months" integer, "p_source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_column_exists"("p_table_name" "text", "p_column_name" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = p_table_name
        AND column_name = p_column_name
    );
END;
$$;


ALTER FUNCTION "public"."check_column_exists"("p_table_name" "text", "p_column_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_admin_session"("p_admin_user_id" "uuid", "p_auth_user_id" "uuid", "p_session_token" "text", "p_ip_address" "inet" DEFAULT NULL::"inet", "p_user_agent" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_session_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Set session to expire in 24 hours
    v_expires_at := NOW() + INTERVAL '24 hours';
    
    -- Clean up expired sessions for this admin user
    DELETE FROM admin_user_sessions 
    WHERE admin_user_id = p_admin_user_id 
    AND expires_at < NOW();
    
    -- Create new session
    INSERT INTO admin_user_sessions (
        admin_user_id, 
        auth_user_id, 
        session_token, 
        expires_at,
        ip_address,
        user_agent
    )
    VALUES (
        p_admin_user_id, 
        p_auth_user_id, 
        p_session_token, 
        v_expires_at,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO v_session_id;
    
    -- Update last login time
    UPDATE admin_users 
    SET last_login_at = NOW(), updated_at = NOW()
    WHERE id = p_admin_user_id;
    
    RETURN v_session_id;
END;
$$;


ALTER FUNCTION "public"."create_admin_session"("p_admin_user_id" "uuid", "p_auth_user_id" "uuid", "p_session_token" "text", "p_ip_address" "inet", "p_user_agent" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_admin_session"("p_admin_user_id" "uuid", "p_auth_user_id" "uuid", "p_session_token" "text", "p_ip_address" "inet", "p_user_agent" "text") IS 'Creates a new admin session after successful login';



CREATE OR REPLACE FUNCTION "public"."create_admin_user"("p_email" "text", "p_password" "text", "p_name" "text", "p_role" "text" DEFAULT 'admin'::"text", "p_permissions" "jsonb" DEFAULT '{"settings": false, "analytics": true, "organizations": true}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_admin_id UUID;
    v_password_hash TEXT;
BEGIN
    -- Hash the password using crypt
    v_password_hash := crypt(p_password, gen_salt('bf'));
    
    -- Insert the admin user
    INSERT INTO admin_users (email, password_hash, name, role, permissions)
    VALUES (p_email, v_password_hash, p_name, p_role, p_permissions)
    RETURNING id INTO v_admin_id;
    
    RETURN v_admin_id;
END;
$$;


ALTER FUNCTION "public"."create_admin_user"("p_email" "text", "p_password" "text", "p_name" "text", "p_role" "text", "p_permissions" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_admin_user"("p_email" "text", "p_password" "text", "p_name" "text", "p_role" "text", "p_permissions" "jsonb") IS 'Creates a new admin user with hashed password';



CREATE OR REPLACE FUNCTION "public"."create_document_with_credit_check"("p_user_id" "uuid", "p_title" "text", "p_type" "text", "p_patient_name" "text", "p_notes" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_document_id UUID;
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- Check if user has credits
    SELECT balance INTO v_current_balance
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE; -- Lock the row to prevent race conditions

    IF v_current_balance IS NULL OR v_current_balance < 1 THEN
        RAISE EXCEPTION 'Insufficient credits: user has % credits, needs 1', COALESCE(v_current_balance, 0);
    END IF;

    -- Create the document
    INSERT INTO medical_documents (
        title,
        type,
        patient_name,
        notes,
        creator_id,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_title,
        p_type,
        p_patient_name,
        p_notes,
        p_user_id,
        'Draft',
        NOW(),
        NOW()
    ) RETURNING id INTO v_document_id;

    -- Deduct credit
    v_new_balance := deduct_user_credits(p_user_id, 1);

    -- Record in credit_transactions
    INSERT INTO credit_transactions (
        user_id,
        amount,
        transaction_type,
        source,
        source_reference,
        balance_before,
        balance_after,
        metadata
    ) VALUES (
        p_user_id,
        -1,
        'used',
        'usage',
        v_document_id::VARCHAR,
        v_current_balance,
        v_new_balance,
        jsonb_build_object(
            'document_id', v_document_id,
            'document_title', p_title,
            'document_type', p_type
        )
    );

    RETURN v_document_id;
END;
$$;


ALTER FUNCTION "public"."create_document_with_credit_check"("p_user_id" "uuid", "p_title" "text", "p_type" "text", "p_patient_name" "text", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_get_shared_documents_function"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Function already created above
    RETURN;
END;
$$;


ALTER FUNCTION "public"."create_get_shared_documents_function"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_get_user_documents_function"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Function already created above
    RETURN;
END;
$$;


ALTER FUNCTION "public"."create_get_user_documents_function"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_organization"("p_name" "text", "p_contact_email" "text" DEFAULT NULL::"text", "p_contact_name" "text" DEFAULT NULL::"text", "p_industry" "text" DEFAULT NULL::"text", "p_initial_credits" integer DEFAULT 0, "p_rate_limit_per_hour" integer DEFAULT 1000, "p_allowed_document_types" "text"[] DEFAULT ARRAY['soap'::"text", 'progress'::"text", 'h&p'::"text", 'discharge'::"text", 'consultation'::"text"]) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_org_id UUID;
    new_api_key TEXT;
    result JSON;
    safe_initial_credits INTEGER;
BEGIN
    -- Ensure we have a safe value for initial credits
    safe_initial_credits := COALESCE(p_initial_credits, 0);
    
    -- Generate unique API key
    new_api_key := 'pn_' || encode(gen_random_bytes(24), 'base64');
    
    -- Insert new organization
    INSERT INTO organizations (
        name, 
        contact_email, 
        contact_name, 
        industry, 
        api_key, 
        credits, 
        rate_limit_per_hour, 
        allowed_document_types
    ) VALUES (
        p_name, 
        p_contact_email, 
        p_contact_name, 
        p_industry, 
        new_api_key, 
        safe_initial_credits, 
        p_rate_limit_per_hour, 
        p_allowed_document_types
    ) RETURNING id INTO new_org_id;
    
    -- Only log transaction if there are initial credits > 0
    IF safe_initial_credits > 0 THEN
        INSERT INTO organization_credit_transactions (
            organization_id,
            transaction_type,        -- Must be: 'earned', 'used', 'expired', 'adjustment', 'refund'
            amount,
            balance_before,
            balance_after,
            source,                  -- Must be: 'manual_addition', 'api_usage', 'transcription', 'document_generation', 'admin_adjustment', 'expiry'
            source_reference,
            description,
            credit_adjustment,
            previous_balance,
            new_balance
        ) VALUES (
            new_org_id,
            'adjustment',                -- ✅ Allowed transaction_type
            safe_initial_credits,        -- amount
            0,                          -- balance_before
            safe_initial_credits,       -- balance_after
            'admin_adjustment',         -- ✅ Allowed source
            'organization_creation',    -- source_reference
            'Initial credit allocation', -- description
            safe_initial_credits,       -- credit_adjustment
            0,                         -- previous_balance
            safe_initial_credits       -- new_balance
        );
    END IF;
    
    -- Return organization details
    SELECT json_build_object(
        'id', new_org_id,
        'name', p_name,
        'contact_email', p_contact_email,
        'contact_name', p_contact_name,
        'industry', p_industry,
        'api_key', new_api_key,
        'credits', safe_initial_credits,
        'rate_limit_per_hour', p_rate_limit_per_hour,
        'allowed_document_types', p_allowed_document_types,
        'is_active', true,
        'created_at', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."create_organization"("p_name" "text", "p_contact_email" "text", "p_contact_name" "text", "p_industry" "text", "p_initial_credits" integer, "p_rate_limit_per_hour" integer, "p_allowed_document_types" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."daily_credit_maintenance"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_expired_count INTEGER := 0;
    v_anomaly_count INTEGER := 0;
    v_result JSONB;
BEGIN
    -- Run credit expiry
    SELECT COUNT(*) INTO v_expired_count
    FROM expire_user_credits();

    -- Detect anomalies
    SELECT COUNT(*) INTO v_anomaly_count
    FROM detect_credit_anomalies();

    v_result := jsonb_build_object(
        'job_run_at', NOW(),
        'expired_users_count', v_expired_count,
        'anomalies_detected', v_anomaly_count,
        'status', 'completed'
    );

    -- Log the maintenance run
    INSERT INTO audit_logs (
        action,
        table_name,
        metadata,
        created_at
    ) VALUES (
        'DAILY_CREDIT_MAINTENANCE',
        'user_credits',
        v_result,
        NOW()
    );

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."daily_credit_maintenance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_organization_credits"("p_organization_id" "uuid", "p_credits_to_deduct" integer, "p_source" "text", "p_source_reference" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current balance with row lock to prevent race conditions
  SELECT credits INTO current_balance
  FROM organizations 
  WHERE id = p_organization_id AND is_active = true
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Organization not found or inactive'
    );
  END IF;

  -- Check if sufficient credits
  IF current_balance < p_credits_to_deduct THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'required', p_credits_to_deduct,
      'available', current_balance
    );
  END IF;

  -- Calculate new balance
  new_balance := current_balance - p_credits_to_deduct;

  -- Update organization credits
  UPDATE organizations 
  SET 
    credits = new_balance,
    total_requests = total_requests + 1,
    updated_at = NOW()
  WHERE id = p_organization_id;

  -- Log the transaction
  INSERT INTO organization_credit_transactions (
    organization_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    source,
    source_reference,
    description
  ) VALUES (
    p_organization_id,
    'used',
    p_credits_to_deduct,
    current_balance,
    new_balance,
    p_source,
    p_source_reference,
    p_description
  );

  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', current_balance,
    'new_balance', new_balance,
    'credits_deducted', p_credits_to_deduct
  );
END;
$$;


ALTER FUNCTION "public"."deduct_organization_credits"("p_organization_id" "uuid", "p_credits_to_deduct" integer, "p_source" "text", "p_source_reference" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_user_credits"("p_user_id" "uuid", "p_amount" integer) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    current_balance integer;
    new_balance integer;
BEGIN
    -- Get current balance with row lock
    SELECT balance INTO current_balance
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- Check if record exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User credits record not found';
    END IF;
    
    -- Check if user has enough credits
    IF current_balance < p_amount THEN
        -- Log the failed attempt
        PERFORM log_credit_operation(
            p_user_id,
            'DEDUCT_FAILED',
            p_amount,
            current_balance,
            current_balance,
            jsonb_build_object('reason', 'insufficient_credits', 'requested', p_amount, 'available', current_balance)
        );
        RAISE EXCEPTION 'Insufficient credits: has %, needs %', current_balance, p_amount;
    END IF;
    
    -- Calculate new balance
    new_balance := current_balance - p_amount;
    
    -- Update balance and total_used atomically
    UPDATE user_credits
    SET 
        balance = new_balance,
        total_used = total_used + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Log the successful operation
    PERFORM log_credit_operation(
        p_user_id,
        'DEDUCT_SUCCESS',
        p_amount,
        current_balance,
        new_balance,
        jsonb_build_object('action', 'document_creation')
    );
    
    -- Record transaction
    INSERT INTO transaction_history (
        user_id,
        amount,
        currency,
        payment_provider,
        transaction_type,
        status,
        metadata
    ) VALUES (
        p_user_id,
        -p_amount,
        'CREDITS',
        'system',
        'usage',
        'completed',
        jsonb_build_object('action', 'document_creation')
    );
    
    RETURN new_balance;
END;
$$;


ALTER FUNCTION "public"."deduct_user_credits"("p_user_id" "uuid", "p_amount" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."detect_credit_anomalies"() RETURNS TABLE("user_id" "uuid", "anomaly_type" "text", "details" "jsonb", "detected_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Detect users with negative balances (should never happen)
    RETURN QUERY
    SELECT 
        uc.user_id,
        'NEGATIVE_BALANCE'::text,
        jsonb_build_object('balance', uc.balance),
        now()
    FROM user_credits uc
    WHERE uc.balance < 0;
    
    -- Detect users with illogical total calculations
    RETURN QUERY
    SELECT 
        uc.user_id,
        'INVALID_TOTALS'::text,
        jsonb_build_object(
            'balance', uc.balance,
            'total_earned', uc.total_earned,
            'total_used', uc.total_used,
            'calculated_balance', uc.total_earned - uc.total_used
        ),
        now()
    FROM user_credits uc
    WHERE uc.balance != (uc.total_earned - uc.total_used);
    
    -- Detect unusual large single-day credit usage
    RETURN QUERY
    SELECT 
        th.user_id,
        'HIGH_DAILY_USAGE'::text,
        jsonb_build_object('daily_usage', daily_usage.total_used),
        now()
    FROM (
        SELECT 
            user_id,
            DATE(created_at) as usage_date,
            SUM(ABS(amount)) as total_used
        FROM transaction_history
        WHERE transaction_type = 'usage'
        AND created_at >= now() - interval '24 hours'
        GROUP BY user_id, DATE(created_at)
        HAVING SUM(ABS(amount)) > 100  -- More than 100 credits in one day
    ) daily_usage
    JOIN transaction_history th ON th.user_id = daily_usage.user_id;
END;
$$;


ALTER FUNCTION "public"."detect_credit_anomalies"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_user_subscription_data"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Check if the user already has subscription_tier in metadata
  IF NEW.raw_user_meta_data->>'subscription_tier' IS NULL THEN
    -- Update the user metadata to include subscription_tier as 'free'
    NEW.raw_user_meta_data = 
      CASE 
        WHEN NEW.raw_user_meta_data IS NULL THEN 
          jsonb_build_object('subscription_tier', 'free')
        ELSE 
          NEW.raw_user_meta_data || jsonb_build_object('subscription_tier', 'free')
      END;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_user_subscription_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."example_operation_with_request_tracking"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Perform your main operation
    -- Then increment requests
    PERFORM increment_organization_requests(NEW.organization_id);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."example_operation_with_request_tracking"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_user_credits"("p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("user_id" "uuid", "expired_credits" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_record RECORD;
    v_expired_amount INTEGER;
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- If specific user provided, process only that user, otherwise process all users with expired credits
    FOR v_user_record IN 
        SELECT uc.user_id, uc.balance, uc.expires_at
        FROM user_credits uc
        WHERE (p_user_id IS NULL OR uc.user_id = p_user_id)
        AND uc.expires_at IS NOT NULL 
        AND uc.expires_at <= NOW()
        AND uc.balance > 0
    LOOP
        v_current_balance := v_user_record.balance;
        v_expired_amount := v_current_balance; -- Expire all current credits
        v_new_balance := 0;

        -- Update user credits to zero out expired credits
        UPDATE user_credits 
        SET 
            balance = 0,
            updated_at = NOW(),
            expires_at = NULL -- Clear expiry date after expiring
        WHERE user_credits.user_id = v_user_record.user_id;

        -- Record expiry in credit_transactions
        INSERT INTO credit_transactions (
            user_id,
            amount,
            transaction_type,
            source,
            source_reference,
            balance_before,
            balance_after,
            metadata
        ) VALUES (
            v_user_record.user_id,
            -v_expired_amount,
            'expired',
            'expiry',
            'automatic_expiry',
            v_current_balance,
            v_new_balance,
            jsonb_build_object(
                'expired_at', NOW(),
                'original_expiry_date', v_user_record.expires_at
            )
        );

        -- Log in audit logs
        PERFORM log_credit_operation(
            v_user_record.user_id,
            'CREDITS_EXPIRED',
            v_expired_amount,
            v_current_balance,
            v_new_balance,
            jsonb_build_object('expired_at', NOW(), 'original_expiry_date', v_user_record.expires_at)
        );

        -- Return the result
        user_id := v_user_record.user_id;
        expired_credits := v_expired_amount;
        RETURN NEXT;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."expire_user_credits"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fix_user_credit_discrepancies"("p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("user_id" "uuid", "old_balance" integer, "new_balance" integer, "old_total_earned" integer, "new_total_earned" integer, "action_taken" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_record RECORD;
    v_calculated_earned INTEGER;
    v_calculated_used INTEGER;
    v_calculated_balance INTEGER;
BEGIN
    FOR v_user_record IN 
        SELECT 
            uc.user_id,
            uc.balance,
            uc.total_earned,
            uc.total_used,
            -- Calculate what totals should be based on credit_transactions
            COALESCE(SUM(CASE WHEN ct.transaction_type = 'earned' THEN ct.amount ELSE 0 END), 0) as calc_earned,
            COALESCE(SUM(CASE WHEN ct.transaction_type = 'used' THEN ABS(ct.amount) ELSE 0 END), 0) as calc_used
        FROM user_credits uc
        LEFT JOIN credit_transactions ct ON ct.user_id = uc.user_id
        WHERE (p_user_id IS NULL OR uc.user_id = p_user_id)
        GROUP BY uc.user_id, uc.balance, uc.total_earned, uc.total_used
        HAVING 
            -- Only process users with discrepancies
            uc.balance != (uc.total_earned - uc.total_used)
            OR uc.total_earned != COALESCE(SUM(CASE WHEN ct.transaction_type = 'earned' THEN ct.amount ELSE 0 END), 0)
    LOOP
        v_calculated_earned := v_user_record.calc_earned;
        v_calculated_used := v_user_record.calc_used;
        v_calculated_balance := v_calculated_earned - v_calculated_used;

        -- Update the user_credits record
        UPDATE user_credits 
        SET 
            balance = v_calculated_balance,
            total_earned = v_calculated_earned,
            total_used = v_calculated_used,
            updated_at = NOW()
        WHERE user_credits.user_id = v_user_record.user_id;

        -- Log the fix
        PERFORM log_credit_operation(
            v_user_record.user_id,
            'DISCREPANCY_FIXED',
            0,
            v_user_record.balance,
            v_calculated_balance,
            jsonb_build_object(
                'old_balance', v_user_record.balance,
                'old_earned', v_user_record.total_earned,
                'old_used', v_user_record.total_used,
                'new_balance', v_calculated_balance,
                'new_earned', v_calculated_earned,
                'new_used', v_calculated_used
            )
        );

        -- Return the result
        user_id := v_user_record.user_id;
        old_balance := v_user_record.balance;
        new_balance := v_calculated_balance;
        old_total_earned := v_user_record.total_earned;
        new_total_earned := v_calculated_earned;
        action_taken := 'Recalculated from credit_transactions';
        RETURN NEXT;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."fix_user_credit_discrepancies"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_organization_request_usage"("p_org_id" "uuid") RETURNS TABLE("total_requests" bigint, "request_limit" bigint, "remaining_requests" bigint, "is_limit_exceeded" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Return the usage details with explicit column selection
    RETURN QUERY 
    SELECT 
        COALESCE(organizations.total_requests, 0)::BIGINT AS total_requests,
        COALESCE(organizations.rate_limit_per_hour, 1000)::BIGINT AS request_limit,
        GREATEST(0, COALESCE(organizations.rate_limit_per_hour, 1000) - COALESCE(organizations.total_requests, 0))::BIGINT AS remaining_requests,
        COALESCE(organizations.total_requests, 0) >= COALESCE(organizations.rate_limit_per_hour, 1000) AS is_limit_exceeded
    FROM 
        organizations
    WHERE 
        organizations.id = p_org_id;
END;
$$;


ALTER FUNCTION "public"."get_organization_request_usage"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_organization_usage"("p_organization_id" "uuid", "p_start_date" "date" DEFAULT NULL::"date", "p_end_date" "date" DEFAULT NULL::"date") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    result JSON;
BEGIN
    -- Set default dates if not provided
    start_date := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
    end_date := COALESCE(p_end_date, CURRENT_DATE);
    
    -- Verify organization exists
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_organization_id) THEN
        RAISE EXCEPTION 'Organization not found';
    END IF;
    
    -- Build usage statistics (handle empty logs table)
    SELECT COALESCE(
        json_build_object(
            'organization_id', p_organization_id,
            'period', json_build_object(
                'start_date', start_date,
                'end_date', end_date
            ),
            'total_requests', COUNT(*),
            'total_credits_used', COALESCE(SUM(credits_used), 0),
            'successful_requests', COUNT(*) FILTER (WHERE success = true),
            'failed_requests', COUNT(*) FILTER (WHERE success = false),
            'average_processing_time_ms', ROUND(AVG(processing_time_ms)),
            'requests_by_type', CASE 
                WHEN COUNT(*) > 0 THEN json_object_agg(request_type, COUNT(*))
                ELSE '{}'::json
            END,
            'daily_breakdown', COALESCE((
                SELECT json_agg(
                    json_build_object(
                        'date', date_trunc('day', created_at)::date,
                        'requests', COUNT(*),
                        'credits_used', SUM(credits_used)
                    )
                )
                FROM organization_usage_logs 
                WHERE organization_id = p_organization_id
                AND created_at::date BETWEEN start_date AND end_date
                GROUP BY date_trunc('day', created_at)
                ORDER BY date_trunc('day', created_at)
            ), '[]'::json)
        ),
        json_build_object(
            'organization_id', p_organization_id,
            'period', json_build_object(
                'start_date', start_date,
                'end_date', end_date
            ),
            'total_requests', 0,
            'total_credits_used', 0,
            'successful_requests', 0,
            'failed_requests', 0,
            'average_processing_time_ms', 0,
            'requests_by_type', '{}'::json,
            'daily_breakdown', '[]'::json
        )
    ) INTO result
    FROM organization_usage_logs
    WHERE organization_id = p_organization_id
    AND created_at::date BETWEEN start_date AND end_date;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_organization_usage"("p_organization_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_organization_usage"("p_organization_id" "uuid", "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  usage_stats RECORD;
  credit_stats RECORD;
  admin_user_id UUID;
BEGIN
  -- Get the current admin user
  admin_user_id := auth.uid();
  
  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = admin_user_id 
    AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.is_super_admin = true)
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions - admin access required';
  END IF;

  -- Set default date range (last 30 days if not specified)
  p_start_date := COALESCE(p_start_date, NOW() - INTERVAL '30 days');
  p_end_date := COALESCE(p_end_date, NOW());

  -- Get API usage statistics
  SELECT 
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE success = true) as successful_requests,
    COUNT(*) FILTER (WHERE success = false) as failed_requests,
    SUM(credits_used) as total_credits_used,
    AVG(processing_time_ms) as avg_processing_time_ms,
    SUM(request_size_mb) as total_data_processed_mb
  INTO usage_stats
  FROM api_usage_logs
  WHERE organization_id = p_organization_id 
    AND created_at BETWEEN p_start_date AND p_end_date;

  -- Get credit transaction summary
  SELECT 
    SUM(amount) FILTER (WHERE transaction_type = 'earned') as credits_earned,
    SUM(amount) FILTER (WHERE transaction_type = 'used') as credits_used,
    SUM(amount) FILTER (WHERE transaction_type = 'adjustment') as credits_adjusted
  INTO credit_stats
  FROM organization_credit_transactions
  WHERE organization_id = p_organization_id 
    AND created_at BETWEEN p_start_date AND p_end_date;

  RETURN jsonb_build_object(
    'organization_id', p_organization_id,
    'period', jsonb_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date
    ),
    'api_usage', jsonb_build_object(
      'total_requests', COALESCE(usage_stats.total_requests, 0),
      'successful_requests', COALESCE(usage_stats.successful_requests, 0),
      'failed_requests', COALESCE(usage_stats.failed_requests, 0),
      'success_rate', CASE 
        WHEN COALESCE(usage_stats.total_requests, 0) > 0 
        THEN ROUND((COALESCE(usage_stats.successful_requests, 0)::DECIMAL / usage_stats.total_requests) * 100, 2)
        ELSE 0 
      END,
      'avg_processing_time_ms', COALESCE(usage_stats.avg_processing_time_ms, 0),
      'total_data_processed_mb', COALESCE(usage_stats.total_data_processed_mb, 0)
    ),
    'credit_usage', jsonb_build_object(
      'credits_earned', COALESCE(credit_stats.credits_earned, 0),
      'credits_used', COALESCE(credit_stats.credits_used, 0),
      'credits_adjusted', COALESCE(credit_stats.credits_adjusted, 0),
      'net_credits', COALESCE(credit_stats.credits_earned, 0) - COALESCE(credit_stats.credits_used, 0) + COALESCE(credit_stats.credits_adjusted, 0)
    )
  );
END;
$$;


ALTER FUNCTION "public"."get_organization_usage"("p_organization_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."medical_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "type" "text" NOT NULL,
    "patient_name" "text" NOT NULL,
    "notes" "text",
    "status" "text" DEFAULT 'Draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "transcript_data" "text",
    "creator_id" "uuid",
    "recording_duration" integer,
    "document_format" "text",
    "summary" "text",
    "generated_title" "text"
);


ALTER TABLE "public"."medical_documents" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_shared_documents"("user_id" "uuid") RETURNS SETOF "public"."medical_documents"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    -- For now, this just returns an empty set since we don't have sharing implemented yet
    SELECT * FROM medical_documents WHERE false;
$$;


ALTER FUNCTION "public"."get_shared_documents"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_total_used"("user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
  total INTEGER;
BEGIN
  SELECT total_used INTO total FROM user_credits WHERE user_id = $1;
  RETURN COALESCE(total, 0);
END;
$_$;


ALTER FUNCTION "public"."get_total_used"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_credit_summary"("p_user_id" "uuid") RETURNS TABLE("current_balance" integer, "total_earned" integer, "total_used" integer, "expires_at" timestamp with time zone, "recent_transactions" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.balance,
        uc.total_earned,
        uc.total_used,
        uc.expires_at,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', ct.id,
                    'amount', ct.amount,
                    'type', ct.transaction_type,
                    'source', ct.source,
                    'created_at', ct.created_at,
                    'metadata', ct.metadata
                ) ORDER BY ct.created_at DESC
            )
            FROM credit_transactions ct
            WHERE ct.user_id = p_user_id
            AND ct.created_at >= NOW() - INTERVAL '30 days'
            LIMIT 10
        ) as recent_transactions
    FROM user_credits uc
    WHERE uc.user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_credit_summary"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_documents"("user_id" "uuid") RETURNS SETOF "public"."medical_documents"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT *
    FROM medical_documents
    WHERE creator_id = user_id
    ORDER BY updated_at DESC;
$$;


ALTER FUNCTION "public"."get_user_documents"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_subscription"("p_user_id" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "subscription_tier" "text", "is_annual_billing" boolean, "consultations_total" integer, "consultations_used" integer, "next_billing_date" timestamp with time zone, "payment_provider" "text", "payment_provider_subscription_id" "text", "status" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "plan_id" "uuid", "tier" "text", "plan_name" "text", "plan_description" "text", "features" "jsonb", "price_monthly" integer, "price_annual" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        usd.id,
        usd.user_id,
        usd.subscription_tier,
        usd.is_annual_billing,
        usd.consultations_total,
        usd.consultations_used,
        usd.next_billing_date,
        usd.payment_provider,
        usd.payment_provider_subscription_id,
        usd.status,
        usd.created_at,
        usd.updated_at,
        usd.plan_id,
        usd.tier,
        usd.plan_name,
        usd.plan_description,
        usd.features,
        usd.price_monthly,
        usd.price_annual
    FROM user_subscription_details usd
    WHERE usd.user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_subscription"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  free_plan_id uuid;
BEGIN
  -- Get the ID of the free plan
  SELECT id INTO free_plan_id 
  FROM public.subscription_plans 
  WHERE tier = 'free' 
  LIMIT 1;

  -- Create a subscription for the new user
  INSERT INTO public.user_subscriptions
  (
    user_id,
    subscription_tier,
    is_annual_billing,
    consultations_total,
    consultations_used,
    created_at,
    updated_at
  )
  VALUES
  (
    NEW.id,
    'free',
    false,
    5, -- 5 consultations for free tier
    0,
    now(),
    now()
  );

  -- Add initial credits
  INSERT INTO public.user_credits
  (
    user_id,
    balance,
    total_earned,
    total_used,
    created_at,
    updated_at
  )
  VALUES
  (
    NEW.id,
    5, -- Start with 5 credits
    5, -- Total earned is also 5
    0, -- No credits used yet
    now(),
    now()
  );

  -- Return the new user record
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment"("row_id" "uuid", "increment_amount" integer, "table_name" "text" DEFAULT 'user_credits'::"text", "column_name" "text" DEFAULT 'total_used'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
BEGIN
  EXECUTE format(
    'UPDATE %I SET %I = %I + $1 WHERE user_id = $2',
    table_name,
    column_name,
    column_name
  ) USING increment_amount, row_id;
END;
$_$;


ALTER FUNCTION "public"."increment"("row_id" "uuid", "increment_amount" integer, "table_name" "text", "column_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_organization_requests"("org_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE organizations 
    SET 
        total_requests = COALESCE(total_requests, 0) + 1,
        updated_at = NOW()
    WHERE id = org_id;
END;
$$;


ALTER FUNCTION "public"."increment_organization_requests"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_credit_operation"("p_user_id" "uuid", "p_action" "text", "p_amount" integer, "p_balance_before" integer, "p_balance_after" integer, "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        metadata,
        created_at
    ) VALUES (
        p_user_id,
        p_action,
        'user_credits',
        p_user_id,
        jsonb_build_object('balance', p_balance_before),
        jsonb_build_object('balance', p_balance_after, 'amount_changed', p_amount),
        p_metadata,
        now()
    );
END;
$$;


ALTER FUNCTION "public"."log_credit_operation"("p_user_id" "uuid", "p_action" "text", "p_amount" integer, "p_balance_before" integer, "p_balance_after" integer, "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."logout_admin_session"("p_session_token" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM admin_user_sessions 
    WHERE session_token = p_session_token;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."logout_admin_session"("p_session_token" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."logout_admin_session"("p_session_token" "text") IS 'Invalidates an admin session (logout)';



CREATE OR REPLACE FUNCTION "public"."manage_organization_credits"("p_organization_id" "uuid", "p_credit_adjustment" integer, "p_description" "text" DEFAULT NULL::"text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_credits INTEGER;
    new_credits INTEGER;
    result JSON;
    transaction_type_val TEXT;
    source_val TEXT;
    safe_adjustment INTEGER;
BEGIN
    -- Ensure we have a safe value
    safe_adjustment := COALESCE(p_credit_adjustment, 0);
    
    -- Get current credits
    SELECT credits INTO current_credits 
    FROM organizations 
    WHERE id = p_organization_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Organization not found or inactive';
    END IF;
    
    -- Calculate new balance
    new_credits := current_credits + safe_adjustment;
    
    -- Prevent negative credits
    IF new_credits < 0 THEN
        RAISE EXCEPTION 'Insufficient credits. Current balance: %, Requested adjustment: %', current_credits, safe_adjustment;
    END IF;
    
    -- Update organization credits
    UPDATE organizations 
    SET credits = new_credits, updated_at = NOW() 
    WHERE id = p_organization_id;
    
    -- Determine transaction type and source based on adjustment
    IF safe_adjustment > 0 THEN
        transaction_type_val := 'adjustment';     -- Adding credits
        source_val := 'manual_addition';          -- Manual addition of credits
    ELSIF safe_adjustment < 0 THEN
        transaction_type_val := 'used';           -- Using/deducting credits
        source_val := 'admin_adjustment';         -- Admin adjustment
    ELSE
        transaction_type_val := 'adjustment';     -- No change
        source_val := 'admin_adjustment';         -- Admin adjustment
    END IF;
    
    -- Log the transaction
    INSERT INTO organization_credit_transactions (
        organization_id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        source,
        source_reference,
        description,
        credit_adjustment,
        previous_balance,
        new_balance
    ) VALUES (
        p_organization_id,
        transaction_type_val,           -- ✅ Valid transaction_type
        ABS(safe_adjustment),           -- Use absolute value for amount
        current_credits,
        new_credits,
        source_val,                     -- ✅ Valid source
        'api_credit_management',
        COALESCE(p_description, 'Credit adjustment via API'),
        safe_adjustment,
        current_credits,
        new_credits
    );
    
    -- Return result
    SELECT json_build_object(
        'organization_id', p_organization_id,
        'balance_before', current_credits,
        'credit_adjustment', safe_adjustment,
        'balance_after', new_credits,
        'description', COALESCE(p_description, 'Credit adjustment'),
        'transaction_type', transaction_type_val,
        'source', source_val,
        'timestamp', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."manage_organization_credits"("p_organization_id" "uuid", "p_credit_adjustment" integer, "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_paystack_webhook"("p_event_type" character varying, "p_transaction_reference" character varying, "p_user_id" "uuid", "p_amount" bigint, "p_currency" character varying, "p_metadata" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_transaction_id UUID;
    v_product_type VARCHAR;
    v_tier VARCHAR;
    v_quantity INTEGER;
    v_package_id UUID;
    v_result JSONB;
    v_purchase_id UUID;
BEGIN
    -- Extract metadata
    v_product_type := p_metadata->>'product_type';
    v_tier := p_metadata->>'tier';
    v_quantity := COALESCE((p_metadata->>'quantity')::INTEGER, 0);
    v_package_id := COALESCE((p_metadata->>'package_id')::UUID, NULL);

    -- Update transaction status to completed
    UPDATE transaction_history 
    SET 
        status = 'completed',
        updated_at = NOW()
    WHERE payment_provider_reference = p_transaction_reference
    AND payment_provider = 'paystack'
    RETURNING id INTO v_transaction_id;

    -- Handle based on product type
    IF v_product_type = 'consultation' AND v_package_id IS NOT NULL THEN
        -- Process consultation credit purchase
        v_purchase_id := record_consultation_purchase(
            p_user_id := p_user_id,
            p_package_id := v_package_id,
            p_quantity := v_quantity,
            p_amount_paid := p_amount,
            p_payment_provider := 'paystack',
            p_payment_provider_reference := p_transaction_reference,
            p_transaction_id := v_transaction_id
        );
        
        v_result := jsonb_build_object(
            'success', true,
            'action', 'consultation_credits_added',
            'credits_added', v_quantity,
            'purchase_id', v_purchase_id,
            'transaction_id', v_transaction_id
        );

    ELSIF v_product_type = 'subscription' AND v_tier IS NOT NULL THEN
        -- Process subscription
        PERFORM update_user_subscription(
            p_user_id := p_user_id,
            p_tier := v_tier,
            p_is_annual := COALESCE((p_metadata->>'billing_cycle')::TEXT = 'annual', false),
            p_payment_provider := 'paystack',
            p_provider_subscription_id := p_transaction_reference
        );

        -- Add subscription credits based on tier
        DECLARE
            v_credit_amount INTEGER;
        BEGIN
            v_credit_amount := CASE 
                WHEN v_tier = 'starter' THEN 30
                WHEN v_tier = 'professional' THEN 80
                WHEN v_tier = 'enterprise' THEN 0 -- Custom handling
                ELSE 5 -- Free tier
            END;

            IF v_credit_amount > 0 THEN
                PERFORM record_subscription_credits(
                    p_user_id := p_user_id,
                    p_subscription_tier := v_tier,
                    p_credit_amount := v_credit_amount,
                    p_expiry_months := 1,
                    p_transaction_id := v_transaction_id,
                    p_billing_cycle := COALESCE(p_metadata->>'billing_cycle', 'monthly')
                );
            END IF;
        END;
        
        v_result := jsonb_build_object(
            'success', true,
            'action', 'subscription_updated',
            'tier', v_tier,
            'credits_added', v_credit_amount,
            'transaction_id', v_transaction_id
        );

    ELSE
        -- Unknown product type
        v_result := jsonb_build_object(
            'success', false,
            'error', 'Unknown product type or missing required metadata',
            'product_type', v_product_type,
            'metadata', p_metadata
        );
    END IF;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."process_paystack_webhook"("p_event_type" character varying, "p_transaction_reference" character varying, "p_user_id" "uuid", "p_amount" bigint, "p_currency" character varying, "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_consultation_purchase"("p_user_id" "uuid", "p_package_id" "uuid", "p_quantity" integer, "p_amount_paid" bigint, "p_payment_provider" character varying, "p_payment_provider_reference" character varying, "p_transaction_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_purchase_id UUID;
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- Get current credit balance
    SELECT balance INTO v_current_balance 
    FROM user_credits 
    WHERE user_id = p_user_id;
    
    v_current_balance := COALESCE(v_current_balance, 0);
    v_new_balance := v_current_balance + p_quantity;

    -- Record the consultation purchase
    INSERT INTO consultation_purchases (
        user_id,
        package_id,
        quantity,
        amount_paid,
        payment_provider,
        payment_provider_reference,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_package_id,
        p_quantity,
        p_amount_paid,
        p_payment_provider,
        p_payment_provider_reference,
        NOW(),
        NOW()
    ) RETURNING id INTO v_purchase_id;

    -- Add credits to user account (consultation credits don't expire)
    PERFORM add_user_credits(
        p_user_id := p_user_id,
        p_amount := p_quantity,
        p_source := 'purchase',
        p_expiry_months := 0  -- No expiry for consultation purchases
    );

    -- Record in credit_transactions for audit trail
    INSERT INTO credit_transactions (
        user_id,
        transaction_id,
        amount,
        transaction_type,
        source,
        source_reference,
        balance_before,
        balance_after,
        expires_at,
        metadata
    ) VALUES (
        p_user_id,
        p_transaction_id,
        p_quantity,
        'earned',
        'purchase',
        v_purchase_id::VARCHAR, -- Fixed: use v_purchase_id instead of p_purchase_id
        v_current_balance,
        v_new_balance,
        NULL, -- Consultation credits don't expire
        jsonb_build_object(
            'package_id', p_package_id,
            'amount_paid', p_amount_paid,
            'payment_provider', p_payment_provider,
            'payment_provider_reference', p_payment_provider_reference
        )
    );

    RETURN v_purchase_id;
END;
$$;


ALTER FUNCTION "public"."record_consultation_purchase"("p_user_id" "uuid", "p_package_id" "uuid", "p_quantity" integer, "p_amount_paid" bigint, "p_payment_provider" character varying, "p_payment_provider_reference" character varying, "p_transaction_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_subscription_credits"("p_user_id" "uuid", "p_subscription_tier" character varying, "p_credit_amount" integer, "p_expiry_months" integer DEFAULT 1, "p_transaction_id" "uuid" DEFAULT NULL::"uuid", "p_billing_cycle" character varying DEFAULT 'monthly'::character varying) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
    v_expiry_date TIMESTAMPTZ;
BEGIN
    -- Calculate expiry date based on billing cycle
    IF p_billing_cycle = 'annual' THEN
        v_expiry_date := NOW() + INTERVAL '12 months';
    ELSE
        v_expiry_date := NOW() + (p_expiry_months || ' months')::INTERVAL;
    END IF;

    -- Get current balance
    SELECT balance INTO v_current_balance 
    FROM user_credits 
    WHERE user_id = p_user_id;
    
    v_current_balance := COALESCE(v_current_balance, 0);
    v_new_balance := v_current_balance + p_credit_amount;

    -- Add subscription credits
    PERFORM add_user_credits(
        p_user_id := p_user_id,
        p_amount := p_credit_amount,
        p_source := 'subscription',
        p_expiry_months := p_expiry_months
    );

    -- Record in credit_transactions for audit trail
    INSERT INTO credit_transactions (
        user_id,
        transaction_id,
        amount,
        transaction_type,
        source,
        source_reference,
        balance_before,
        balance_after,
        expires_at,
        metadata
    ) VALUES (
        p_user_id,
        p_transaction_id,
        p_credit_amount,
        'earned',
        'subscription',
        p_subscription_tier,
        v_current_balance,
        v_new_balance,
        v_expiry_date,
        jsonb_build_object(
            'subscription_tier', p_subscription_tier,
            'billing_cycle', p_billing_cycle,
            'expiry_date', v_expiry_date
        )
    );
END;
$$;


ALTER FUNCTION "public"."record_subscription_credits"("p_user_id" "uuid", "p_subscription_tier" character varying, "p_credit_amount" integer, "p_expiry_months" integer, "p_transaction_id" "uuid", "p_billing_cycle" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rotate_organization_api_key"("p_organization_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_api_key TEXT;
    result JSON;
BEGIN
    -- Generate new API key
    new_api_key := 'pn_' || encode(gen_random_bytes(24), 'base64');
    
    -- Update organization with new API key
    UPDATE organizations 
    SET api_key = new_api_key, updated_at = NOW() 
    WHERE id = p_organization_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Organization not found or inactive';
    END IF;
    
    -- Return result
    SELECT json_build_object(
        'organization_id', p_organization_id,
        'new_api_key', new_api_key,
        'rotated_at', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."rotate_organization_api_key"("p_organization_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_credit_expiry_job"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_expired_count INTEGER := 0;
    v_result JSONB;
BEGIN
    -- Expire credits for all users
    SELECT COUNT(*) INTO v_expired_count
    FROM expire_user_credits();

    v_result := jsonb_build_object(
        'job_run_at', NOW(),
        'expired_users_count', v_expired_count,
        'status', 'completed'
    );

    -- Log the job run
    INSERT INTO audit_logs (
        action,
        table_name,
        metadata,
        created_at
    ) VALUES (
        'CREDIT_EXPIRY_JOB',
        'user_credits',
        v_result,
        NOW()
    );

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."run_credit_expiry_job"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."setup_database_schema"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- This function exists to ensure the schema is set up correctly
    -- It doesn't need to do anything as the schema is already set up
    RETURN;
END;
$$;


ALTER FUNCTION "public"."setup_database_schema"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_organization_request_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- You can customize this to track specific types of requests
    PERFORM increment_organization_requests(NEW.organization_id);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."track_organization_request_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_subscription"("p_user_id" "uuid", "p_plan_id" "uuid" DEFAULT NULL::"uuid", "p_tier" "text" DEFAULT NULL::"text", "p_is_annual" boolean DEFAULT false, "p_payment_provider" "text" DEFAULT NULL::"text", "p_provider_subscription_id" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_plan_id uuid;
    v_tier text;
    v_consultations_total integer;
    next_billing timestamptz;
BEGIN
    -- If plan_id is provided, use it; otherwise look up by tier
    IF p_plan_id IS NOT NULL THEN
        v_plan_id := p_plan_id;
        SELECT tier INTO v_tier FROM subscription_plans WHERE id = p_plan_id;
    ELSE
        -- Look up plan by tier
        SELECT id, tier INTO v_plan_id, v_tier
        FROM subscription_plans 
        WHERE tier = p_tier AND is_active = true
        LIMIT 1;
    END IF;

    -- Get consultations total based on tier
    v_consultations_total := CASE 
        WHEN v_tier = 'free' THEN 10
        WHEN v_tier = 'starter' THEN 50
        WHEN v_tier = 'professional' THEN 200
        WHEN v_tier = 'enterprise' THEN 500
        ELSE 10
    END;

    -- Calculate next billing date
    IF p_is_annual THEN
        next_billing := now() + interval '1 year';
    ELSE
        next_billing := now() + interval '1 month';
    END IF;

    -- Upsert subscription record
    INSERT INTO user_subscriptions (
        user_id,
        subscription_tier,
        plan_id,
        is_annual_billing,
        consultations_total,
        consultations_used,
        next_billing_date,
        payment_provider,
        payment_provider_subscription_id,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        v_tier,
        v_plan_id,
        p_is_annual,
        v_consultations_total,
        0,
        next_billing,
        p_payment_provider,
        p_provider_subscription_id,
        'active',
        now(),
        now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        subscription_tier = v_tier,
        plan_id = v_plan_id,
        is_annual_billing = p_is_annual,
        consultations_total = v_consultations_total,
        next_billing_date = next_billing,
        payment_provider = COALESCE(p_payment_provider, user_subscriptions.payment_provider),
        payment_provider_subscription_id = COALESCE(p_provider_subscription_id, user_subscriptions.payment_provider_subscription_id),
        status = 'active',
        updated_at = now();
END;
$$;


ALTER FUNCTION "public"."update_user_subscription"("p_user_id" "uuid", "p_plan_id" "uuid", "p_tier" "text", "p_is_annual" boolean, "p_payment_provider" "text", "p_provider_subscription_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_admin_session"("p_session_token" "text") RETURNS TABLE("admin_id" "uuid", "name" "text", "email" "text", "role" "text", "permissions" "jsonb", "session_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Update last accessed time and return admin info if session is valid
    UPDATE admin_user_sessions 
    SET last_accessed_at = NOW()
    WHERE session_token = p_session_token 
    AND expires_at > NOW();
    
    RETURN QUERY
    SELECT 
        au.id,
        au.name,
        au.email,
        au.role,
        au.permissions,
        aus.id
    FROM admin_users au
    JOIN admin_user_sessions aus ON au.id = aus.admin_user_id
    WHERE aus.session_token = p_session_token 
    AND aus.expires_at > NOW()
    AND au.is_active = true;
END;
$$;


ALTER FUNCTION "public"."validate_admin_session"("p_session_token" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_admin_session"("p_session_token" "text") IS 'Validates an existing admin session token';



CREATE OR REPLACE FUNCTION "public"."validate_api_key"("p_api_key" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  org_record organizations;
BEGIN
  -- Get organization by API key
  SELECT * INTO org_record
  FROM organizations 
  WHERE api_key = p_api_key AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid API key'
    );
  END IF;

  -- Check if organization has sufficient credits
  IF org_record.credits <= 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Insufficient credits'
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'organization', to_jsonb(org_record)
  );
END;
$$;


ALTER FUNCTION "public"."validate_api_key"("p_api_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_admin_credentials"("p_email" "text", "p_password" "text") RETURNS TABLE("admin_id" "uuid", "name" "text", "role" "text", "permissions" "jsonb", "is_active" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.name,
        au.role,
        au.permissions,
        au.is_active
    FROM admin_users au
    WHERE au.email = p_email 
    AND au.password_hash = crypt(p_password, au.password_hash)
    AND au.is_active = true;
END;
$$;


ALTER FUNCTION "public"."verify_admin_credentials"("p_email" "text", "p_password" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."verify_admin_credentials"("p_email" "text", "p_password" "text") IS 'Verifies admin user email and password';



CREATE TABLE IF NOT EXISTS "public"."admin_user_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_user_id" "uuid" NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "session_token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed_at" timestamp with time zone DEFAULT "now"(),
    "ip_address" "inet",
    "user_agent" "text"
);


ALTER TABLE "public"."admin_user_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_user_sessions" IS 'Tracks admin user authentication sessions';



CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" DEFAULT 'admin'::"text",
    "is_active" boolean DEFAULT true,
    "last_login_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "permissions" "jsonb" DEFAULT '{"settings": false, "analytics": true, "organizations": true}'::"jsonb",
    CONSTRAINT "admin_users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_users" IS 'Stores admin user credentials and permissions for B2B management';



CREATE TABLE IF NOT EXISTS "public"."api_usage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "function_called" "text" NOT NULL,
    "endpoint" "text" NOT NULL,
    "credits_used" integer DEFAULT 0 NOT NULL,
    "request_size_mb" numeric,
    "processing_time_ms" integer,
    "success" boolean DEFAULT true,
    "error_message" "text",
    "request_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "response_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."api_usage_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" character varying(100) NOT NULL,
    "table_name" character varying(100),
    "record_id" "uuid",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "metadata" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consultation_packages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quantity" integer NOT NULL,
    "price" integer NOT NULL,
    "discount_percentage" integer DEFAULT 0 NOT NULL,
    "highlight" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "consultation_packages_discount_valid" CHECK ((("discount_percentage" >= 0) AND ("discount_percentage" <= 100))),
    CONSTRAINT "consultation_packages_price_non_negative" CHECK (("price" >= 0)),
    CONSTRAINT "consultation_packages_quantity_positive" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."consultation_packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consultation_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "package_id" "uuid",
    "quantity" integer NOT NULL,
    "amount_paid" bigint NOT NULL,
    "payment_provider" character varying(50) NOT NULL,
    "payment_provider_reference" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "consultation_purchases_amount_paid_check" CHECK (("amount_paid" >= 0)),
    CONSTRAINT "consultation_purchases_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."consultation_purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "transaction_id" "uuid",
    "amount" integer NOT NULL,
    "transaction_type" character varying NOT NULL,
    "source" character varying NOT NULL,
    "source_reference" character varying,
    "balance_before" integer NOT NULL,
    "balance_after" integer NOT NULL,
    "expires_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "credit_transactions_source_check" CHECK ((("source")::"text" = ANY ((ARRAY['subscription'::character varying, 'purchase'::character varying, 'usage'::character varying, 'expiry'::character varying, 'admin_adjustment'::character varying, 'refund'::character varying])::"text"[]))),
    CONSTRAINT "credit_transactions_transaction_type_check" CHECK ((("transaction_type")::"text" = ANY ((ARRAY['earned'::character varying, 'used'::character varying, 'expired'::character varying, 'adjustment'::character varying])::"text"[])))
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" bigint NOT NULL,
    "currency" character varying(10) NOT NULL,
    "payment_provider" character varying(50) NOT NULL,
    "payment_provider_reference" character varying(255),
    "transaction_type" character varying(50) NOT NULL,
    "status" character varying(50) NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_payment_amounts" CHECK (
CASE
    WHEN (("transaction_type")::"text" = ANY ((ARRAY['topup'::character varying, 'subscription'::character varying, 'purchase'::character varying])::"text"[])) THEN ("amount" >= 0)
    WHEN (("transaction_type")::"text" = ANY ((ARRAY['usage'::character varying, 'refund'::character varying])::"text"[])) THEN ("amount" <= 0)
    ELSE true
END),
    CONSTRAINT "transaction_history_amount_check" CHECK (
CASE
    WHEN (("transaction_type")::"text" = ANY ((ARRAY['credit'::character varying, 'topup'::character varying, 'subscription'::character varying])::"text"[])) THEN ("amount" > 0)
    WHEN (("transaction_type")::"text" = 'usage'::"text") THEN ("amount" < 0)
    ELSE true
END)
);


ALTER TABLE "public"."transaction_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_credits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "balance" integer DEFAULT 0 NOT NULL,
    "total_earned" integer DEFAULT 0 NOT NULL,
    "total_used" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    CONSTRAINT "check_balance_consistency" CHECK (("balance" = ("total_earned" - "total_used"))),
    CONSTRAINT "user_credits_balance_non_negative" CHECK (("balance" >= 0)),
    CONSTRAINT "user_credits_totals_logical" CHECK (("total_used" <= ("total_earned" + "balance"))),
    CONSTRAINT "user_credits_totals_non_negative" CHECK ((("total_earned" >= 0) AND ("total_used" >= 0)))
);


ALTER TABLE "public"."user_credits" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."credit_system_health" AS
 SELECT 'System Overview'::"text" AS "metric_type",
    "count"(*) AS "total_users_with_credits",
    "sum"("user_credits"."balance") AS "total_active_credits",
    "sum"("user_credits"."total_earned") AS "total_credits_ever_earned",
    "sum"("user_credits"."total_used") AS "total_credits_used",
    "count"(
        CASE
            WHEN (("user_credits"."expires_at" IS NOT NULL) AND ("user_credits"."expires_at" <= "now"())) THEN 1
            ELSE NULL::integer
        END) AS "users_with_expired_credits",
    "count"(
        CASE
            WHEN ("user_credits"."balance" < 0) THEN 1
            ELSE NULL::integer
        END) AS "users_with_negative_balance",
    "count"(
        CASE
            WHEN ("user_credits"."balance" <> ("user_credits"."total_earned" - "user_credits"."total_used")) THEN 1
            ELSE NULL::integer
        END) AS "users_with_balance_discrepancy"
   FROM "public"."user_credits"
UNION ALL
 SELECT 'Payment Provider Stats'::"text" AS "metric_type",
    "count"(DISTINCT "transaction_history"."user_id") AS "total_users_with_credits",
    NULL::bigint AS "total_active_credits",
    NULL::bigint AS "total_credits_ever_earned",
    NULL::bigint AS "total_credits_used",
    "count"(
        CASE
            WHEN ((("transaction_history"."payment_provider")::"text" = 'paystack'::"text") AND (("transaction_history"."status")::"text" = 'pending'::"text")) THEN 1
            ELSE NULL::integer
        END) AS "users_with_expired_credits",
    "count"(
        CASE
            WHEN ((("transaction_history"."payment_provider")::"text" = 'paystack'::"text") AND (("transaction_history"."status")::"text" = 'completed'::"text")) THEN 1
            ELSE NULL::integer
        END) AS "users_with_negative_balance",
    "count"(
        CASE
            WHEN ((("transaction_history"."payment_provider")::"text" = 'stripe'::"text") AND (("transaction_history"."status")::"text" = 'completed'::"text")) THEN 1
            ELSE NULL::integer
        END) AS "users_with_balance_discrepancy"
   FROM "public"."transaction_history"
UNION ALL
 SELECT 'Recent Activity (24h)'::"text" AS "metric_type",
    "count"(DISTINCT "credit_transactions"."user_id") AS "total_users_with_credits",
    NULL::bigint AS "total_active_credits",
    NULL::bigint AS "total_credits_ever_earned",
    NULL::bigint AS "total_credits_used",
    "count"(
        CASE
            WHEN (("credit_transactions"."transaction_type")::"text" = 'earned'::"text") THEN 1
            ELSE NULL::integer
        END) AS "users_with_expired_credits",
    "count"(
        CASE
            WHEN (("credit_transactions"."transaction_type")::"text" = 'used'::"text") THEN 1
            ELSE NULL::integer
        END) AS "users_with_negative_balance",
    "count"(
        CASE
            WHEN (("credit_transactions"."transaction_type")::"text" = 'expired'::"text") THEN 1
            ELSE NULL::integer
        END) AS "users_with_balance_discrepancy"
   FROM "public"."credit_transactions"
  WHERE ("credit_transactions"."created_at" >= ("now"() - '24:00:00'::interval));


ALTER TABLE "public"."credit_system_health" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_credit_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "transaction_type" "text" NOT NULL,
    "amount" integer NOT NULL,
    "balance_before" integer NOT NULL,
    "balance_after" integer NOT NULL,
    "source" "text" NOT NULL,
    "source_reference" "text",
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "credit_adjustment" integer DEFAULT 0 NOT NULL,
    "previous_balance" integer DEFAULT 0 NOT NULL,
    "new_balance" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "organization_credit_transactions_source_check" CHECK (("source" = ANY (ARRAY['manual_addition'::"text", 'api_usage'::"text", 'transcription'::"text", 'document_generation'::"text", 'admin_adjustment'::"text", 'expiry'::"text"]))),
    CONSTRAINT "organization_credit_transactions_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['earned'::"text", 'used'::"text", 'expired'::"text", 'adjustment'::"text", 'refund'::"text"])))
);


ALTER TABLE "public"."organization_credit_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_usage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "request_type" "text" NOT NULL,
    "credits_used" integer NOT NULL,
    "processing_time_ms" integer,
    "success" boolean DEFAULT true,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."organization_usage_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "api_key" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(32), 'hex'::"text") NOT NULL,
    "webhook_url" "text",
    "credits" integer DEFAULT 0,
    "data_storage_preference" "text" DEFAULT 'none'::"text",
    "allowed_document_types" "text"[] DEFAULT ARRAY['soap_note'::"text", 'progress_note'::"text", 'history_physical'::"text", 'discharge_summary'::"text", 'consultation_note'::"text"],
    "rate_limit_per_hour" integer DEFAULT 1000,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "contact_email" "text",
    "contact_name" "text",
    "industry" "text",
    "webhook_secret" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(24), 'hex'::"text"),
    "total_requests" integer DEFAULT 0,
    "total_transcriptions" integer DEFAULT 0,
    "total_documents_generated" integer DEFAULT 0,
    "request_limit" smallint,
    CONSTRAINT "organizations_credits_check" CHECK (("credits" >= 0)),
    CONSTRAINT "organizations_data_storage_preference_check" CHECK (("data_storage_preference" = ANY (ARRAY['none'::"text", 'temporary'::"text", 'permanent'::"text"])))
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."regional_consultation_pricing" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "package_id" "uuid",
    "region" "text" NOT NULL,
    "country_code" "text" NOT NULL,
    "currency" "text" NOT NULL,
    "currency_symbol" "text" NOT NULL,
    "price" integer NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "payment_provider" character varying(50) DEFAULT 'stripe'::character varying
);


ALTER TABLE "public"."regional_consultation_pricing" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."regional_pricing" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_id" "uuid",
    "region" "text" NOT NULL,
    "country_code" "text" NOT NULL,
    "currency" "text" NOT NULL,
    "currency_symbol" "text" NOT NULL,
    "price_monthly" integer NOT NULL,
    "price_annual" integer NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "payment_provider" character varying(50) DEFAULT 'stripe'::character varying
);


ALTER TABLE "public"."regional_pricing" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tier" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price_monthly" integer NOT NULL,
    "price_annual" integer NOT NULL,
    "features" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "highlight" "text",
    "popular" boolean DEFAULT false NOT NULL,
    "cta_label" "text" NOT NULL,
    "cta_link" "text" NOT NULL,
    "contact_sales" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "subscription_plans_annual_discount" CHECK (
CASE
    WHEN ("price_monthly" = 0) THEN ("price_annual" = 0)
    WHEN ("price_monthly" > 0) THEN (("price_annual" < ("price_monthly" * 12)) OR ("price_annual" = 0))
    ELSE true
END),
    CONSTRAINT "subscription_plans_prices_non_negative" CHECK ((("price_monthly" >= 0) AND ("price_annual" >= 0)))
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."temp_transcriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "request_id" "text" NOT NULL,
    "transcription_data" "jsonb",
    "document_data" "jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."temp_transcriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subscription_tier" "text",
    "is_annual_billing" boolean DEFAULT false NOT NULL,
    "consultations_total" integer DEFAULT 0 NOT NULL,
    "consultations_used" integer DEFAULT 0 NOT NULL,
    "next_billing_date" timestamp with time zone,
    "payment_provider" "text",
    "payment_provider_subscription_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "plan_id" "uuid",
    "status" character varying(50) DEFAULT 'active'::character varying,
    CONSTRAINT "user_subscriptions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'canceled'::character varying, 'past_due'::character varying, 'incomplete'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_subscriptions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_subscription_details" AS
 SELECT "us"."id",
    "us"."user_id",
    "us"."subscription_tier",
    "us"."is_annual_billing",
    "us"."consultations_total",
    "us"."consultations_used",
    "us"."next_billing_date",
    "us"."payment_provider",
    "us"."payment_provider_subscription_id",
    "us"."created_at",
    "us"."updated_at",
    "us"."plan_id",
    "us"."status",
    "sp"."tier",
    "sp"."name" AS "plan_name",
    "sp"."description" AS "plan_description",
    "sp"."features",
    "sp"."price_monthly",
    "sp"."price_annual",
    "sp"."popular",
    "sp"."cta_label",
    "sp"."cta_link"
   FROM ("public"."user_subscriptions" "us"
     LEFT JOIN "public"."subscription_plans" "sp" ON (("us"."plan_id" = "sp"."id")));


ALTER TABLE "public"."user_subscription_details" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_user_sessions"
    ADD CONSTRAINT "admin_user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_user_sessions"
    ADD CONSTRAINT "admin_user_sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_usage_logs"
    ADD CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consultation_packages"
    ADD CONSTRAINT "consultation_packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consultation_purchases"
    ADD CONSTRAINT "consultation_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medical_documents"
    ADD CONSTRAINT "medical_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_credit_transactions"
    ADD CONSTRAINT "organization_credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_usage_logs"
    ADD CONSTRAINT "organization_usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_api_key_key" UNIQUE ("api_key");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."regional_consultation_pricing"
    ADD CONSTRAINT "regional_consultation_pricing_package_id_country_code_key" UNIQUE ("package_id", "country_code");



ALTER TABLE ONLY "public"."regional_consultation_pricing"
    ADD CONSTRAINT "regional_consultation_pricing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."regional_pricing"
    ADD CONSTRAINT "regional_pricing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."regional_pricing"
    ADD CONSTRAINT "regional_pricing_plan_id_country_code_key" UNIQUE ("plan_id", "country_code");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."temp_transcriptions"
    ADD CONSTRAINT "temp_transcriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_history"
    ADD CONSTRAINT "transaction_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_admin_sessions_admin_user" ON "public"."admin_user_sessions" USING "btree" ("admin_user_id");



CREATE INDEX "idx_admin_sessions_auth_user" ON "public"."admin_user_sessions" USING "btree" ("auth_user_id");



CREATE INDEX "idx_admin_sessions_expires" ON "public"."admin_user_sessions" USING "btree" ("expires_at");



CREATE INDEX "idx_admin_sessions_token" ON "public"."admin_user_sessions" USING "btree" ("session_token");



CREATE INDEX "idx_admin_users_active" ON "public"."admin_users" USING "btree" ("is_active");



CREATE INDEX "idx_admin_users_email" ON "public"."admin_users" USING "btree" ("email");



CREATE INDEX "idx_api_usage_function" ON "public"."api_usage_logs" USING "btree" ("function_called");



CREATE INDEX "idx_api_usage_org_date" ON "public"."api_usage_logs" USING "btree" ("organization_id", "created_at");



CREATE INDEX "idx_api_usage_success" ON "public"."api_usage_logs" USING "btree" ("success");



CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_table_record" ON "public"."audit_logs" USING "btree" ("table_name", "record_id");



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_consultation_packages_quantity" ON "public"."consultation_packages" USING "btree" ("quantity");



CREATE INDEX "idx_consultation_purchases_user_created" ON "public"."consultation_purchases" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_consultation_purchases_user_package" ON "public"."consultation_purchases" USING "btree" ("user_id", "package_id");



CREATE INDEX "idx_credit_transactions_created_at" ON "public"."credit_transactions" USING "btree" ("created_at");



CREATE INDEX "idx_credit_transactions_expires_at" ON "public"."credit_transactions" USING "btree" ("expires_at") WHERE ("expires_at" IS NOT NULL);



CREATE INDEX "idx_credit_transactions_org_id" ON "public"."organization_credit_transactions" USING "btree" ("organization_id");



CREATE INDEX "idx_credit_transactions_source" ON "public"."credit_transactions" USING "btree" ("source");



CREATE INDEX "idx_credit_transactions_type" ON "public"."credit_transactions" USING "btree" ("transaction_type");



CREATE INDEX "idx_credit_transactions_user_id" ON "public"."credit_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_medical_documents_created_at" ON "public"."medical_documents" USING "btree" ("created_at");



CREATE INDEX "idx_medical_documents_creator_created" ON "public"."medical_documents" USING "btree" ("creator_id", "created_at");



CREATE INDEX "idx_medical_documents_patient_name" ON "public"."medical_documents" USING "btree" ("patient_name");



CREATE INDEX "idx_medical_documents_status" ON "public"."medical_documents" USING "btree" ("status");



CREATE INDEX "idx_medical_documents_type" ON "public"."medical_documents" USING "btree" ("type");



CREATE INDEX "idx_org_credit_transactions_org" ON "public"."organization_credit_transactions" USING "btree" ("organization_id", "created_at");



CREATE INDEX "idx_org_credit_transactions_type" ON "public"."organization_credit_transactions" USING "btree" ("transaction_type");



CREATE INDEX "idx_organizations_api_key" ON "public"."organizations" USING "btree" ("api_key");



CREATE INDEX "idx_organizations_is_active" ON "public"."organizations" USING "btree" ("is_active");



CREATE INDEX "idx_regional_consultation_pricing_country_code" ON "public"."regional_consultation_pricing" USING "btree" ("country_code");



CREATE INDEX "idx_regional_pricing_country_code" ON "public"."regional_pricing" USING "btree" ("country_code");



CREATE INDEX "idx_regional_pricing_country_plan" ON "public"."regional_pricing" USING "btree" ("country_code", "plan_id");



CREATE INDEX "idx_subscription_plans_tier" ON "public"."subscription_plans" USING "btree" ("tier");



CREATE INDEX "idx_temp_transcriptions_expires" ON "public"."temp_transcriptions" USING "btree" ("expires_at");



CREATE INDEX "idx_temp_transcriptions_org" ON "public"."temp_transcriptions" USING "btree" ("organization_id", "created_at");



CREATE INDEX "idx_transaction_history_provider_ref" ON "public"."transaction_history" USING "btree" ("payment_provider", "payment_provider_reference");



CREATE INDEX "idx_transaction_history_provider_reference" ON "public"."transaction_history" USING "btree" ("payment_provider_reference");



CREATE INDEX "idx_transaction_history_provider_status" ON "public"."transaction_history" USING "btree" ("payment_provider", "status");



CREATE INDEX "idx_transaction_history_user_created" ON "public"."transaction_history" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_transaction_history_user_status" ON "public"."transaction_history" USING "btree" ("user_id", "status");



CREATE INDEX "idx_usage_logs_created_at" ON "public"."organization_usage_logs" USING "btree" ("created_at");



CREATE INDEX "idx_usage_logs_org_id" ON "public"."organization_usage_logs" USING "btree" ("organization_id");



CREATE INDEX "idx_user_credits_expires" ON "public"."user_credits" USING "btree" ("expires_at") WHERE ("expires_at" IS NOT NULL);



CREATE INDEX "idx_user_credits_expires_at" ON "public"."user_credits" USING "btree" ("expires_at") WHERE ("expires_at" IS NOT NULL);



CREATE OR REPLACE TRIGGER "increment_organization_requests_trigger" AFTER INSERT ON "public"."api_usage_logs" FOR EACH ROW EXECUTE FUNCTION "public"."track_organization_request_trigger"();



ALTER TABLE ONLY "public"."admin_user_sessions"
    ADD CONSTRAINT "admin_user_sessions_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id");



ALTER TABLE ONLY "public"."api_usage_logs"
    ADD CONSTRAINT "api_usage_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."consultation_purchases"
    ADD CONSTRAINT "consultation_purchases_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."consultation_packages"("id");



ALTER TABLE ONLY "public"."consultation_purchases"
    ADD CONSTRAINT "consultation_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction_history"("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."medical_documents"
    ADD CONSTRAINT "medical_documents_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."organization_credit_transactions"
    ADD CONSTRAINT "organization_credit_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."organization_credit_transactions"
    ADD CONSTRAINT "organization_credit_transactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_usage_logs"
    ADD CONSTRAINT "organization_usage_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."regional_consultation_pricing"
    ADD CONSTRAINT "regional_consultation_pricing_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."consultation_packages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."regional_pricing"
    ADD CONSTRAINT "regional_pricing_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."temp_transcriptions"
    ADD CONSTRAINT "temp_transcriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transaction_history"
    ADD CONSTRAINT "transaction_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin users can view their own data" ON "public"."admin_users" FOR SELECT USING ((("auth"."uid"() IN ( SELECT "admin_user_sessions"."auth_user_id"
   FROM "public"."admin_user_sessions"
  WHERE (("admin_user_sessions"."admin_user_id" = "admin_users"."id") AND ("admin_user_sessions"."expires_at" > "now"())))) OR ("auth"."uid"() IN ( SELECT "s"."auth_user_id"
   FROM ("public"."admin_user_sessions" "s"
     JOIN "public"."admin_users" "au" ON (("s"."admin_user_id" = "au"."id")))
  WHERE (("au"."role" = 'super_admin'::"text") AND ("s"."expires_at" > "now"()))))));



CREATE POLICY "Allow read access to consultation packages" ON "public"."consultation_packages" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow read access to regional consultation pricing" ON "public"."regional_consultation_pricing" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow read access to regional pricing" ON "public"."regional_pricing" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow read access to subscription plans" ON "public"."subscription_plans" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Credit transactions are viewable by service role" ON "public"."organization_credit_transactions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Organizations are viewable by service role" ON "public"."organizations" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can access audit logs" ON "public"."audit_logs" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Usage logs are viewable by service role" ON "public"."organization_usage_logs" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can delete their own documents" ON "public"."medical_documents" FOR DELETE USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can insert their own documents" ON "public"."medical_documents" FOR INSERT WITH CHECK (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can only see their own consultation purchases" ON "public"."consultation_purchases" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only see their own credits" ON "public"."user_credits" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only see their own sessions" ON "public"."admin_user_sessions" USING (("auth"."uid"() = "auth_user_id"));



CREATE POLICY "Users can only see their own subscriptions" ON "public"."user_subscriptions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only see their own transactions" ON "public"."transaction_history" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own documents" ON "public"."medical_documents" FOR UPDATE USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can view their own documents" ON "public"."medical_documents" FOR SELECT USING (("auth"."uid"() = "creator_id"));



ALTER TABLE "public"."admin_user_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_usage_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consultation_packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consultation_purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medical_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_usage_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."regional_consultation_pricing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."regional_pricing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."temp_transcriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transaction_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_credits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."add_user_credits"("p_user_id" "uuid", "p_amount" integer, "p_expiry_months" integer, "p_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_user_credits"("p_user_id" "uuid", "p_amount" integer, "p_expiry_months" integer, "p_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_user_credits"("p_user_id" "uuid", "p_amount" integer, "p_expiry_months" integer, "p_source" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_column_exists"("p_table_name" "text", "p_column_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_column_exists"("p_table_name" "text", "p_column_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_column_exists"("p_table_name" "text", "p_column_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_admin_session"("p_admin_user_id" "uuid", "p_auth_user_id" "uuid", "p_session_token" "text", "p_ip_address" "inet", "p_user_agent" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_admin_session"("p_admin_user_id" "uuid", "p_auth_user_id" "uuid", "p_session_token" "text", "p_ip_address" "inet", "p_user_agent" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_admin_session"("p_admin_user_id" "uuid", "p_auth_user_id" "uuid", "p_session_token" "text", "p_ip_address" "inet", "p_user_agent" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_admin_user"("p_email" "text", "p_password" "text", "p_name" "text", "p_role" "text", "p_permissions" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_admin_user"("p_email" "text", "p_password" "text", "p_name" "text", "p_role" "text", "p_permissions" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_admin_user"("p_email" "text", "p_password" "text", "p_name" "text", "p_role" "text", "p_permissions" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_document_with_credit_check"("p_user_id" "uuid", "p_title" "text", "p_type" "text", "p_patient_name" "text", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_document_with_credit_check"("p_user_id" "uuid", "p_title" "text", "p_type" "text", "p_patient_name" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_document_with_credit_check"("p_user_id" "uuid", "p_title" "text", "p_type" "text", "p_patient_name" "text", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_get_shared_documents_function"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_get_shared_documents_function"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_get_shared_documents_function"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_get_user_documents_function"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_get_user_documents_function"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_get_user_documents_function"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_organization"("p_name" "text", "p_contact_email" "text", "p_contact_name" "text", "p_industry" "text", "p_initial_credits" integer, "p_rate_limit_per_hour" integer, "p_allowed_document_types" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_organization"("p_name" "text", "p_contact_email" "text", "p_contact_name" "text", "p_industry" "text", "p_initial_credits" integer, "p_rate_limit_per_hour" integer, "p_allowed_document_types" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_organization"("p_name" "text", "p_contact_email" "text", "p_contact_name" "text", "p_industry" "text", "p_initial_credits" integer, "p_rate_limit_per_hour" integer, "p_allowed_document_types" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."daily_credit_maintenance"() TO "anon";
GRANT ALL ON FUNCTION "public"."daily_credit_maintenance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."daily_credit_maintenance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_organization_credits"("p_organization_id" "uuid", "p_credits_to_deduct" integer, "p_source" "text", "p_source_reference" "text", "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_organization_credits"("p_organization_id" "uuid", "p_credits_to_deduct" integer, "p_source" "text", "p_source_reference" "text", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_organization_credits"("p_organization_id" "uuid", "p_credits_to_deduct" integer, "p_source" "text", "p_source_reference" "text", "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_user_credits"("p_user_id" "uuid", "p_amount" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_user_credits"("p_user_id" "uuid", "p_amount" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_user_credits"("p_user_id" "uuid", "p_amount" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."detect_credit_anomalies"() TO "anon";
GRANT ALL ON FUNCTION "public"."detect_credit_anomalies"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."detect_credit_anomalies"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_user_subscription_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_user_subscription_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_user_subscription_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."example_operation_with_request_tracking"() TO "anon";
GRANT ALL ON FUNCTION "public"."example_operation_with_request_tracking"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."example_operation_with_request_tracking"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_user_credits"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."expire_user_credits"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_user_credits"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fix_user_credit_discrepancies"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fix_user_credit_discrepancies"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fix_user_credit_discrepancies"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_request_usage"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_request_usage"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_request_usage"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_usage"("p_organization_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_usage"("p_organization_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_usage"("p_organization_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_usage"("p_organization_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_usage"("p_organization_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_usage"("p_organization_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON TABLE "public"."medical_documents" TO "anon";
GRANT ALL ON TABLE "public"."medical_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."medical_documents" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_shared_documents"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_shared_documents"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shared_documents"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_total_used"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_total_used"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_total_used"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_credit_summary"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_credit_summary"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_credit_summary"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_documents"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_documents"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_documents"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_subscription"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_subscription"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_subscription"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment"("row_id" "uuid", "increment_amount" integer, "table_name" "text", "column_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment"("row_id" "uuid", "increment_amount" integer, "table_name" "text", "column_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment"("row_id" "uuid", "increment_amount" integer, "table_name" "text", "column_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_organization_requests"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_organization_requests"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_organization_requests"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_credit_operation"("p_user_id" "uuid", "p_action" "text", "p_amount" integer, "p_balance_before" integer, "p_balance_after" integer, "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_credit_operation"("p_user_id" "uuid", "p_action" "text", "p_amount" integer, "p_balance_before" integer, "p_balance_after" integer, "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_credit_operation"("p_user_id" "uuid", "p_action" "text", "p_amount" integer, "p_balance_before" integer, "p_balance_after" integer, "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."logout_admin_session"("p_session_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."logout_admin_session"("p_session_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."logout_admin_session"("p_session_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."manage_organization_credits"("p_organization_id" "uuid", "p_credit_adjustment" integer, "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."manage_organization_credits"("p_organization_id" "uuid", "p_credit_adjustment" integer, "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."manage_organization_credits"("p_organization_id" "uuid", "p_credit_adjustment" integer, "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_paystack_webhook"("p_event_type" character varying, "p_transaction_reference" character varying, "p_user_id" "uuid", "p_amount" bigint, "p_currency" character varying, "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_paystack_webhook"("p_event_type" character varying, "p_transaction_reference" character varying, "p_user_id" "uuid", "p_amount" bigint, "p_currency" character varying, "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_paystack_webhook"("p_event_type" character varying, "p_transaction_reference" character varying, "p_user_id" "uuid", "p_amount" bigint, "p_currency" character varying, "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_consultation_purchase"("p_user_id" "uuid", "p_package_id" "uuid", "p_quantity" integer, "p_amount_paid" bigint, "p_payment_provider" character varying, "p_payment_provider_reference" character varying, "p_transaction_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."record_consultation_purchase"("p_user_id" "uuid", "p_package_id" "uuid", "p_quantity" integer, "p_amount_paid" bigint, "p_payment_provider" character varying, "p_payment_provider_reference" character varying, "p_transaction_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_consultation_purchase"("p_user_id" "uuid", "p_package_id" "uuid", "p_quantity" integer, "p_amount_paid" bigint, "p_payment_provider" character varying, "p_payment_provider_reference" character varying, "p_transaction_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_subscription_credits"("p_user_id" "uuid", "p_subscription_tier" character varying, "p_credit_amount" integer, "p_expiry_months" integer, "p_transaction_id" "uuid", "p_billing_cycle" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."record_subscription_credits"("p_user_id" "uuid", "p_subscription_tier" character varying, "p_credit_amount" integer, "p_expiry_months" integer, "p_transaction_id" "uuid", "p_billing_cycle" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_subscription_credits"("p_user_id" "uuid", "p_subscription_tier" character varying, "p_credit_amount" integer, "p_expiry_months" integer, "p_transaction_id" "uuid", "p_billing_cycle" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."rotate_organization_api_key"("p_organization_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rotate_organization_api_key"("p_organization_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rotate_organization_api_key"("p_organization_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."run_credit_expiry_job"() TO "anon";
GRANT ALL ON FUNCTION "public"."run_credit_expiry_job"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_credit_expiry_job"() TO "service_role";



GRANT ALL ON FUNCTION "public"."setup_database_schema"() TO "anon";
GRANT ALL ON FUNCTION "public"."setup_database_schema"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."setup_database_schema"() TO "service_role";



GRANT ALL ON FUNCTION "public"."track_organization_request_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_organization_request_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_organization_request_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_subscription"("p_user_id" "uuid", "p_plan_id" "uuid", "p_tier" "text", "p_is_annual" boolean, "p_payment_provider" "text", "p_provider_subscription_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_subscription"("p_user_id" "uuid", "p_plan_id" "uuid", "p_tier" "text", "p_is_annual" boolean, "p_payment_provider" "text", "p_provider_subscription_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_subscription"("p_user_id" "uuid", "p_plan_id" "uuid", "p_tier" "text", "p_is_annual" boolean, "p_payment_provider" "text", "p_provider_subscription_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_admin_session"("p_session_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_admin_session"("p_session_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_admin_session"("p_session_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_api_key"("p_api_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_api_key"("p_api_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_api_key"("p_api_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_admin_credentials"("p_email" "text", "p_password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_admin_credentials"("p_email" "text", "p_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_admin_credentials"("p_email" "text", "p_password" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."admin_user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."admin_user_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_user_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."api_usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."api_usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."api_usage_logs" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."consultation_packages" TO "anon";
GRANT ALL ON TABLE "public"."consultation_packages" TO "authenticated";
GRANT ALL ON TABLE "public"."consultation_packages" TO "service_role";



GRANT ALL ON TABLE "public"."consultation_purchases" TO "anon";
GRANT ALL ON TABLE "public"."consultation_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."consultation_purchases" TO "service_role";



GRANT ALL ON TABLE "public"."credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_history" TO "anon";
GRANT ALL ON TABLE "public"."transaction_history" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_history" TO "service_role";



GRANT ALL ON TABLE "public"."user_credits" TO "anon";
GRANT ALL ON TABLE "public"."user_credits" TO "authenticated";
GRANT ALL ON TABLE "public"."user_credits" TO "service_role";



GRANT ALL ON TABLE "public"."credit_system_health" TO "anon";
GRANT ALL ON TABLE "public"."credit_system_health" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_system_health" TO "service_role";



GRANT ALL ON TABLE "public"."organization_credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."organization_credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."organization_usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."organization_usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_usage_logs" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."regional_consultation_pricing" TO "anon";
GRANT ALL ON TABLE "public"."regional_consultation_pricing" TO "authenticated";
GRANT ALL ON TABLE "public"."regional_consultation_pricing" TO "service_role";



GRANT ALL ON TABLE "public"."regional_pricing" TO "anon";
GRANT ALL ON TABLE "public"."regional_pricing" TO "authenticated";
GRANT ALL ON TABLE "public"."regional_pricing" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."temp_transcriptions" TO "anon";
GRANT ALL ON TABLE "public"."temp_transcriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."temp_transcriptions" TO "service_role";



GRANT ALL ON TABLE "public"."user_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."user_subscription_details" TO "anon";
GRANT ALL ON TABLE "public"."user_subscription_details" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subscription_details" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
