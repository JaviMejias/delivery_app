files_to_fix = {
  'app/frontend/pages/Inventory/Adjustments/New.tsx' => ['emerald'],
  'app/frontend/pages/Purchases/Orders/Index.tsx' => ['emerald', 'indigo', 'green'], # usually New button is emerald or indigo
  'app/frontend/pages/Sales/Local/Index.tsx' => ['emerald'],
  'app/frontend/pages/Sales/Local/POS.tsx' => ['emerald'],
  'app/frontend/pages/Sales/Local/Closures/Index.tsx' => ['emerald', 'indigo'],
  'app/frontend/pages/Sales/Settlements/Show.tsx' => ['emerald']
}

files_to_fix.each do |path, colors|
  next unless File.exist?(path)
  content = File.read(path)
  
  colors.each do |color|
    # Only replace action button color variations
    content = content.gsub("bg-#{color}-500", "bg-primary-500")
    content = content.gsub("bg-#{color}-600", "bg-primary-600")
    content = content.gsub("hover:bg-#{color}-400", "hover:bg-primary-400")
    content = content.gsub("hover:bg-#{color}-500", "hover:bg-primary-500")
    content = content.gsub("hover:bg-#{color}-600", "hover:bg-primary-600")
    content = content.gsub("text-#{color}-500", "text-primary-500")
    content = content.gsub("text-#{color}-600", "text-primary-600")
    content = content.gsub("ring-#{color}-500", "ring-primary-500")
    content = content.gsub("border-#{color}-500", "border-primary-500")
    content = content.gsub("shadow-#{color}-500", "shadow-primary-500")
    content = content.gsub("shadow-#{color}-500/20", "shadow-primary-500/20")
    content = content.gsub("shadow-#{color}-500/50", "shadow-primary-500/50")
  end

  File.write(path, content)
end

puts "Buttons recolored!"
