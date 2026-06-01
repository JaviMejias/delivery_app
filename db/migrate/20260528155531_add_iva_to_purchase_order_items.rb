class AddIvaToPurchaseOrderItems < ActiveRecord::Migration[8.1]
  def change
    add_column :purchase_order_items, :has_iva, :boolean, default: true
    add_column :purchase_order_items, :tax_amount, :decimal, precision: 12, scale: 2, default: 0
    add_column :purchase_order_items, :total, :decimal, precision: 12, scale: 2, default: 0
  end
end
