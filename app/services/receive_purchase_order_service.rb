class ReceivePurchaseOrderService
  def initialize(order, received_items_data)
    @order = order
    @received_items_data = received_items_data || {}
    @company = order.company
  end

  def call
    raise "Esta orden ya fue recibida." if @order.received?

    warehouse = Warehouse.active_warehouses.first
    raise "Debes crear al menos una Bodega Activa antes de recibir compras." unless warehouse

    ActiveRecord::Base.transaction do
      @order.purchase_order_items.each do |item|
        received_qty = @received_items_data[item.id.to_s].to_i
        item.update!(received_quantity: received_qty)

        next if received_qty <= 0 # Si llegó 0, no sumamos stock
        inventory = Inventory.find_or_initialize_by(
          company_id: @company.id,
          warehouse_id: warehouse.id,
          item: item.product
        )
        inventory.quantity = (inventory.quantity || 0) + received_qty
        inventory.save!
        StockMovement.create!(
          company_id: @company.id,
          warehouse_id: warehouse.id,
          item: item.product,
          reference: @order,
          quantity: received_qty,
          movement_type: :purchase,
          reason: "Recepción de Orden de Compra ##{@order.id}"
        )
      end

      @order.update!(status: :received)
    end
  end
end
