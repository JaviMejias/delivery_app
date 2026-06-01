class ProcessInventoryAdjustmentService
  def initialize(company, user, params)
    @company = company
    @user = user
    @warehouse_id = params[:warehouse_id]
    @item_type = params[:item_type]
    @item_id = params[:item_id]
    @quantity_change = params[:quantity_change].to_i
    @reason = params[:reason]
  end

  def call
    raise "Bodega no encontrada" unless warehouse
    raise "Item inválido" unless item
    raise "Cantidad no puede ser cero" if @quantity_change.zero?
    raise "Debe especificar un motivo" if @reason.blank?

    ActiveRecord::Base.transaction do
      # 1. Update or create Inventory record
      inventory = Inventory.find_or_initialize_by(
        company: @company,
        warehouse: warehouse,
        item_type: @item_type,
        item_id: @item_id
      )
      
      current_qty = inventory.quantity || 0
      new_qty = current_qty + @quantity_change
      
      raise "La cantidad resultante no puede ser negativa" if new_qty < 0
      
      inventory.quantity = new_qty
      inventory.save!

      # 2. Create StockMovement
      StockMovement.create!(
        company: @company,
        warehouse: warehouse,
        item_type: @item_type,
        item_id: @item_id,
        movement_type: :adjustment,
        quantity: @quantity_change,
        reason: @reason,
        reference: @user # User performing the adjustment
      )
    end
    
    true
  rescue => e
    Rails.logger.error "Error in ProcessInventoryAdjustmentService: #{e.message}"
    e.message
  end

  private

  def warehouse
    @warehouse ||= @company.warehouses.find_by(id: @warehouse_id)
  end

  def item
    @item ||= if @item_type == 'Product'
      @company.products.find_by(id: @item_id)
    elsif @item_type == 'Material'
      @company.materials.find_by(id: @item_id)
    end
  end
end
