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

puts "Creating Brands..."
gasco = Brand.find_or_create_by!(name: "Gasco", company_id: company.id) do |b|
  b.active = true
end
lipigas = Brand.find_or_create_by!(name: "Lipigas", company_id: company.id) do |b|
  b.active = true
end

puts "Creating Material Category..."
cilindro_cat = MaterialCategory.find_or_create_by!(name: "Cilindros", company_id: company.id)

puts "Creating Materials..."
mat_5 = Material.find_or_create_by!(name: "Cilindro", measure: 5, unit: "KG", material_category_id: cilindro_cat.id, company_id: company.id) do |m|
  m.active = true
end
mat_11 = Material.find_or_create_by!(name: "Cilindro", measure: 11, unit: "KG", material_category_id: cilindro_cat.id, company_id: company.id) do |m|
  m.active = true
end
mat_15 = Material.find_or_create_by!(name: "Cilindro", measure: 15, unit: "KG", material_category_id: cilindro_cat.id, company_id: company.id) do |m|
  m.active = true
end
mat_45 = Material.find_or_create_by!(name: "Cilindro", measure: 45, unit: "KG", material_category_id: cilindro_cat.id, company_id: company.id) do |m|
  m.active = true
end

puts "Creating Price Lists..."
pl_bodega = PriceList.find_or_create_by!(name: "Bodega la Islita", company_id: company.id) do |pl|
  pl.available_for_local = true
  pl.available_for_trucks = false
  pl.active = true
end

pl_camiones = PriceList.find_or_create_by!(name: "Camiones", company_id: company.id) do |pl|
  pl.available_for_local = false
  pl.available_for_trucks = true
  pl.active = true
end

puts "Creating Final Products..."
brands = [gasco, lipigas]
materials = [mat_5, mat_11, mat_15, mat_45]

brands.each do |brand|
  materials.each do |material|
    mat_prefix = material.name[0..2].upcase
    bra_prefix = brand.name[0..2].upcase
    sku = "#{mat_prefix}#{material.measure}-#{bra_prefix}"

    Product.find_or_create_by!(
      name: "#{brand.name} #{material.name}",
      brand_id: brand.id,
      material_id: material.id,
      company_id: company.id
    ) do |p|
      p.sku = sku
      p.accepts_vouchers = true
      p.active = true
      p.available_in_app = true
    end
  end
end

puts "✅ Demo Data created successfully!"
