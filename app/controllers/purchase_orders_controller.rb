class PurchaseOrdersController < ApplicationController
  before_action :require_inventory_access!

  def index
    orders = FilterPurchasesService.call(params)

    if params[:format] == 'xlsx'
      send_data ExportPurchasesService.new(orders).to_xlsx, filename: "compras-#{Date.today}.xlsx", type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    else
      pagy, records = pagy(:offset, orders, limit: 20)
      suppliers = Supplier.active.ordered_by_name

      render inertia: "Purchases/Orders/Index", props: {
        orders: records.as_json(include: :supplier),
        suppliers: suppliers,
        pagination: extract_pagy(pagy),
        currentSearch: params[:search]
      }
    end
  end

  def show
    order = PurchaseOrder.with_full_details.find(params[:id])
    
    if params[:format] == 'pdf'
      pdf_data = GeneratePurchaseOrderPdfService.new(order).call
      send_data pdf_data, filename: "OC-#{order.id.to_s.rjust(4, '0')}.pdf", type: 'application/pdf', disposition: 'inline'
    else
      products = Product.active.ordered_by_name.with_details

      render inertia: "Purchases/Orders/Show", props: {
        order: order.as_json(include: {
          supplier: {},
          purchase_documents: {},
          purchase_order_items: {
            include: {
              product: {
                include: [ :material, :brand ]
              }
            }
          }
        }),
        products: products.as_json(include: [ :material, :brand ])
      }
    end
  end

  def create
    order = PurchaseOrder.new(purchase_order_params)
    order.status = :draft
    order.total = 0

    if order.save
      redirect_to purchase_order_path(order), notice: "Orden de compra creada."
    else
      redirect_to purchase_orders_path, alert: "Error al crear la orden."
    end
  end

  def destroy
    order = PurchaseOrder.find(params[:id])
    if order.draft?
      order.destroy
      redirect_to purchase_orders_path, notice: "Orden eliminada."
    else
      redirect_to purchase_orders_path, alert: "Solo se pueden eliminar órdenes en borrador."
    end
  end

  def receive
    @order = PurchaseOrder.includes(:purchase_order_items).find(params[:id])

    ReceivePurchaseOrderService.new(@order, params[:received_items]).call

    redirect_to purchase_order_path(@order), notice: "Orden recibida exitosamente. El inventario se ha actualizado."
  rescue => e
    redirect_to purchase_order_path(@order), alert: "Error al recibir orden: #{e.message}"
  end

  private

  def purchase_order_params
    params.require(:purchase_order).permit(:supplier_id)
  end
end
