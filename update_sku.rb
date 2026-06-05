Product.where(sku: [nil, ""]).find_each do |p|
  next unless p.material && p.brand
  mat_prefix = p.material.name[0..2].upcase
  bra_prefix = p.brand.name[0..2].upcase
  p.update!(sku: "#{mat_prefix}#{p.material.measure}-#{bra_prefix}")
end
puts "✅ Updated missing SKUs!"
