class CreatePriceLists < ActiveRecord::Migration[8.1]
  def change
    create_table :price_lists do |t|
      t.string :name, null: false
      t.string :code
      t.boolean :active, default: true, null: false
      t.references :company, null: false, foreign_key: true

      t.timestamps
    end
  end
end
