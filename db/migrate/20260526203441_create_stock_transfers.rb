class CreateStockTransfers < ActiveRecord::Migration[8.1]
  def change
    create_table :stock_transfers do |t|
      t.integer :source_warehouse_id
      t.integer :destination_warehouse_id
      t.integer :status
      t.references :company, null: false, foreign_key: true

      t.timestamps
    end
  end
end
