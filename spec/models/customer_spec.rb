require 'rails_helper'

RSpec.describe Customer, type: :model do
  describe '#cancellations_in_last_24h' do
    let(:company) { Company.create!(name: 'Test Company', slug: 'test') }
    let(:customer) { Customer.create!(first_name: 'John', last_name: 'Doe', phone: '123456789', company_id: company.id, password: 'password123') }

    it 'returns 0 if there are no cancellations' do
      expect(customer.cancellations_in_last_24h).to eq(0)
    end

    it 'counts only cancelled orders within the last 24 hours' do
      CustomerOrder.create!(client_name: 'John', phone: '123456789', address: '123 Main St', latitude: 0, longitude: 0, company: company, customer_id: customer.id, status: :cancelled, details: { 'items' => [ { 'name' => 'Gas 15kg', 'quantity' => 1 } ] }, order_token: '1')
      CustomerOrder.create!(client_name: 'John', phone: '123456789', address: '123 Main St', latitude: 0, longitude: 0, company: company, customer_id: customer.id, status: :pending, details: { 'items' => [ { 'name' => 'Gas 15kg', 'quantity' => 1 } ] }, order_token: '2')

      # Older than 24 hours
      old_order = CustomerOrder.create!(client_name: 'John', phone: '123456789', address: '123 Main St', latitude: 0, longitude: 0, company: company, customer_id: customer.id, status: :cancelled, details: { 'items' => [ { 'name' => 'Gas 15kg', 'quantity' => 1 } ] }, order_token: '3')
      old_order.update_column(:updated_at, 25.hours.ago)

      expect(customer.cancellations_in_last_24h).to eq(1)
    end

    it 'resets the count if cancellations_reset_at is set recently' do
      CustomerOrder.create!(client_name: 'John', phone: '123456789', address: '123 Main St', latitude: 0, longitude: 0, company: company, customer_id: customer.id, status: :cancelled, details: { 'items' => [ { 'name' => 'Gas 15kg', 'quantity' => 1 } ] }, order_token: '1')
      CustomerOrder.create!(client_name: 'John', phone: '123456789', address: '123 Main St', latitude: 0, longitude: 0, company: company, customer_id: customer.id, status: :cancelled, details: { 'items' => [ { 'name' => 'Gas 15kg', 'quantity' => 1 } ] }, order_token: '2')

      customer.update!(cancellations_reset_at: Time.current)

      CustomerOrder.create!(client_name: 'John', phone: '123456789', address: '123 Main St', latitude: 0, longitude: 0, company: company, customer_id: customer.id, status: :cancelled, details: { 'items' => [ { 'name' => 'Gas 15kg', 'quantity' => 1 } ] }, order_token: '3')

      # The 2 orders before reset should be ignored, so it should be 1
      expect(customer.cancellations_in_last_24h).to eq(1)
    end
  end

  describe '.filter_by_status' do
    let(:company) { Company.create!(name: 'Test Company', slug: 'test') }
    let(:customer_active) { Customer.create!(first_name: 'Active', last_name: 'User', phone: '111', company_id: company.id, password: 'password123') }
    let(:customer_blocked) { Customer.create!(first_name: 'Blocked', last_name: 'User', phone: '222', company_id: company.id, password: 'password123') }

    before do
      # 3 cancelled orders -> blocked
      3.times do |i|
        CustomerOrder.create!(client_name: 'Blocked', phone: '222', address: '123', latitude: 0, longitude: 0, company: company, customer_id: customer_blocked.id, status: :cancelled, details: { 'items' => [ { 'name' => 'Gas 15kg', 'quantity' => 1 } ] }, order_token: "b#{i}")
      end
    end

    it 'returns blocked customers when status is blocked' do
      blocked = Customer.filter_by_status('blocked')
      expect(blocked).to include(customer_blocked)
      expect(blocked).not_to include(customer_active)
    end

    it 'returns active customers when status is active' do
      active = Customer.filter_by_status('active')
      expect(active).to include(customer_active)
      expect(active).not_to include(customer_blocked)
    end
  end
end
