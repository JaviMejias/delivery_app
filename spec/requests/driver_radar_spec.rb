require 'rails_helper'

RSpec.describe 'Driver Radar API', type: :request do
  let(:company) { Company.create!(name: 'Test Company', slug: 'test') }
  let(:driver_user) { User.create!(first_name: 'Driver', last_name: 'One', email: 'driver@test.com', password: 'password', current_company_id: company.id, role: :driver, rut: '12345678-9') }
  let(:other_driver_user) { User.create!(first_name: 'Driver', last_name: 'Two', email: 'driver2@test.com', password: 'password', current_company_id: company.id, role: :driver, rut: '87654321-0') }
  let(:warehouse) { Warehouse.create!(name: 'Base', company_id: company.id) }

  let!(:truck1) { Truck.create!(company: company, driver_id: driver_user.id, plate_number: 'TRK-001', active: true, warehouse: warehouse, latitude: 0, longitude: 0) }
  let!(:truck2) { Truck.create!(company: company, driver_id: other_driver_user.id, plate_number: 'TRK-002', active: true, warehouse: warehouse, latitude: 0, longitude: 0) }

  before do
    sign_in driver_user
  end

  describe 'GET /driver/radar/orders' do
    it 'returns pending orders and assigned active orders for the current truck' do
      # Pending order (no truck assigned)
      pending_order = CustomerOrder.create!(client_name: 'Pending', phone: '111', address: '123', latitude: 0, longitude: 0, company: company, status: :pending, details: { 'items'=>[ { 'name'=>'Gas 15kg', 'quantity'=>1 } ] }, order_token: '111')

      # Order assigned to THIS truck
      my_order = CustomerOrder.create!(client_name: 'Mine', phone: '222', address: '456', latitude: 0, longitude: 0, company: company, truck_id: truck1.id, status: :accepted, details: { 'items'=>[ { 'name'=>'Gas 15kg', 'quantity'=>1 } ] }, order_token: '222')

      # Order assigned to OTHER truck (should not be returned in pending_orders or active_order)
      other_order = CustomerOrder.create!(client_name: 'Theirs', phone: '333', address: '789', latitude: 0, longitude: 0, company: company, truck_id: truck2.id, status: :accepted, details: { 'items'=>[ { 'name'=>'Gas 15kg', 'quantity'=>1 } ] }, order_token: '333')

      get driver_radar_orders_path

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)

      # Check truck active order
      expect(json['truck']['active_order_id']).to eq(my_order.id)

      # Check pending orders list (should include pending order, but NOT other_order)
      order_ids = json['orders'].map { |o| o['id'] }
      expect(order_ids).to include(pending_order.id)
      expect(order_ids).not_to include(other_order.id)
    end
  end

  describe 'POST /driver/radar/complete/:order_id' do
    it 'completes an active order assigned to the driver' do
      order = CustomerOrder.create!(client_name: 'Mine', phone: '222', address: '456', latitude: 0, longitude: 0, company: company, truck_id: truck1.id, status: :accepted, details: { 'items'=>[ { 'name'=>'Gas 15kg', 'quantity'=>1 } ] }, order_token: '123')

      post "/driver/radar/complete/#{order.id}"

      expect(response).to have_http_status(:success)
      expect(order.reload.status).to eq('completed')
    end

    it 'cannot complete an order assigned to another driver' do
      order = CustomerOrder.create!(client_name: 'Theirs', phone: '333', address: '789', latitude: 0, longitude: 0, company: company, truck_id: truck2.id, status: :accepted, details: { 'items'=>[ { 'name'=>'Gas 15kg', 'quantity'=>1 } ] }, order_token: '123')

      post "/driver/radar/complete/#{order.id}"

      expect(response).to have_http_status(:not_found)
      expect(order.reload.status).to eq('accepted')
    end
  end

  describe 'POST /driver/radar/cancel/:order_id' do
    it 'cancels the assignment and resets the order to pending' do
      order = CustomerOrder.create!(client_name: 'Mine', phone: '222', address: '456', latitude: 0, longitude: 0, company: company, truck_id: truck1.id, status: :accepted, details: { 'items'=>[ { 'name'=>'Gas 15kg', 'quantity'=>1 } ] }, order_token: '123')

      post "/driver/radar/cancel/#{order.id}", params: { reason: 'Tire flat' }

      expect(response).to have_http_status(:success)

      order.reload
      expect(order.status).to eq('pending')
      expect(order.truck_id).to be_nil
      expect(order.notes).to include('Tire flat')
    end
  end
end
