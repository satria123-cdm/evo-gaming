ALTER TABLE "food_orders" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "food_order_items_order_idx" ON "food_order_items" USING btree ("food_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "food_orders_code_unique" ON "food_orders" USING btree ("order_code");--> statement-breakpoint
CREATE INDEX "food_orders_status_idx" ON "food_orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "food_orders_created_idx" ON "food_orders" USING btree ("created_at");