class CreatePurchaseOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :purchase_orders do |t|
      t.references :company, null: false, foreign_key: true
      t.references :supplier, null: false, foreign_key: true
      t.integer :status
      t.decimal :total

      t.timestamps
    end
  end
end
