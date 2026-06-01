import { useState, useEffect, useRef } from 'react'
import { router } from '@inertiajs/react'
import { Search } from 'lucide-react'

export default function SearchBar({ placeholder = "Buscar...", currentSearch = "" }) {
  const [search, setSearch] = useState(currentSearch || "")
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const timer = setTimeout(() => {
      const url = new URL(window.location.href)
      if (search) {
        url.searchParams.set('search', search)
      } else {
        url.searchParams.delete('search')
      }
      
      router.get(
        url.pathname + url.search,
        {},
        { preserveState: true, preserveScroll: true, replace: true }
      )
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-[var(--sf-text-muted)]" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 border border-[var(--sf-border)] rounded-xl leading-5 bg-[var(--sf-bg)] text-[var(--sf-text-main)] placeholder-[var(--sf-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--sf-primary)] focus:border-[var(--sf-primary)] sm:text-sm transition-colors"
        placeholder={placeholder}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
    </div>
  )
}
