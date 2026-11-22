require 'rails_helper'

RSpec.describe Material, type: :model do
  describe '#full_name' do
    it 'includes the normalized measure and unit' do
      material = described_class.new(name: 'Cilindro', measure: 45, unit: 'KG')

      expect(material.full_name).to eq('Cilindro 45 KG')
    end

    it 'omits the generic unit' do
      material = described_class.new(name: 'Envase', measure: nil, unit: 'UN')

      expect(material.full_name).to eq('Envase')
    end
  end
end
