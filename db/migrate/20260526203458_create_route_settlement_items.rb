class CreateRouteSettlementItems < ActiveRecord::Migration[8.1]
  def change
    create_table :route_settlement_items do |t|
      t.references :route_settlement, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.integer :sold_quantity
      t.integer :returned_empty_quantity

      t.timestamps
    end
  end
end
