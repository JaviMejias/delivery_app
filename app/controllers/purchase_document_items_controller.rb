class PurchaseDocumentItemsController < ApplicationController
  def create
    @document = PurchaseDocument.find(params[:purchase_document_id])
    item = @document.purchase_document_items.new(item_params)

    if item.save
      redirect_to purchase_document_path(@document), notice: "Producto agregado."
    else
      redirect_to purchase_document_path(@document), alert: "Error al agregar el producto: #{item.errors.full_messages.join(', ')}"
    end
  end

  def destroy
    item = PurchaseDocumentItem.find(params[:id])
    @document = item.purchase_document
    item.destroy
    redirect_to purchase_document_path(@document), notice: "Producto eliminado."
  end

  def update
    item = PurchaseDocumentItem.find(params[:id])
    @document = item.purchase_document
    if item.update(item_params)
      redirect_to purchase_document_path(@document), notice: "Producto actualizado."
    else
      redirect_to purchase_document_path(@document), alert: "Error al actualizar: #{item.errors.full_messages.join(', ')}"
    end
  end

  private

  def item_params
    params.require(:purchase_document_item).permit(:product_id, :quantity, :unit_price, :has_iva)
  end
end
