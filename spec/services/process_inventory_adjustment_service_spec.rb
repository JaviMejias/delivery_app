require 'rails_helper'

RSpec.describe ProcessInventoryAdjustmentService do
  let(:company) { Company.create!(name: 'Test Company', slug: 'test') }
  let(:user) { User.create!(first_name: 'Admin', last_name: 'Test', email: 'admin@test.com', password: 'password123', current_company_id: company.id) }
  let(:warehouse) { Warehouse.create!(name: 'Main', company_id: company.id) }
  let(:material_category) { MaterialCategory.create!(name: 'Gas', company_id: company.id) }
  let(:material) { Material.create!(name: 'Cilindro', company_id: company.id, material_category_id: material_category.id) }
  let(:brand) { Brand.create!(name: 'Brand', company_id: company.id) }
  let(:product) { Product.create!(name: 'Gas 15kg', company_id: company.id, brand_id: brand.id, material_id: material.id) }

  describe '#call' do
    it 'creates an inventory record and stock movement when increasing stock' do
      params = {
        warehouse_id: warehouse.id,
        item_type: 'Product',
        item_id: product.id,
        quantity_change: 10,
        reason: 'Initial load'
      }

      service = ProcessInventoryAdjustmentService.new(company, user, params)

      expect { service.call }.to change { Inventory.count }.by(1).and change { StockMovement.count }.by(1)

      inventory = Inventory.find_by(warehouse: warehouse, item: product)
      expect(inventory.quantity).to eq(10)

      movement = StockMovement.last
      expect(movement.movement_type).to eq('adjustment')
      expect(movement.quantity).to eq(10)
    end

    it 'updates existing inventory and creates stock movement when reducing stock' do
      Inventory.create!(company: company, warehouse: warehouse, item: product, quantity: 20)

      params = {
        warehouse_id: warehouse.id,
        item_type: 'Product',
        item_id: product.id,
        quantity_change: -5,
        reason: 'Damaged'
      }

      service = ProcessInventoryAdjustmentService.new(company, user, params)

      expect { service.call }.to change { Inventory.count }.by(0).and change { StockMovement.count }.by(1)

      inventory = Inventory.find_by(warehouse: warehouse, item: product)
      expect(inventory.quantity).to eq(15)

      movement = StockMovement.last
      expect(movement.quantity).to eq(-5)
      expect(movement.reference).to eq(user)
    end

    it 'returns an error string if the resulting quantity is negative' do
      Inventory.create!(company: company, warehouse: warehouse, item: product, quantity: 5)

      params = {
        warehouse_id: warehouse.id,
        item_type: 'Product',
        item_id: product.id,
        quantity_change: -10,
        reason: 'Sell out'
      }

      service = ProcessInventoryAdjustmentService.new(company, user, params)
      result = service.call

      expect(result).to eq("La cantidad resultante no puede ser negativa")

      # Should not have changed the inventory
      expect(Inventory.find_by(warehouse: warehouse, item: product).quantity).to eq(5)
      expect(StockMovement.count).to eq(0)
    end
  end
end
