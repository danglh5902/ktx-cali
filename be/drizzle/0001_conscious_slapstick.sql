ALTER TABLE "room_types" ADD COLUMN "bunk_lower_price" bigint;--> statement-breakpoint
ALTER TABLE "room_types" ADD COLUMN "bunk_upper_price" bigint;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "bunk_lower_price_override" bigint;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "bunk_upper_price_override" bigint;