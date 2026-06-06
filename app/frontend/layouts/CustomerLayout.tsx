import React from 'react'
import { Link, usePage } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Store, ShoppingBag, MapPin, LogOut } from 'lucide-react'

interface CustomerLayoutProps {
  children: React.ReactNode
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const { auth, company } = usePage().props as any
  const currentPath = usePage().url.split('?')[0] // remove query params
  
  const navItems = [
    { name: 'Catálogo', icon: <Store className="w-6 h-6" />, href: `/order/${company.slug}` },
    { name: 'Pedidos', icon: <ShoppingBag className="w-6 h-6" />, href: `/order/${company.slug}/history` },
    { name: 'Direcciones', icon: <MapPin className="w-6 h-6" />, href: `/order/${company.slug}/addresses` }
  ]

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex flex-col relative overflow-x-hidden text-slate-200">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ 
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.2, 1],
            x: ['-10%', '10%', '-10%']
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 -left-1/4 w-[40rem] h-[40rem] bg-primary-500/10 rounded-full blur-[100px] mix-blend-screen" 
        />
        <motion.div 
          animate={{ 
            rotate: [360, 270, 180, 90, 0],
            scale: [1, 1.3, 1],
            x: ['10%', '-10%', '10%']
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 -right-1/4 w-[45rem] h-[45rem] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen" 
        />
      </div>

      <div className={`relative z-10 flex-1 flex flex-col ${auth?.public_customer ? 'pb-[80px]' : ''}`}>
        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.main
            key={currentPath}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      {auth?.public_customer && (
        <nav className="fixed bottom-0 inset-x-0 h-[72px] bg-slate-900/80 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-2 z-50 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          {navItems.map(item => {
            // Extra logic because /order/:slug matches both exactly and subpaths, so we need exact match for Catálogo
            const isActive = item.name === 'Catálogo' 
              ? currentPath === item.href 
              : currentPath.startsWith(item.href)

            return (
              <Link 
                key={item.name} 
                href={item.href} 
                className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors outline-none ${isActive ? 'text-primary-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <motion.div whileTap={{ scale: 0.85 }} className={`p-1.5 rounded-xl ${isActive ? 'bg-primary-500/10' : ''}`}>
                  {item.icon}
                </motion.div>
                <span className="text-[10px] font-bold tracking-wide">{item.name}</span>
                {isActive && (
                  <motion.div 
                    layoutId="bottomNavIndicator" 
                    className="absolute top-0 inset-x-4 h-0.5 rounded-b-full bg-gradient-to-r from-transparent via-primary-400 to-transparent shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                  />
                )}
              </Link>
            )
          })}
          <Link 
            href={`/order/${company.slug}/auth/logout`} 
            method="delete" 
            as="button" 
            className="relative flex flex-col items-center justify-center w-full h-full gap-1 text-slate-400 hover:text-rose-400 transition-colors outline-none"
          >
            <motion.div whileTap={{ scale: 0.85 }} className="p-1.5 rounded-xl hover:bg-rose-500/10">
              <LogOut className="w-6 h-6" />
            </motion.div>
            <span className="text-[10px] font-bold tracking-wide">Salir</span>
          </Link>
        </nav>
      )}
    </div>
  )
}
