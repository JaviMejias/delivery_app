class CreateProducts < ActiveRecord::Migration[8.1]
  def change
    create_table :products do |t|
      t.references :material, null: false, foreign_key: true
      t.references :brand, null: false, foreign_key: true
      t.string :name, null: false
      t.string :sku, null: false
      t.decimal :weight_or_size, precision: 10, scale: 2, null: false
      t.boolean :active, null: false, default: true

      t.timestamps
    end
    add_index :products, :sku, unique: true
  end
end
