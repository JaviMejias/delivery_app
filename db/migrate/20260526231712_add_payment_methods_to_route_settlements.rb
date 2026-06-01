class AddPaymentMethodsToRouteSettlements < ActiveRecord::Migration[8.1]
  def change
    add_column :route_settlements, :cash_revenue, :decimal, default: 0.0
    add_column :route_settlements, :card_revenue, :decimal, default: 0.0
    add_column :route_settlements, :transfer_revenue, :decimal, default: 0.0
  end
end
