def process_file(path)
  content = File.read(path)

  # Safe replacements (mostly sidebar and forms)
  # But we must NOT replace text-white inside buttons that are indigo or rose
  # Actually, let's just replace all occurrences of `text-white` with `text-[var(--sf-text-main)]`
  # Then we revert the ones inside colored buttons/icons.
  
  content = content.gsub('bg-black/30', 'bg-[var(--sf-surface)]')
  content = content.gsub('bg-black/40', 'bg-[var(--sf-surface)]')
  content = content.gsub('bg-slate-900/80 backdrop-blur', 'glass-panel')
  content = content.gsub('bg-slate-900/90 backdrop-blur-md', 'glass-panel')
  content = content.gsub('bg-slate-900', 'bg-[var(--sf-surface)]')
  content = content.gsub('border-white/10', 'border-[var(--sf-border)]')
  content = content.gsub('border-white/20', 'border-[var(--sf-border)]')
  content = content.gsub('border-white/5', 'border-[var(--sf-border)]')
  
  content = content.gsub('text-white', 'text-[var(--sf-text-main)]')
  
  # Revert text-white for specific colored backgrounds
  content = content.gsub('bg-rose-500 border-2 border-white shadow-lg text-[var(--sf-text-main)]', 'bg-rose-500 border-2 border-white shadow-lg text-white')
  content = content.gsub('bg-indigo-600 hover:bg-indigo-500 text-[var(--sf-text-main)]', 'bg-indigo-600 hover:bg-indigo-500 text-white')
  content = content.gsub('bg-emerald-600 hover:bg-emerald-500 text-[var(--sf-text-main)]', 'bg-emerald-600 hover:bg-emerald-500 text-white')
  content = content.gsub('bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/30 rounded-lg transition-all shrink-0 active:scale-95 text-[var(--sf-text-main)]', 'bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/30 rounded-lg transition-all shrink-0 active:scale-95 text-white')
  content = content.gsub('bg-indigo-500 text-[var(--sf-text-main)] border-indigo-400', 'bg-indigo-500 text-white border-indigo-400')
  content = content.gsub('${borderColor} text-[var(--sf-text-main)] ${shadowColor}', '${borderColor} text-white ${shadowColor}')
  content = content.gsub('bg-rose-600 hover:bg-rose-500 border border-rose-500/30 rounded-lg transition-all cursor-pointer shadow-lg shadow-rose-950/20 active:scale-95 shrink-0 text-[var(--sf-text-main)]', 'bg-rose-600 hover:bg-rose-500 border border-rose-500/30 rounded-lg transition-all cursor-pointer shadow-lg shadow-rose-950/20 active:scale-95 shrink-0 text-white')
  content = content.gsub('bg-[var(--sf-surface)] hover:bg-slate-700 text-[var(--sf-text-main)]', 'bg-[var(--sf-surface)] hover:bg-[var(--sf-surface-hover)] text-[var(--sf-text-main)]')
  
  File.write(path, content)
end

process_file('app/frontend/pages/Trucks/Map.tsx')
process_file('app/frontend/components/Radar/RadarActiveDispatch.tsx')
