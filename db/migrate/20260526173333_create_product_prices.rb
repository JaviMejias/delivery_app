class CreateProductPrices < ActiveRecord::Migration[8.1]
  def change
    create_table :product_prices do |t|
      t.references :product, null: false, foreign_key: true
      t.integer :channel, null: false, default: 0
      t.decimal :price, precision: 10, scale: 2, null: false
      t.datetime :valid_from, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.datetime :valid_until

      t.timestamps
    end
  end
end
