require 'find'

# The prefixes Tailwind uses for colors
prefixes = %w[
  bg text border ring shadow from to via decoration fill stroke accent caret outline ring-offset
]
regex = /\b(#{prefixes.join('|')})-indigo-(\d{2,3}(?:\/(?:\d+|\[.*?\]))?)\b/

count = 0

Find.find('app/frontend') do |path|
  next if FileTest.directory?(path)
  next unless path.end_with?('.tsx', '.ts')

  content = File.read(path)
  if content.match?(regex)
    new_content = content.gsub(regex, '\1-primary-\2')
    File.write(path, new_content)
    count += 1
  end
end

puts "Replaced indigo with primary in #{count} files."
