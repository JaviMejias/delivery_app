import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import '../entrypoints/application.css'

const pages = import.meta.glob('../pages/**/*.tsx', { eager: true }) as Record<string, any>

const el = document.getElementById('app')
let initialPage = null
if (el && el.dataset.page) {
  initialPage = JSON.parse(el.dataset.page)
}

createInertiaApp({
  page: initialPage,
  title: (title) => title ? `${title} - StockFlow` : 'StockFlow',
  resolve: (name) => {
      const page = pages[`../pages/${name}.tsx`]
      if (!page) {
        throw new Error(`Page not found: ${name}. Available pages: ${Object.keys(pages).join(', ')}`)
      }
      return page
    },
    setup({ el, App, props }) {
      createRoot(el).render(<App {...props} />)
    },
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
  })
}
