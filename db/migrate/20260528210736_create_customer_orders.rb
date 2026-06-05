class CreateCustomerOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :customer_orders do |t|
      t.references :company, null: false, foreign_key: true
      t.references :truck, null: true, foreign_key: true

      t.string :client_name, null: false
      t.string :phone
      t.string :address, null: false
      t.decimal :latitude, precision: 10, scale: 6, null: false
      t.decimal :longitude, precision: 10, scale: 6, null: false

      t.integer :status, default: 0, null: false  # enum
      t.jsonb :details, default: {}               # order items
      t.text :notes
      t.string :order_token, null: false           # for public tracking without auth

      t.timestamps
    end
    add_index :customer_orders, :order_token, unique: true
    add_index :customer_orders, [ :company_id, :status ]
  end
end
