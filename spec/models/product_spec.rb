require 'rails_helper'

RSpec.describe Product, type: :model do
  describe '#full_name' do
    it 'includes the material measure, unit, and brand' do
      material = instance_double(Material, full_name: 'Cilindro 45 KG')
      brand = instance_double(Brand, name: 'Lipigas')
      product = described_class.new(name: 'Cilindro', material: material, brand: brand)

      expect(product.full_name).to eq('Cilindro 45 KG Lipigas')
    end
  end
end
