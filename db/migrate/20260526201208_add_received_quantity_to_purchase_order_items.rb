class AddReceivedQuantityToPurchaseOrderItems < ActiveRecord::Migration[7.1]
  def change
    add_column :purchase_order_items, :received_quantity, :integer, default: 0
  end
end
