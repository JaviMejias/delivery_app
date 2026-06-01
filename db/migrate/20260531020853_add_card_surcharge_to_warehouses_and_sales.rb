class AddCardSurchargeToWarehousesAndSales < ActiveRecord::Migration[8.1]
  def change
    add_column :warehouses, :card_surcharge_type, :integer
    add_column :warehouses, :card_surcharge_amount, :decimal, default: 0.0
    add_column :local_sales, :card_surcharge, :decimal, default: 0.0
  end
end
