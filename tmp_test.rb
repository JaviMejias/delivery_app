require_relative 'config/environment'
LocalSale.all.each do |s|
  rev = s.total_revenue
  sub = s.local_sale_items.sum(:subtotal)
  puts "Sale #{s.id}: Revenue #{rev}, Items Subtotal: #{sub}"
end
