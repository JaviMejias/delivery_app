def process_file(path)
  content = File.read(path)

  # Replace tileLayer logic
  old_use_effect = <<-EOF
    loadLeaflet()
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
EOF
  new_use_effect = <<-EOF
    loadLeaflet()

    const observer = new MutationObserver(() => {
      const isLight = document.documentElement.classList.contains('theme-light')
      if (tileLayerRef.current) {
        const newUrl = isLight 
          ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        tileLayerRef.current.setUrl(newUrl)
      }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => {
      observer.disconnect()
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
EOF
  content = content.gsub(old_use_effect, new_use_effect)

  old_init_map = <<-EOF
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 20
    }).addTo(mapRef.current)
EOF
  new_init_map = <<-EOF
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current)
    
    const isLight = document.documentElement.classList.contains('theme-light')
    const tileUrl = isLight 
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 20
    }).addTo(mapRef.current)
EOF
  content = content.gsub(old_init_map, new_init_map)

  # Add tileLayerRef
  content = content.gsub('const mapRef = useRef<any>(null)', "const mapRef = useRef<any>(null)\n  const tileLayerRef = useRef<any>(null)")

  # Fix hardcoded dark colors
  content = content.gsub('bg-slate-950', 'bg-[var(--sf-bg)]')
  content = content.gsub('bg-slate-950/95', 'glass-panel')
  content = content.gsub('bg-gradient-to-br from-indigo-900/95 to-slate-900/95', 'bg-gradient-to-br from-indigo-600/95 to-purple-600/95 shadow-xl')
  content = content.gsub('bg-[var(--sf-bg)]/95', 'glass-panel') # fallback

  content = content.gsub('text-white', 'text-[var(--sf-text-main)]')
  content = content.gsub('text-slate-300', 'text-[var(--sf-text-muted)]')
  content = content.gsub('text-slate-400', 'text-[var(--sf-text-muted)]')
  content = content.gsub('border-white/10', 'border-[var(--sf-border)]')
  content = content.gsub('border-slate-700', 'border-[var(--sf-border)]')
  content = content.gsub('bg-slate-800', 'bg-[var(--sf-surface)]')
  content = content.gsub('hover:bg-slate-700', 'hover:bg-[var(--sf-surface-hover)]')
  content = content.gsub('bg-slate-900', 'bg-[var(--sf-surface)]')
  
  # Revert specific texts that need to be white
  content = content.gsub('text-[var(--sf-text-main)] font-black text-xs uppercase tracking-wider', 'text-white font-black text-xs uppercase tracking-wider')
  content = content.gsub('text-[var(--sf-text-main)] text-[10px] font-bold bg-white/10 px-2 py-1 rounded', 'text-white text-[10px] font-bold bg-white/10 px-2 py-1 rounded')
  content = content.gsub('text-[var(--sf-text-main)] hover:bg-[var(--sf-border)] transition-colors', 'text-white hover:bg-[var(--sf-border)] transition-colors')
  content = content.gsub('fill="none" stroke="text-[var(--sf-text-main)]"', 'fill="none" stroke="white"')
  content = content.gsub('border-text-[var(--sf-text-main)]', 'border-white')
  content = content.gsub('bg-indigo-600/90 text-[var(--sf-text-main)]', 'bg-indigo-600/90 text-white')

  File.write(path, content)
end

process_file('app/frontend/pages/Driver/Radar.tsx')
