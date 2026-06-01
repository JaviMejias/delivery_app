class AddVoucherRevenueToLocalSales < ActiveRecord::Migration[8.1]
  def change
    add_column :local_sales, :voucher_revenue, :decimal, default: "0.0"
  end
end
