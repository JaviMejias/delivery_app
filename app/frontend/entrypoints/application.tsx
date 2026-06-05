import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import '../entrypoints/application.css'

const pages = import.meta.glob('../pages/**/*.tsx', { eager: true }) as Record<string, any>

const el = document.getElementById('app')
let initialPage = null
if (el && el.dataset.page) {
  initialPage = JSON.parse(el.dataset.page)
}

const appName = document.querySelector('meta[name="application-name"]')?.getAttribute('content') || 'StockFlow'

createInertiaApp({
  page: initialPage,
  title: (title) => title ? `${title} - ${appName}` : appName,
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
    progress: {
      color: '#6366f1',
      showSpinner: true,
    },
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
  })
}
