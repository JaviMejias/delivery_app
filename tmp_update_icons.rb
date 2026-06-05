require 'fileutils'

emoji_to_icon = {
  "✨" => "Sparkles",
  "🛍️" => "ShoppingBag",
  "📁" => "Folder",
  "📦" => "Package",
  "🏭" => "Factory",
  "🏷️" => "Tag",
  "📋" => "ClipboardList",
  "📄" => "FileText",
  "🔒" => "Lock",
  "🏪" => "Store",
  "🏢" => "Building2",
  "🔄" => "ArrowRightLeft",
  "🧑‍✈️" => "UserCircle",
  "🚛" => "Truck"
}

Dir.glob('app/frontend/pages/**/*.tsx').each do |file|
  content = File.read(file)

  icons_to_import = []

  emoji_to_icon.each do |emoji, icon|
    if content.include?(%(icon="#{emoji}"))
      content.gsub!(%(icon="#{emoji}"), %(icon={<#{icon} className="w-8 h-8 opacity-80" />}))
      icons_to_import << icon
    end
  end

  if icons_to_import.any?
    import_stmt = "import { #{icons_to_import.uniq.join(', ')} } from 'lucide-react'\n"
    imports_end = content.rindex(/^import.*$/)
    if imports_end
      line_end = content.index("\n", imports_end)
      content.insert(line_end + 1, import_stmt)
    else
      content.insert(0, import_stmt)
    end
    File.write(file, content)
  end
end

puts "Icons updated!"
