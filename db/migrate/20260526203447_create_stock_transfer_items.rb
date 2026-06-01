class CreateStockTransferItems < ActiveRecord::Migration[8.1]
  def change
    create_table :stock_transfer_items do |t|
      t.references :stock_transfer, null: false, foreign_key: true
      t.references :item, polymorphic: true, null: false
      t.integer :quantity

      t.timestamps
    end
  end
end
