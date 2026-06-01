require_relative 'config/environment'
orders = CustomerOrder.where(status: [:accepted, :in_transit]).where.not(truck_id: nil)

puts "Limpiando #{orders.count} ordenes fantasma..."

orders.each do |o|
  truck = o.truck
  # Si el camión no tiene destino pero la orden está aceptada, es un zombie de la simulación anterior.
  if truck.destination_latitude.blank?
    puts "Orden #{o.id} de #{o.client_name} es un zombie. Marcando como completado."
    o.update!(status: :completed)
  end
end
