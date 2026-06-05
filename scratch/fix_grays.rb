def process_file(path)
  return unless File.exist?(path)
  content = File.read(path)
  
  # Replace gray backgrounds with theme variables
  content = content.gsub('bg-black/20', 'bg-[var(--sf-surface-hover)]')
  content = content.gsub('bg-black/60', 'bg-[var(--sf-surface)]')
  content = content.gsub('bg-[var(--sf-surface-hover)] hover:bg-[var(--sf-surface)]', 'bg-[var(--sf-surface)] hover:bg-[var(--sf-surface-hover)]')
  
  # Check for any rogue text-white inside inputs or wrappers
  # Input placeholder texts could use placeholder-[var(--sf-text-muted)]
  content = content.gsub('placeholder-gray-500', 'placeholder-[var(--sf-text-muted)]')

  File.write(path, content)
end

process_file('app/frontend/pages/Trucks/Map.tsx')
process_file('app/frontend/components/Radar/RadarActiveDispatch.tsx')
