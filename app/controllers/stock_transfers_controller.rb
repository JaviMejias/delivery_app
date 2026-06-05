class StockTransfersController < ApplicationController
  before_action :require_inventory_access!

  def index
    transfers = StockTransfer.with_details.recent.search_by_query(params[:search])
    pagy, records = pagy(:offset, transfers, limit: 20)
    plant_warehouses = Warehouse.active.stationary.ordered_by_name
    active_trucks = Truck.active_with_driver

    render inertia: "Inventory/Transfers/Index", props: {
      transfers: records.as_json(include: [ :source_warehouse, :destination_warehouse ]),
      plant_warehouses: plant_warehouses.as_json,
      trucks: active_trucks.as_json(include: [ :warehouse, :driver ]),
      pagination: extract_pagy(pagy),
      currentSearch: params[:search]
    }
  end

  def create
    transfer = StockTransfer.new(transfer_params)
    if transfer.save
      redirect_to inventory_transfer_path(transfer), notice: "Borrador creado. Ahora agrega los productos a mover."
    else
      redirect_to inventory_transfers_path, alert: "Error: #{transfer.errors.full_messages.join(', ')}"
    end
  end

  def show
    transfer = StockTransfer.includes(:source_warehouse, :destination_warehouse)
                            .find(params[:id])

    if params[:format] == "pdf"
      pdf_data = GenerateStockTransferPdfService.new(transfer).call
      send_data pdf_data, filename: "Guia-Despacho-#{transfer.id.to_s.rjust(4, '0')}.pdf", type: "application/pdf", disposition: "inline"
    else
      items_data = transfer.stock_transfer_items.map do |ti|
        item = ti.item
        item_json = item.as_json
        if item.is_a?(Product)
          item_json = item.as_json(include: [ :material, :brand ])
        end
        ti.as_json.merge("item" => item_json)
      end

      products = Product.where(active: true).includes(:material, :brand).order(:name)

      render inertia: "Inventory/Transfers/Show", props: {
        transfer: transfer.as_json(include: [ :source_warehouse, :destination_warehouse ])
                          .merge("stock_transfer_items" => items_data),
        products: products.as_json(include: [ :material, :brand ])
      }
    end
  end

  def complete
    transfer = StockTransfer.find(params[:id])

    begin
      ProcessStockTransferService.new(transfer).call
      redirect_to inventory_transfer_path(transfer), notice: "Transferencia ejecutada. El inventario ha sido actualizado."
    rescue => e
      redirect_to inventory_transfer_path(transfer), alert: "Error al completar transferencia: #{e.message}"
    end
  end

  private

  def transfer_params
    params.require(:stock_transfer).permit(:source_warehouse_id, :destination_warehouse_id)
  end
end
