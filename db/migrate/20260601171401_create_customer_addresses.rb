class CreateCustomerAddresses < ActiveRecord::Migration[8.1]
  def change
    create_table :customer_addresses do |t|
      t.references :customer, null: false, foreign_key: true
      t.string :alias
      t.string :address
      t.decimal :latitude
      t.decimal :longitude
      t.boolean :is_default

      t.timestamps
    end
  end
end
