class CreateStockMovements < ActiveRecord::Migration[8.1]
  def change
    create_table :stock_movements do |t|
      t.references :company, null: false, foreign_key: true
      t.references :warehouse, null: false, foreign_key: true
      t.references :item, polymorphic: true, null: false
      t.integer :quantity
      t.integer :movement_type
      t.string :reason
      t.references :reference, polymorphic: true, null: false

      t.timestamps
    end
  end
end
