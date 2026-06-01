class CreateLocalSaleItems < ActiveRecord::Migration[8.1]
  def change
    create_table :local_sale_items do |t|
      t.references :local_sale, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.integer :quantity
      t.integer :returned_empty_quantity
      t.decimal :subtotal
      t.string :voucher_code

      t.timestamps
    end
  end
end
