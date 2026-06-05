import { Link } from '@inertiajs/react'

export interface PagyProps {
  page: number
  pages: number
  count: number
  prev: number | null
  next: number | null
  series: (number | string)[]
}

export default function Pagination({ pagination, currentSearch = "" }: { pagination: PagyProps, currentSearch?: string }) {
  if (pagination.pages <= 1) return null

  const searchParam = currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : ''

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[var(--sf-surface)] border-t border-[var(--sf-border)] sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        {pagination.prev ? (
          <Link href={`?page=${pagination.prev}${searchParam}`} className="relative inline-flex items-center rounded-md border border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 py-2 text-sm font-medium text-[var(--sf-text-main)] hover:bg-[var(--sf-border)]">Anterior</Link>
        ) : (
          <span className="relative inline-flex items-center rounded-md border border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 py-2 text-sm font-medium text-[var(--sf-text-muted)] opacity-50 cursor-not-allowed">Anterior</span>
        )}
        {pagination.next ? (
          <Link href={`?page=${pagination.next}${searchParam}`} className="relative ml-3 inline-flex items-center rounded-md border border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 py-2 text-sm font-medium text-[var(--sf-text-main)] hover:bg-[var(--sf-border)]">Siguiente</Link>
        ) : (
          <span className="relative ml-3 inline-flex items-center rounded-md border border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 py-2 text-sm font-medium text-[var(--sf-text-muted)] opacity-50 cursor-not-allowed">Siguiente</span>
        )}
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[var(--sf-text-muted)]">
            Mostrando un total de <span className="font-medium text-[var(--sf-text-main)]">{pagination.count}</span> resultados
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {pagination.prev ? (
              <Link
                href={`?page=${pagination.prev}${searchParam}`}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-[var(--sf-text-muted)] ring-1 ring-inset ring-[var(--sf-border)] hover:bg-[var(--sf-border)] focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </Link>
            ) : (
              <span className="relative inline-flex items-center rounded-l-md px-2 py-2 text-[var(--sf-text-muted)] opacity-50 cursor-not-allowed ring-1 ring-inset ring-[var(--sf-border)]">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </span>
            )}
            {pagination.series.map((pageItem, index) => {
              if (pageItem === 'gap') {
                return (
                  <span key={index} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-[var(--sf-text-muted)] ring-1 ring-inset ring-[var(--sf-border)] focus:outline-offset-0">...</span>
                )
              }
              const isCurrent = typeof pageItem === 'string'
              const pageNumber = isCurrent ? parseInt(pageItem) : pageItem

              return (
                <Link
                  key={index}
                  href={`?page=${pageNumber}${searchParam}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`
                    relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ring-1 ring-inset ring-[var(--sf-border)]
                    ${isCurrent
                      ? 'z-10 bg-primary-500/20 text-primary-400 border border-primary-500/50'
                      : 'text-[var(--sf-text-main)] hover:bg-[var(--sf-border)]'}
                  `}
                >
                  {pageNumber}
                </Link>
              )
            })}

            {pagination.next ? (
              <Link
                href={`?page=${pagination.next}${searchParam}`}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-[var(--sf-text-muted)] ring-1 ring-inset ring-[var(--sf-border)] hover:bg-[var(--sf-border)] focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </Link>
            ) : (
              <span className="relative inline-flex items-center rounded-r-md px-2 py-2 text-[var(--sf-text-muted)] opacity-50 cursor-not-allowed ring-1 ring-inset ring-[var(--sf-border)]">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </nav>
        </div>
      </div>
    </div>
  )
}
