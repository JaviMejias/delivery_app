# frozen_string_literal: true

company = Company.find_or_create_by!(rut: "77.123.456-7") do |c|
  c.name = "Mi Empresa Principal"
  c.active = true
end

admin = User.find_or_create_by!(email: "admin@stockflow.cl") do |user|
  user.first_name = "Admin"
  user.last_name = "StockFlow"
  user.password = "password123"
  user.password_confirmation = "password123"
  user.role = :admin
  user.active = true
  user.super_admin = true
  user.current_company_id = company.id
end

CompanyMembership.find_or_create_by!(user: admin, company: company) do |membership|
  membership.role = "admin"
end

puts "✅ Default company created: #{company.name}"
puts "✅ Super Admin user created: #{admin.email} (password: password123)"
