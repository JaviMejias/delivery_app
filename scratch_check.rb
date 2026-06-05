require_relative 'config/environment'
orders = CustomerOrder.where(status: [ :accepted, :in_transit ])
puts "ZOMBIE ORDERS: #{orders.count}"
orders.each do |o|
  puts "Order #{o.id}: Status #{o.status}, Truck: #{o.truck_id}, Client: #{o.client_name}"
end
