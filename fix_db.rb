Material.where("name LIKE ?", "Cilindro %").find_each do |m|
  m.update!(name: "Cilindro")
end

Product.find_each do |p|
  next unless p.material && p.brand
  mat = p.material
  bra = p.brand
  
  measure_val = (mat.measure.to_i == mat.measure) ? mat.measure.to_i : mat.measure
  
  measure_part = mat.measure.present? ? " #{measure_val}" : ""
  unit_part = (mat.unit.present? && mat.unit != 'UN') ? " #{mat.unit}" : ""
  
  new_name = "#{mat.name}#{measure_part}#{unit_part} #{bra.name}"
  
  mat_prefix = mat.name[0..2].upcase
  bra_prefix = bra.name[0..2].upcase
  measure_sku = mat.measure.present? ? "-#{measure_val}" : ""
  
  new_sku = "#{mat_prefix}#{measure_sku}-#{bra_prefix}"
  
  p.update!(name: new_name, sku: new_sku)
end
puts "✅ DB records fixed!"
