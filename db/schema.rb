# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_04_150500) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "brands", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.bigint "company_id"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_brands_on_company_id"
  end

  create_table "companies", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.string "address"
    t.string "business_activity"
    t.datetime "created_at", null: false
    t.string "email"
    t.boolean "enable_public_orders", default: false, null: false
    t.string "legal_representative"
    t.string "name", null: false
    t.string "phone"
    t.string "rut"
    t.string "slug"
    t.datetime "updated_at", null: false
    t.string "website"
    t.index ["slug"], name: "index_companies_on_slug", unique: true
  end

  create_table "company_memberships", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.string "role", default: "warehouse_keeper", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.bigint "warehouse_id"
    t.index ["company_id"], name: "index_company_memberships_on_company_id"
    t.index ["user_id"], name: "index_company_memberships_on_user_id"
    t.index ["warehouse_id"], name: "index_company_memberships_on_warehouse_id"
  end

  create_table "company_phones", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.string "label"
    t.string "number"
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_company_phones_on_company_id"
  end

  create_table "customer_addresses", force: :cascade do |t|
    t.string "address"
    t.string "alias"
    t.datetime "created_at", null: false
    t.bigint "customer_id", null: false
    t.boolean "is_default"
    t.decimal "latitude"
    t.decimal "longitude"
    t.text "notes"
    t.datetime "updated_at", null: false
    t.index ["customer_id"], name: "index_customer_addresses_on_customer_id"
  end

  create_table "customer_orders", force: :cascade do |t|
    t.string "address", null: false
    t.string "client_name", null: false
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.bigint "customer_id"
    t.jsonb "details", default: {}
    t.decimal "latitude", precision: 10, scale: 6, null: false
    t.integer "lock_version", default: 0, null: false
    t.decimal "longitude", precision: 10, scale: 6, null: false
    t.text "notes"
    t.string "order_token", null: false
    t.string "phone"
    t.integer "status", default: 0, null: false, comment: "0=pending,1=accepted,2=in_transit,3=completed,4=cancelled,5=nearby,6=arrived"
    t.bigint "truck_id"
    t.datetime "updated_at", null: false
    t.index ["company_id", "status"], name: "index_customer_orders_on_company_id_and_status"
    t.index ["company_id"], name: "index_customer_orders_on_company_id"
    t.index ["customer_id"], name: "index_customer_orders_on_customer_id"
    t.index ["order_token"], name: "index_customer_orders_on_order_token", unique: true
    t.index ["truck_id"], name: "index_customer_orders_on_truck_id"
  end

  create_table "customers", force: :cascade do |t|
    t.string "address"
    t.datetime "cancellations_reset_at"
    t.integer "company_id"
    t.datetime "created_at", null: false
    t.string "email"
    t.string "encrypted_password", default: "", null: false
    t.string "first_name"
    t.string "last_name"
    t.decimal "latitude"
    t.decimal "longitude"
    t.string "phone"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.datetime "updated_at", null: false
    t.index ["email", "company_id"], name: "index_customers_on_email_and_company_id", unique: true
    t.index ["phone", "company_id"], name: "index_customers_on_phone_and_company_id", unique: true
    t.index ["reset_password_token"], name: "index_customers_on_reset_password_token", unique: true
  end

  create_table "expense_documents", force: :cascade do |t|
    t.decimal "amount_applied", precision: 12, scale: 2, default: "0.0"
    t.datetime "created_at", null: false
    t.bigint "purchase_document_id", null: false
    t.bigint "treasury_expense_id", null: false
    t.datetime "updated_at", null: false
    t.index ["purchase_document_id"], name: "index_expense_documents_on_purchase_document_id"
    t.index ["treasury_expense_id"], name: "index_expense_documents_on_treasury_expense_id"
  end

  create_table "inventories", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.bigint "item_id", null: false
    t.string "item_type", null: false
    t.integer "quantity"
    t.datetime "updated_at", null: false
    t.bigint "warehouse_id", null: false
    t.index ["company_id"], name: "index_inventories_on_company_id"
    t.index ["item_type", "item_id"], name: "index_inventories_on_item"
    t.index ["warehouse_id"], name: "index_inventories_on_warehouse_id"
  end

  create_table "local_closures", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.date "date"
    t.decimal "declared_card", default: "0.0"
    t.decimal "declared_cash", default: "0.0"
    t.decimal "declared_total", default: "0.0"
    t.decimal "declared_transfer", default: "0.0"
    t.text "observations"
    t.integer "status"
    t.decimal "system_card", default: "0.0"
    t.decimal "system_cash", default: "0.0"
    t.decimal "system_total", default: "0.0"
    t.decimal "system_transfer", default: "0.0"
    t.datetime "updated_at", null: false
    t.bigint "warehouse_id", null: false
    t.index ["company_id"], name: "index_local_closures_on_company_id"
    t.index ["warehouse_id"], name: "index_local_closures_on_warehouse_id"
  end

  create_table "local_sale_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "local_sale_id", null: false
    t.bigint "price_list_id"
    t.bigint "product_id", null: false
    t.integer "quantity"
    t.integer "returned_empty_quantity"
    t.decimal "subtotal"
    t.decimal "unit_price", default: "0.0", null: false
    t.datetime "updated_at", null: false
    t.string "voucher_code"
    t.index ["local_sale_id"], name: "index_local_sale_items_on_local_sale_id"
    t.index ["price_list_id"], name: "index_local_sale_items_on_price_list_id"
    t.index ["product_id"], name: "index_local_sale_items_on_product_id"
  end

  create_table "local_sales", force: :cascade do |t|
    t.decimal "card_revenue", default: "0.0"
    t.decimal "card_surcharge", default: "0.0"
    t.decimal "cash_revenue", default: "0.0"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.date "date"
    t.integer "sale_type"
    t.integer "status"
    t.decimal "total_revenue", default: "0.0"
    t.decimal "transfer_revenue", default: "0.0"
    t.datetime "updated_at", null: false
    t.decimal "voucher_revenue", default: "0.0"
    t.bigint "warehouse_id", null: false
    t.index ["company_id"], name: "index_local_sales_on_company_id"
    t.index ["warehouse_id"], name: "index_local_sales_on_warehouse_id"
  end

  create_table "material_categories", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.bigint "company_id"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_material_categories_on_company_id"
  end

  create_table "materials", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.bigint "company_id"
    t.datetime "created_at", null: false
    t.text "description"
    t.bigint "material_category_id", null: false
    t.decimal "measure"
    t.string "name", null: false
    t.boolean "returnable", default: true, null: false
    t.string "unit", default: "unit", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_materials_on_company_id"
    t.index ["material_category_id"], name: "index_materials_on_material_category_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.string "action_url"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.text "message"
    t.string "notification_type"
    t.datetime "read_at"
    t.string "title"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["company_id"], name: "index_notifications_on_company_id"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "price_lists", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.boolean "available_for_local", default: false
    t.boolean "available_for_trucks", default: false
    t.string "code"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_price_lists_on_company_id"
  end

  create_table "product_prices", force: :cascade do |t|
    t.bigint "company_id"
    t.datetime "created_at", null: false
    t.decimal "price"
    t.bigint "price_list_id", null: false
    t.bigint "product_id", null: false
    t.datetime "updated_at", null: false
    t.datetime "valid_from"
    t.datetime "valid_until"
    t.index ["company_id"], name: "index_product_prices_on_company_id"
    t.index ["price_list_id"], name: "index_product_prices_on_price_list_id"
    t.index ["product_id"], name: "index_product_prices_on_product_id"
  end

  create_table "products", force: :cascade do |t|
    t.boolean "accepts_vouchers", default: false
    t.boolean "active"
    t.boolean "available_in_app", default: true
    t.bigint "brand_id", null: false
    t.bigint "company_id"
    t.datetime "created_at", null: false
    t.integer "critical_stock_threshold", default: 20, null: false
    t.bigint "material_id", null: false
    t.string "name"
    t.string "sku"
    t.datetime "updated_at", null: false
    t.index ["brand_id"], name: "index_products_on_brand_id"
    t.index ["company_id"], name: "index_products_on_company_id"
    t.index ["material_id"], name: "index_products_on_material_id"
  end

  create_table "purchase_document_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "has_iva", default: true
    t.bigint "product_id", null: false
    t.bigint "purchase_document_id", null: false
    t.decimal "quantity"
    t.decimal "subtotal"
    t.decimal "tax_amount"
    t.decimal "total"
    t.decimal "unit_price"
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_purchase_document_items_on_product_id"
    t.index ["purchase_document_id"], name: "index_purchase_document_items_on_purchase_document_id"
  end

  create_table "purchase_documents", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.string "document_number"
    t.integer "document_type", default: 0
    t.date "due_date"
    t.date "issue_date"
    t.decimal "net_amount", precision: 12, scale: 2, default: "0.0"
    t.decimal "paid_amount", precision: 12, scale: 2, default: "0.0"
    t.bigint "purchase_order_id"
    t.integer "reference_document_id"
    t.integer "status", default: 0
    t.bigint "supplier_id"
    t.decimal "tax_amount", precision: 12, scale: 2, default: "0.0"
    t.decimal "total_amount", precision: 12, scale: 2, default: "0.0"
    t.datetime "updated_at", null: false
    t.index ["company_id", "supplier_id", "document_type", "document_number"], name: "index_purchase_documents_uniqueness", unique: true, where: "((document_number IS NOT NULL) AND ((document_number)::text <> ''::text) AND (status <> 3))"
    t.index ["company_id"], name: "index_purchase_documents_on_company_id"
    t.index ["purchase_order_id"], name: "index_purchase_documents_on_purchase_order_id"
    t.index ["reference_document_id"], name: "index_purchase_documents_on_reference_document_id"
    t.index ["supplier_id"], name: "index_purchase_documents_on_supplier_id"
  end

  create_table "purchase_order_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "has_iva", default: true
    t.bigint "product_id", null: false
    t.bigint "purchase_order_id", null: false
    t.integer "quantity"
    t.integer "received_quantity", default: 0
    t.decimal "subtotal"
    t.decimal "tax_amount", precision: 12, scale: 2, default: "0.0"
    t.decimal "total", precision: 12, scale: 2, default: "0.0"
    t.decimal "unit_price"
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_purchase_order_items_on_product_id"
    t.index ["purchase_order_id"], name: "index_purchase_order_items_on_purchase_order_id"
  end

  create_table "purchase_orders", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.integer "status"
    t.bigint "supplier_id", null: false
    t.decimal "total"
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_purchase_orders_on_company_id"
    t.index ["supplier_id"], name: "index_purchase_orders_on_supplier_id"
  end

  create_table "route_settlement_expenses", force: :cascade do |t|
    t.decimal "amount"
    t.datetime "created_at", null: false
    t.string "description"
    t.string "payment_method"
    t.bigint "route_settlement_id", null: false
    t.datetime "updated_at", null: false
    t.index ["route_settlement_id"], name: "index_route_settlement_expenses_on_route_settlement_id"
  end

  create_table "route_settlement_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "price_list_id"
    t.bigint "product_id", null: false
    t.integer "returned_empty_quantity"
    t.bigint "route_settlement_id", null: false
    t.integer "sold_quantity"
    t.decimal "subtotal", default: "0.0", null: false
    t.decimal "unit_price", default: "0.0", null: false
    t.datetime "updated_at", null: false
    t.index ["price_list_id"], name: "index_route_settlement_items_on_price_list_id"
    t.index ["product_id"], name: "index_route_settlement_items_on_product_id"
    t.index ["route_settlement_id"], name: "index_route_settlement_items_on_route_settlement_id"
  end

  create_table "route_settlements", force: :cascade do |t|
    t.decimal "card_revenue", default: "0.0"
    t.decimal "cash_revenue", default: "0.0"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.date "date"
    t.integer "status"
    t.decimal "total_revenue"
    t.decimal "transfer_revenue", default: "0.0"
    t.bigint "truck_id", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_route_settlements_on_company_id"
    t.index ["truck_id"], name: "index_route_settlements_on_truck_id"
  end

  create_table "stock_movements", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.bigint "item_id", null: false
    t.string "item_type", null: false
    t.integer "movement_type"
    t.integer "quantity"
    t.string "reason"
    t.bigint "reference_id", null: false
    t.string "reference_type", null: false
    t.datetime "updated_at", null: false
    t.bigint "warehouse_id", null: false
    t.index ["company_id"], name: "index_stock_movements_on_company_id"
    t.index ["item_type", "item_id"], name: "index_stock_movements_on_item"
    t.index ["reference_type", "reference_id"], name: "index_stock_movements_on_reference"
    t.index ["warehouse_id"], name: "index_stock_movements_on_warehouse_id"
  end

  create_table "stock_transfer_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "item_id", null: false
    t.string "item_type", null: false
    t.integer "quantity"
    t.bigint "stock_transfer_id", null: false
    t.datetime "updated_at", null: false
    t.index ["item_type", "item_id"], name: "index_stock_transfer_items_on_item"
    t.index ["stock_transfer_id"], name: "index_stock_transfer_items_on_stock_transfer_id"
  end

  create_table "stock_transfers", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.integer "destination_warehouse_id"
    t.integer "source_warehouse_id"
    t.integer "status"
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_stock_transfers_on_company_id"
  end

  create_table "suppliers", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.bigint "company_id"
    t.string "contact_email"
    t.string "contact_phone"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "rut", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_suppliers_on_company_id"
  end

  create_table "treasury_expenses", force: :cascade do |t|
    t.decimal "amount", precision: 12, scale: 2, default: "0.0"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.date "date"
    t.text "notes"
    t.string "payment_method"
    t.string "reference_number"
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_treasury_expenses_on_company_id"
  end

  create_table "treasury_incomes", force: :cascade do |t|
    t.decimal "amount", precision: 12, scale: 2, default: "0.0"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.date "date"
    t.string "payment_method"
    t.bigint "source_id", null: false
    t.string "source_type", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_treasury_incomes_on_company_id"
    t.index ["source_type", "source_id"], name: "index_treasury_incomes_on_source"
  end

  create_table "trucks", force: :cascade do |t|
    t.boolean "active"
    t.bigint "base_warehouse_id"
    t.date "circulation_permit_date"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.integer "current_km"
    t.datetime "departure_time"
    t.string "destination_address"
    t.string "destination_client_name"
    t.decimal "destination_latitude", precision: 10, scale: 6
    t.decimal "destination_longitude", precision: 10, scale: 6
    t.bigint "driver_id"
    t.string "gps_device_token"
    t.datetime "gps_last_updated_at"
    t.boolean "has_gps", default: false
    t.decimal "latitude", precision: 10, scale: 6
    t.decimal "longitude", precision: 10, scale: 6
    t.integer "mileage_update_frequency", default: 0
    t.integer "next_maintenance_km"
    t.string "plate_number"
    t.integer "route_current_index", default: 0
    t.text "route_points"
    t.date "technical_revision_date"
    t.datetime "updated_at", null: false
    t.bigint "warehouse_id", null: false
    t.index ["base_warehouse_id"], name: "index_trucks_on_base_warehouse_id"
    t.index ["company_id"], name: "index_trucks_on_company_id"
    t.index ["driver_id"], name: "index_trucks_on_driver_id"
    t.index ["gps_device_token"], name: "index_trucks_on_gps_device_token", unique: true
    t.index ["warehouse_id"], name: "index_trucks_on_warehouse_id"
  end

  create_table "users", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.date "birthday"
    t.datetime "created_at", null: false
    t.integer "current_company_id"
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "first_name", default: "", null: false
    t.string "last_name", default: "", null: false
    t.date "license_expiration"
    t.string "license_type"
    t.string "phone"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "role", default: 0, null: false
    t.string "rut"
    t.boolean "super_admin", default: false, null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "warehouses", force: :cascade do |t|
    t.boolean "active"
    t.string "address"
    t.decimal "card_surcharge_amount", default: "0.0"
    t.integer "card_surcharge_type"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.decimal "latitude", precision: 10, scale: 6
    t.decimal "longitude", precision: 10, scale: 6
    t.string "name"
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_warehouses_on_company_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "brands", "companies"
  add_foreign_key "company_memberships", "companies"
  add_foreign_key "company_memberships", "users"
  add_foreign_key "company_memberships", "warehouses"
  add_foreign_key "company_phones", "companies"
  add_foreign_key "customer_addresses", "customers"
  add_foreign_key "customer_orders", "companies"
  add_foreign_key "customer_orders", "customers"
  add_foreign_key "customer_orders", "trucks"
  add_foreign_key "expense_documents", "purchase_documents"
  add_foreign_key "expense_documents", "treasury_expenses"
  add_foreign_key "inventories", "companies"
  add_foreign_key "inventories", "warehouses"
  add_foreign_key "local_closures", "companies"
  add_foreign_key "local_closures", "warehouses"
  add_foreign_key "local_sale_items", "local_sales"
  add_foreign_key "local_sale_items", "price_lists"
  add_foreign_key "local_sale_items", "products"
  add_foreign_key "local_sales", "companies"
  add_foreign_key "local_sales", "warehouses"
  add_foreign_key "material_categories", "companies"
  add_foreign_key "materials", "companies"
  add_foreign_key "materials", "material_categories"
  add_foreign_key "notifications", "companies"
  add_foreign_key "notifications", "users"
  add_foreign_key "price_lists", "companies"
  add_foreign_key "product_prices", "companies"
  add_foreign_key "product_prices", "price_lists"
  add_foreign_key "product_prices", "products"
  add_foreign_key "products", "brands"
  add_foreign_key "products", "companies"
  add_foreign_key "products", "materials"
  add_foreign_key "purchase_document_items", "products"
  add_foreign_key "purchase_document_items", "purchase_documents"
  add_foreign_key "purchase_documents", "companies"
  add_foreign_key "purchase_documents", "purchase_orders"
  add_foreign_key "purchase_documents", "suppliers"
  add_foreign_key "purchase_order_items", "products"
  add_foreign_key "purchase_order_items", "purchase_orders"
  add_foreign_key "purchase_orders", "companies"
  add_foreign_key "purchase_orders", "suppliers"
  add_foreign_key "route_settlement_expenses", "route_settlements"
  add_foreign_key "route_settlement_items", "price_lists"
  add_foreign_key "route_settlement_items", "products"
  add_foreign_key "route_settlement_items", "route_settlements"
  add_foreign_key "route_settlements", "companies"
  add_foreign_key "route_settlements", "trucks"
  add_foreign_key "stock_movements", "companies"
  add_foreign_key "stock_movements", "warehouses"
  add_foreign_key "stock_transfer_items", "stock_transfers"
  add_foreign_key "stock_transfers", "companies"
  add_foreign_key "suppliers", "companies"
  add_foreign_key "treasury_expenses", "companies"
  add_foreign_key "treasury_incomes", "companies"
  add_foreign_key "trucks", "companies"
  add_foreign_key "trucks", "users", column: "driver_id"
  add_foreign_key "trucks", "warehouses"
  add_foreign_key "trucks", "warehouses", column: "base_warehouse_id"
  add_foreign_key "warehouses", "companies"
end
