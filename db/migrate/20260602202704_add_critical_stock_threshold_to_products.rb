class AddCriticalStockThresholdToProducts < ActiveRecord::Migration[8.1]
  def change
    add_column :products, :critical_stock_threshold, :integer, default: 20, null: false
  end
end
