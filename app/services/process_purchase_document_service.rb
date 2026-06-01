class ProcessPurchaseDocumentService
  def initialize(document)
    @document = document
  end

  def process!
    ActiveRecord::Base.transaction do
      warehouse = Warehouse.find_by(name: "Central") || Warehouse.first

      @document.purchase_document_items.each do |item|
        inventory = Inventory.find_or_create_by!(
          company: @document.company,
          warehouse: warehouse,
          item: item.product
        )

        if @document.credit_note?
          inventory.update!(
            quantity: inventory.quantity - item.quantity
          )
          StockMovement.create!(
            warehouse: warehouse,
            item: item.product,
            movement_type: :adjustment,
            quantity: -item.quantity,
            reference: @document
          )
        else
          inventory.update!(
            quantity: inventory.quantity + item.quantity
          )
          StockMovement.create!(
            warehouse: warehouse,
            item: item.product,
            movement_type: :purchase,
            quantity: item.quantity,
            reference: @document
          )
        end
      end
    end
  end

  def reverse!
    ActiveRecord::Base.transaction do
      warehouse = Warehouse.find_by(name: "Central") || Warehouse.first

      @document.purchase_document_items.each do |item|
        inventory = Inventory.find_by(
          company: @document.company,
          warehouse: warehouse,
          item: item.product
        )

        if inventory
          if @document.credit_note?
            inventory.update!(
              quantity: inventory.quantity + item.quantity
            )
            StockMovement.create!(
              warehouse: warehouse,
              item: item.product,
              movement_type: :adjustment,
              quantity: item.quantity,
              reference: @document
            )
          else
            inventory.update!(
              quantity: inventory.quantity - item.quantity
            )
            StockMovement.create!(
              warehouse: warehouse,
              item: item.product,
              movement_type: :adjustment,
              quantity: -item.quantity,
              reference: @document
            )
          end
        end
      end
    end
  end
end
