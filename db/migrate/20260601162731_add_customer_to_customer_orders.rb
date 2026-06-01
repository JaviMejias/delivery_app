class AddCustomerToCustomerOrders < ActiveRecord::Migration[8.1]
  def change
    add_reference :customer_orders, :customer, null: true, foreign_key: true
  end
end
