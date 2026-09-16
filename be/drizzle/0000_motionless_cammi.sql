CREATE TABLE "beds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"building_id" uuid NOT NULL,
	"floor_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"code" text NOT NULL,
	"label" text,
	"bed_type" text DEFAULT 'SINGLE' NOT NULL,
	"price_override" bigint,
	"status" text DEFAULT 'AVAILABLE' NOT NULL,
	"current_assignment_id" uuid,
	"blocked_reason" text,
	"blocked_until" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"address" jsonb,
	"geo" jsonb,
	"region" text,
	"phone" text,
	"email" text,
	"zalo_oa_id" text,
	"manager_id" uuid,
	"opening_hours" jsonb,
	"curfew_time" text,
	"gender_policy" text DEFAULT 'MIXED' NOT NULL,
	"billing_day_of_month" integer DEFAULT 28 NOT NULL,
	"due_day_of_month" integer DEFAULT 10 NOT NULL,
	"late_fee_policy" jsonb,
	"deposit_policy" jsonb,
	"approval_limits" jsonb,
	"electricity_price" bigint,
	"water_price" bigint,
	"utility_billing_mode" jsonb,
	"water_per_person_amount" bigint,
	"amenities" text[],
	"images" text[],
	"description" text,
	"notes" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"opened_at" date,
	"closed_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "buildings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"gender_policy" text,
	"has_elevator" boolean DEFAULT false NOT NULL,
	"amenities" text[],
	"monthly_rent_cost" bigint,
	"main_electric_meter_id" uuid,
	"main_water_meter_id" uuid,
	"address" text,
	"images" text[],
	"notes" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "floors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"building_id" uuid NOT NULL,
	"number" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"name" text,
	"gender_policy" text,
	"layout_image" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"tax_code" text,
	"address" text,
	"phone" text,
	"email" text,
	"logo" text,
	"settings" jsonb,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" text[] DEFAULT '{}' NOT NULL,
	"limits" jsonb,
	"is_system" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "room_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"capacity" integer NOT NULL,
	"base_price" bigint NOT NULL,
	"whole_room_price" bigint,
	"default_amenities" text[],
	"description" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"building_id" uuid NOT NULL,
	"floor_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text,
	"room_type_id" uuid,
	"capacity" integer NOT NULL,
	"actual_bed_count" integer DEFAULT 0 NOT NULL,
	"area_m2" text,
	"price_override" bigint,
	"whole_room_price" bigint,
	"amenities" text[],
	"has_private_toilet" boolean DEFAULT false NOT NULL,
	"direction" text,
	"electric_meter_id" uuid,
	"water_meter_id" uuid,
	"shared_meter_group_id" uuid,
	"images" text[],
	"notes" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_code" text NOT NULL,
	"full_name" text NOT NULL,
	"date_of_birth" date,
	"gender" text,
	"id_number" text,
	"phone" text,
	"email" text,
	"address" text,
	"position" text,
	"department" text,
	"branch_ids" uuid[] DEFAULT '{}' NOT NULL,
	"primary_branch_id" uuid,
	"hire_date" date,
	"termination_date" date,
	"termination_reason" text,
	"emergency_contact" jsonb,
	"documents" jsonb,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_role_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"scope" text DEFAULT 'BRANCH' NOT NULL,
	"branch_ids" uuid[] DEFAULT '{}' NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"granted_by" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_by" uuid,
	"revoked_at" timestamp with time zone,
	"revoke_reason" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"org_id" uuid NOT NULL,
	"email" text,
	"phone" text,
	"user_type" text NOT NULL,
	"staff_id" uuid,
	"customer_id" uuid,
	"full_name" text,
	"avatar" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp with time zone,
	"last_login_ip" text,
	"failed_login_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"notification_preferences" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bed_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"bed_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"floor_id" uuid NOT NULL,
	"building_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"reason" text NOT NULL,
	"daily_rate" bigint NOT NULL,
	"monthly_rate" bigint NOT NULL,
	"transfer_reason" text,
	"previous_assignment_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"booking_no" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"bed_id" uuid,
	"room_id" uuid,
	"expected_check_in_date" date,
	"expected_duration_months" integer,
	"quoted_price" bigint,
	"deposit_required" bigint,
	"deposit_paid" bigint DEFAULT 0 NOT NULL,
	"hold_until" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'NEW' NOT NULL,
	"source" text,
	"roommate_preferences" text,
	"cancel_reason" text,
	"cancelled_by" uuid,
	"cancelled_at" timestamp with time zone,
	"contract_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "checkin_checkout_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"type" text NOT NULL,
	"contract_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"bed_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"assignment_id" uuid NOT NULL,
	"performed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"performed_by" uuid,
	"checklist" jsonb,
	"asset_inventory" jsonb,
	"photos" text[] DEFAULT '{}' NOT NULL,
	"keys_handed_over" jsonb,
	"utility_readings" jsonb,
	"damages" jsonb,
	"tenant_signature" text,
	"staff_signature" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"contract_no" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"customer_id" uuid NOT NULL,
	"co_tenant_ids" uuid[],
	"guardian_info" jsonb,
	"whole_room" boolean DEFAULT false NOT NULL,
	"bed_ids" uuid[] DEFAULT '{}' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"duration_months" integer,
	"auto_renew_monthly" boolean DEFAULT false NOT NULL,
	"notice_period_days" integer DEFAULT 30 NOT NULL,
	"monthly_rent" bigint NOT NULL,
	"deposit_amount" bigint DEFAULT 0 NOT NULL,
	"deposit_months" integer,
	"billing_cycle" text DEFAULT 'MONTHLY' NOT NULL,
	"billing_day_of_month" integer,
	"due_day_of_month" integer,
	"electricity_price" bigint,
	"water_price" bigint,
	"included_service_ids" uuid[],
	"discounts" jsonb,
	"template_id" uuid,
	"terms_snapshot" text NOT NULL,
	"special_terms" text,
	"house_rules_version" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"terminated_at" timestamp with time zone,
	"termination_reason" text,
	"termination_type" text,
	"booking_id" uuid,
	"previous_contract_id" uuid,
	"next_contract_id" uuid,
	"signature_method" text,
	"signed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"customer_code" text NOT NULL,
	"full_name" text NOT NULL,
	"date_of_birth" date,
	"gender" text NOT NULL,
	"id_type" text,
	"id_number" text,
	"id_issue_date" date,
	"id_issue_place" text,
	"phone" text,
	"phone_history" text[],
	"email" text,
	"zalo_phone" text,
	"permanent_address" jsonb,
	"hometown" text,
	"emergency_contact" jsonb,
	"secondary_contact" jsonb,
	"payer" jsonb,
	"occupation" text,
	"school" text,
	"company" text,
	"student_id" text,
	"photo" text,
	"id_front_image" text,
	"id_back_image" text,
	"other_documents" jsonb,
	"current_branch_id" uuid,
	"current_room_id" uuid,
	"current_bed_id" uuid,
	"current_contract_id" uuid,
	"credit_balance" bigint DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'PROSPECT' NOT NULL,
	"is_blacklisted" boolean DEFAULT false NOT NULL,
	"blacklist_reason" text,
	"blacklisted_at" timestamp with time zone,
	"temporary_residence_status" text DEFAULT 'NOT_REGISTERED' NOT NULL,
	"source" text,
	"preferences" text,
	"internal_notes" text,
	"merged_into_customer_id" uuid,
	"anonymized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "billing_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"code" text NOT NULL,
	"period_from" date NOT NULL,
	"period_to" date NOT NULL,
	"issue_date" date,
	"due_date" date,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"invoice_count" integer DEFAULT 0 NOT NULL,
	"total_amount" bigint DEFAULT 0 NOT NULL,
	"generated_at" timestamp with time zone,
	"generated_by" uuid,
	"issued_at" timestamp with time zone,
	"issued_by" uuid,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "cash_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"session_no" text NOT NULL,
	"staff_id" uuid NOT NULL,
	"shift_id" uuid,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"opening_balance" bigint DEFAULT 0 NOT NULL,
	"closed_at" timestamp with time zone,
	"system_total" bigint,
	"counted_total" bigint,
	"variance" bigint,
	"variance_reason" text,
	"handover_note" text,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"deposited_to_bank" boolean DEFAULT false NOT NULL,
	"bank_deposit_ref" text,
	"deposited_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "deposit_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"entry_no" text NOT NULL,
	"entry_type" text NOT NULL,
	"amount" bigint NOT NULL,
	"balance_after" bigint NOT NULL,
	"reason" text,
	"related_invoice_id" uuid,
	"related_payment_id" uuid,
	"related_ticket_id" uuid,
	"requested_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"executed_by" uuid,
	"executed_at" timestamp with time zone,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"refund_method" text,
	"refund_due_date" date,
	"evidence_urls" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"building_id" uuid,
	"expense_no" text NOT NULL,
	"category" text NOT NULL,
	"amount" bigint NOT NULL,
	"expense_date" date NOT NULL,
	"paid_at" timestamp with time zone,
	"vendor" text,
	"vendor_invoice_ref" text,
	"payment_method" text,
	"description" text,
	"attachments" text[],
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_config" jsonb,
	"related_ticket_id" uuid,
	"related_asset_id" uuid,
	"allocation_rule" jsonb,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"created_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"key" text PRIMARY KEY NOT NULL,
	"scope" text,
	"request_hash" text,
	"response_body" jsonb,
	"status_code" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"adjustment_no" text NOT NULL,
	"amount" bigint NOT NULL,
	"reason" text NOT NULL,
	"evidence_urls" text[],
	"requested_by" uuid NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"reject_reason" text
);
--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"line_type" text NOT NULL,
	"description" text NOT NULL,
	"calculation_note" text,
	"quantity" text,
	"unit" text,
	"unit_price" bigint,
	"amount" bigint NOT NULL,
	"period_from" date,
	"period_to" date,
	"source_type" text,
	"source_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"invoice_no" text NOT NULL,
	"invoice_type" text DEFAULT 'PERIODIC' NOT NULL,
	"contract_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"billing_period_id" uuid,
	"period_from" date NOT NULL,
	"period_to" date NOT NULL,
	"issue_date" date,
	"due_date" date,
	"subtotal" bigint DEFAULT 0 NOT NULL,
	"discount_total" bigint DEFAULT 0 NOT NULL,
	"penalty_total" bigint DEFAULT 0 NOT NULL,
	"adjustment_total" bigint DEFAULT 0 NOT NULL,
	"grand_total" bigint DEFAULT 0 NOT NULL,
	"paid_amount" bigint DEFAULT 0 NOT NULL,
	"balance" bigint DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"snapshot" jsonb,
	"issued_by" uuid,
	"issued_at" timestamp with time zone,
	"voided_by" uuid,
	"voided_at" timestamp with time zone,
	"void_reason" text,
	"sent_at" timestamp with time zone,
	"sent_channels" text[],
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"allocated_by" uuid,
	"allocated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_automatic" boolean DEFAULT true NOT NULL,
	"reversed_at" timestamp with time zone,
	"reversed_by" uuid
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"payment_no" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"payer_name" text,
	"payer_account" text,
	"amount" bigint NOT NULL,
	"method" text NOT NULL,
	"external_txn_id" text,
	"idempotency_key" text,
	"bank_ref" text,
	"bank_statement_id" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"received_by" uuid,
	"cash_session_id" uuid,
	"allocated_amount" bigint DEFAULT 0 NOT NULL,
	"unallocated_amount" bigint DEFAULT 0 NOT NULL,
	"reconciled_at" timestamp with time zone,
	"reconciled_by" uuid,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"reversed_by" uuid,
	"reversed_at" timestamp with time zone,
	"reverse_reason" text,
	"reversal_of_payment_id" uuid,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "service_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price_snapshot" bigint NOT NULL,
	"metadata" jsonb,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text
);
--> statement-breakpoint
CREATE TABLE "service_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" bigint NOT NULL,
	"amount" bigint NOT NULL,
	"recorded_by" uuid,
	"billed_invoice_id" uuid
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"price" bigint NOT NULL,
	"unit" text,
	"billing_type" text NOT NULL,
	"cycle" text,
	"prorate_on_start" boolean DEFAULT true NOT NULL,
	"prorate_on_cancel" boolean DEFAULT true NOT NULL,
	"is_included_by_default" boolean DEFAULT false NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utility_meters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"building_id" uuid,
	"code" text NOT NULL,
	"serial_number" text,
	"type" text NOT NULL,
	"scope" text NOT NULL,
	"room_ids" uuid[],
	"sharing_rule" jsonb,
	"multiplier" numeric DEFAULT '1' NOT NULL,
	"max_reading" integer,
	"installed_at" date,
	"replaced_at" date,
	"replaced_by_meter_id" uuid,
	"status" text DEFAULT 'ACTIVE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utility_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"meter_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"billing_period_id" uuid NOT NULL,
	"previous_reading" numeric NOT NULL,
	"current_reading" numeric NOT NULL,
	"consumption" numeric NOT NULL,
	"is_rollover" boolean DEFAULT false NOT NULL,
	"is_meter_replaced" boolean DEFAULT false NOT NULL,
	"unit_price" bigint NOT NULL,
	"amount" bigint,
	"reading_date" date NOT NULL,
	"photo_url" text NOT NULL,
	"recorded_by" uuid,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"is_abnormal" boolean DEFAULT false NOT NULL,
	"abnormal_note" text,
	"is_estimated" boolean DEFAULT false NOT NULL,
	"estimation_basis" text,
	"adjusted_from_reading_id" uuid
);
--> statement-breakpoint
CREATE TABLE "asset_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"by" uuid,
	"from_location" text,
	"to_location" text,
	"cost" bigint,
	"note" text,
	"ticket_id" uuid,
	"attachments" text[]
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"building_id" uuid,
	"floor_id" uuid,
	"room_id" uuid,
	"bed_id" uuid,
	"asset_code" text NOT NULL,
	"qr_code" text,
	"name" text NOT NULL,
	"category" text,
	"brand" text,
	"model" text,
	"serial_number" text,
	"location_type" text DEFAULT 'ROOM' NOT NULL,
	"purchase_date" date,
	"purchase_price" bigint,
	"supplier" text,
	"warranty_until" date,
	"depreciation_method" text,
	"useful_life_months" integer,
	"current_book_value" bigint,
	"condition" text DEFAULT 'NEW' NOT NULL,
	"status" text DEFAULT 'IN_USE' NOT NULL,
	"repair_count" integer DEFAULT 0 NOT NULL,
	"total_repair_cost" bigint DEFAULT 0 NOT NULL,
	"images" text[],
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "house_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"version" text NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"sections" jsonb,
	"penalty_rules" jsonb,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"published_by" uuid
);
--> statement-breakpoint
CREATE TABLE "housekeeping_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"bed_id" uuid,
	"task_type" text NOT NULL,
	"assigned_to" uuid,
	"due_at" timestamp with time zone,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by" uuid,
	"photos" text[],
	"issues_found" text
);
--> statement-breakpoint
CREATE TABLE "maintenance_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"building_id" uuid,
	"floor_id" uuid,
	"room_id" uuid,
	"bed_id" uuid,
	"asset_id" uuid,
	"ticket_no" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"attachments" text[],
	"priority" text DEFAULT 'NORMAL' NOT NULL,
	"sla_response_deadline" timestamp with time zone,
	"sla_resolve_deadline" timestamp with time zone,
	"sla_breached" boolean DEFAULT false NOT NULL,
	"sla_breached_at" timestamp with time zone,
	"paused_duration_minutes" integer DEFAULT 0 NOT NULL,
	"reported_by" uuid,
	"reporter_type" text,
	"reported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_to" uuid,
	"assigned_by" uuid,
	"assigned_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"resolution" text,
	"resolution_attachments" text[],
	"labor_cost" bigint,
	"parts_cost" bigint,
	"total_cost" bigint,
	"charge_to_tenant" boolean DEFAULT false NOT NULL,
	"charged_invoice_id" uuid,
	"expense_id" uuid,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"merged_into_ticket_id" uuid,
	"tenant_rating" integer,
	"tenant_feedback" text
);
--> statement-breakpoint
CREATE TABLE "staff_shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"date" date NOT NULL,
	"shift_type" text NOT NULL,
	"start_time" text,
	"end_time" text,
	"status" text DEFAULT 'SCHEDULED' NOT NULL,
	"actual_start_at" timestamp with time zone,
	"actual_end_at" timestamp with time zone,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "ticket_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"from_status" text,
	"to_status" text,
	"by" uuid,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text,
	"attachments" text[]
);
--> statement-breakpoint
CREATE TABLE "violations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"room_id" uuid,
	"violation_no" text NOT NULL,
	"rule_code" text,
	"rule_version" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"reported_by" uuid,
	"description" text,
	"evidence" text[],
	"severity" text,
	"occurrence_count" integer DEFAULT 1 NOT NULL,
	"penalty_type" text,
	"penalty_amount" bigint,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"charged_invoice_id" uuid,
	"tenant_acknowledged_at" timestamp with time zone,
	"appeal_reason" text,
	"appeal_resolution" text
);
--> statement-breakpoint
CREATE TABLE "visitor_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"visitor_type" text NOT NULL,
	"visitor_name" text NOT NULL,
	"visitor_phone" text,
	"visitor_id_number" text,
	"host_customer_id" uuid,
	"room_id" uuid,
	"purpose" text,
	"check_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"check_out_at" timestamp with time zone,
	"recorded_by" uuid,
	"approved_by_host" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp with time zone,
	"vehicle_plate" text,
	"overnight_stay" boolean DEFAULT false NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid,
	"owner_type" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"file_name" text,
	"mime_type" text,
	"size_bytes" bigint,
	"cloudinary_public_id" text NOT NULL,
	"is_sensitive" text,
	"uploaded_by" uuid,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid,
	"actor_id" uuid,
	"actor_name" text,
	"actor_role" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" uuid,
	"before" jsonb,
	"after" jsonb,
	"diff" jsonb,
	"reason" text,
	"ip" text,
	"user_agent" text,
	"request_id" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counters" (
	"key" text PRIMARY KEY NOT NULL,
	"seq" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"channels" text[] DEFAULT '{}' NOT NULL,
	"subject" text,
	"body_template" text NOT NULL,
	"zalo_template_id" text,
	"variables" text[],
	"version" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid,
	"recipient_type" text NOT NULL,
	"recipient_id" uuid NOT NULL,
	"template_code" text,
	"title" text,
	"body" text,
	"data" jsonb,
	"channels" text[] DEFAULT '{}' NOT NULL,
	"channel_status" jsonb,
	"priority" text DEFAULT 'NORMAL' NOT NULL,
	"related_entity" text,
	"related_entity_id" uuid,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"read_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"retry_count" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"date" text NOT NULL,
	"metric_type" text NOT NULL,
	"values" jsonb,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "beds" ADD CONSTRAINT "beds_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beds" ADD CONSTRAINT "beds_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beds" ADD CONSTRAINT "beds_floor_id_floors_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beds" ADD CONSTRAINT "beds_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floors" ADD CONSTRAINT "floors_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floors" ADD CONSTRAINT "floors_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_floor_id_floors_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_primary_branch_id_branches_id_fk" FOREIGN KEY ("primary_branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed_assignments" ADD CONSTRAINT "bed_assignments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed_assignments" ADD CONSTRAINT "bed_assignments_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed_assignments" ADD CONSTRAINT "bed_assignments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed_assignments" ADD CONSTRAINT "bed_assignments_bed_id_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."beds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed_assignments" ADD CONSTRAINT "bed_assignments_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_bed_id_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."beds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_checkout_records" ADD CONSTRAINT "checkin_checkout_records_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_checkout_records" ADD CONSTRAINT "checkin_checkout_records_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_checkout_records" ADD CONSTRAINT "checkin_checkout_records_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_checkout_records" ADD CONSTRAINT "checkin_checkout_records_bed_id_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."beds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_checkout_records" ADD CONSTRAINT "checkin_checkout_records_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_checkout_records" ADD CONSTRAINT "checkin_checkout_records_assignment_id_bed_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."bed_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_periods" ADD CONSTRAINT "billing_periods_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_ledger" ADD CONSTRAINT "deposit_ledger_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_ledger" ADD CONSTRAINT "deposit_ledger_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_adjustments" ADD CONSTRAINT "invoice_adjustments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_billing_period_id_billing_periods_id_fk" FOREIGN KEY ("billing_period_id") REFERENCES "public"."billing_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_subscriptions" ADD CONSTRAINT "service_subscriptions_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_subscriptions" ADD CONSTRAINT "service_subscriptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_subscriptions" ADD CONSTRAINT "service_subscriptions_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_usages" ADD CONSTRAINT "service_usages_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_usages" ADD CONSTRAINT "service_usages_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_meters" ADD CONSTRAINT "utility_meters_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_meters" ADD CONSTRAINT "utility_meters_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_readings" ADD CONSTRAINT "utility_readings_meter_id_utility_meters_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."utility_meters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_readings" ADD CONSTRAINT "utility_readings_billing_period_id_billing_periods_id_fk" FOREIGN KEY ("billing_period_id") REFERENCES "public"."billing_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_events" ADD CONSTRAINT "asset_events_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_events" ADD CONSTRAINT "asset_events_ticket_id_maintenance_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."maintenance_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_floor_id_floors_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_bed_id_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."beds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "house_rules" ADD CONSTRAINT "house_rules_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "housekeeping_tasks" ADD CONSTRAINT "housekeeping_tasks_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_floor_id_floors_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_bed_id_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."beds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_charged_invoice_id_invoices_id_fk" FOREIGN KEY ("charged_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_shifts" ADD CONSTRAINT "staff_shifts_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_events" ADD CONSTRAINT "ticket_events_ticket_id_maintenance_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."maintenance_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_charged_invoice_id_invoices_id_fk" FOREIGN KEY ("charged_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_logs" ADD CONSTRAINT "visitor_logs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_logs" ADD CONSTRAINT "visitor_logs_host_customer_id_customers_id_fk" FOREIGN KEY ("host_customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "beds_branch_id_code_key" ON "beds" USING btree ("branch_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "branches_org_id_code_key" ON "branches" USING btree ("org_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "buildings_branch_id_code_key" ON "buildings" USING btree ("branch_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "floors_building_id_number_key" ON "floors" USING btree ("building_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_org_id_code_key" ON "roles" USING btree ("org_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "room_types_branch_id_code_key" ON "room_types" USING btree ("branch_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_branch_id_code_key" ON "rooms" USING btree ("branch_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_org_id_employee_code_key" ON "staff" USING btree ("org_id","employee_code");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_key" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "bed_assignments_one_open_per_bed" ON "bed_assignments" USING btree ("bed_id") WHERE "bed_assignments"."end_date" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_booking_no_key" ON "bookings" USING btree ("booking_no");--> statement-breakpoint
CREATE UNIQUE INDEX "contracts_contract_no_key" ON "contracts" USING btree ("contract_no");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_org_id_customer_code_key" ON "customers" USING btree ("org_id","customer_code");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_org_id_id_number_key" ON "customers" USING btree ("org_id","id_number");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_periods_branch_id_code_key" ON "billing_periods" USING btree ("branch_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "cash_sessions_session_no_key" ON "cash_sessions" USING btree ("session_no");--> statement-breakpoint
CREATE UNIQUE INDEX "deposit_ledger_entry_no_key" ON "deposit_ledger" USING btree ("entry_no");--> statement-breakpoint
CREATE UNIQUE INDEX "expenses_expense_no_key" ON "expenses" USING btree ("expense_no");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_adjustments_adjustment_no_key" ON "invoice_adjustments" USING btree ("adjustment_no");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_invoice_no_key" ON "invoices" USING btree ("invoice_no");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_contract_id_billing_period_id_key" ON "invoices" USING btree ("contract_id","billing_period_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_payment_no_key" ON "payments" USING btree ("payment_no");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_external_txn_id_key" ON "payments" USING btree ("external_txn_id");--> statement-breakpoint
CREATE UNIQUE INDEX "services_branch_id_code_key" ON "services" USING btree ("branch_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "utility_meters_branch_id_code_key" ON "utility_meters" USING btree ("branch_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "utility_readings_meter_id_billing_period_id_key" ON "utility_readings" USING btree ("meter_id","billing_period_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_branch_id_asset_code_key" ON "assets" USING btree ("branch_id","asset_code");--> statement-breakpoint
CREATE UNIQUE INDEX "house_rules_branch_id_version_key" ON "house_rules" USING btree ("branch_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "maintenance_tickets_ticket_no_key" ON "maintenance_tickets" USING btree ("ticket_no");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_shifts_staff_id_date_key" ON "staff_shifts" USING btree ("staff_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "violations_violation_no_key" ON "violations" USING btree ("violation_no");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_templates_org_id_code_key" ON "notification_templates" USING btree ("org_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "report_snapshots_branch_id_metric_type_date_key" ON "report_snapshots" USING btree ("branch_id","metric_type","date");