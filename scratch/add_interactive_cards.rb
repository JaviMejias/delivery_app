files = Dir.glob('app/frontend/pages/**/*.tsx')

files.each do |path|
  content = File.read(path)
  
  # Only add interactive-card to glass-panels that are standard cards (e.g., they have rounded-2xl, p-6, etc.)
  # And skip if already present
  next if content.include?('interactive-card')
  
  new_content = content.gsub(/className="glass-panel rounded-([a-z0-9]+) p-([0-9]+) ([^"]*)"/) do |match|
    # Make sure we don't accidentally add it twice
    if match.include?('interactive-card')
      match
    else
      match.sub('glass-panel', 'glass-panel interactive-card')
    end
  end
  
  # Specific for lg:col-span-2 glass-panel ...
  new_content = new_content.gsub(/className="([^"]*)glass-panel([^"]*)"/) do |match|
    if match.include?('rounded-2xl') && !match.include?('interactive-card') && !match.include?('fixed') && !match.include?('absolute') && !match.include?('mt-2 w-48') # exclude dropdowns and modals
      match.sub('glass-panel', 'glass-panel interactive-card')
    else
      match
    end
  end
  
  # Also target smaller cards like the ones in the catalog grid
  # className="flex flex-col text-left p-4 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-bg)] hover:bg-[var(--sf-surface)] hover:border-primary-500/50 transition-all group"
  new_content = new_content.gsub(/hover:border-primary-500\/50 transition-all group"/) do |match|
    match.sub('transition-all group"', 'transition-all group interactive-card"')
  end

  File.write(path, new_content) if new_content != content
end

puts "Interactive cards injected!"
