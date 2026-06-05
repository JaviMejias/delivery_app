class ProcessStockTransferService
  def initialize(transfer)
    @transfer = transfer
    @company = transfer.company
  end

  def call
    raise "Esta transferencia ya fue completada." if @transfer.completed?

    ActiveRecord::Base.transaction do
      @transfer.stock_transfer_items.each do |t_item|
        source_inv = Inventory.find_or_initialize_by(
          company_id: @company.id,
          warehouse_id: @transfer.source_warehouse_id,
          item: t_item.item
        )
        source_inv.quantity = (source_inv.quantity || 0) - t_item.quantity
        source_inv.save!

        StockMovement.create!(
          company_id: @company.id,
          warehouse_id: @transfer.source_warehouse_id,
          item: t_item.item,
          reference: @transfer,
          quantity: -t_item.quantity,
          movement_type: :transfer_out,
          reason: "Transferencia ##{@transfer.id} hacia #{@transfer.destination_warehouse.name}"
        )
        dest_inv = Inventory.find_or_initialize_by(
          company_id: @company.id,
          warehouse_id: @transfer.destination_warehouse_id,
          item: t_item.item
        )
        dest_inv.quantity = (dest_inv.quantity || 0) + t_item.quantity
        dest_inv.save!

        StockMovement.create!(
          company_id: @company.id,
          warehouse_id: @transfer.destination_warehouse_id,
          item: t_item.item,
          reference: @transfer,
          quantity: t_item.quantity,
          movement_type: :transfer_in,
          reason: "Transferencia ##{@transfer.id} desde #{@transfer.source_warehouse.name}"
        )
      end
      @transfer.update!(status: :completed)
    end
  end
end
