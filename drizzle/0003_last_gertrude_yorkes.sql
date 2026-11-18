ALTER TABLE "food_orders" ADD COLUMN "customer_whatsapp" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX "food_orders_whatsapp_idx" ON "food_orders" USING btree ("customer_whatsapp");