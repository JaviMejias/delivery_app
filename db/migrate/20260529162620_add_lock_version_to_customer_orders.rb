class AddLockVersionToCustomerOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :customer_orders, :lock_version, :integer, default: 0, null: false
  end
end
