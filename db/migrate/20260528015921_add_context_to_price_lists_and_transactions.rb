class AddContextToPriceListsAndTransactions < ActiveRecord::Migration[8.1]
  def change
    add_column :price_lists, :available_for_trucks, :boolean, default: false
    add_column :price_lists, :available_for_local, :boolean, default: false

    # For RouteSettlementItem
    add_reference :route_settlement_items, :price_list, null: true, foreign_key: true
    add_column :route_settlement_items, :unit_price, :decimal, default: 0.0, null: false
    add_column :route_settlement_items, :subtotal, :decimal, default: 0.0, null: false

    # For LocalSaleItem (subtotal already exists, so we just add reference and unit_price)
    add_reference :local_sale_items, :price_list, null: true, foreign_key: true
    add_column :local_sale_items, :unit_price, :decimal, default: 0.0, null: false
  end
end
