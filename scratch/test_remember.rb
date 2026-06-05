require_relative 'config/environment'

user = User.first
customer = Customer.first

puts "User ID: #{user&.id}"
user.remember_me!
puts "User remember_created_at: #{user.remember_created_at}"

puts "Customer ID: #{customer&.id}"
customer.remember_me!
puts "Customer remember_created_at: #{customer.remember_created_at}"

# Verify cookie generation
puts "User cookie: #{Devise::Models::Rememberable.remember_cookie_values(user)}"
puts "Customer cookie: #{Devise::Models::Rememberable.remember_cookie_values(customer)}"
