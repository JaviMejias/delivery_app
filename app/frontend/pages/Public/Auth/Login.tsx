import React, { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { User, Lock, ArrowLeft } from 'lucide-react'
import { CustomSwitch } from '@/components/CustomSwitch'

export default function Login({ company }: { company: { id: number, slug: string, name: string } }) {
  const { data, setData, post, processing, errors } = useForm({
    public_order_customer: {
      login: '',
      password: '',
      remember_me: '1'
    }
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post(`/order/${company.slug}/auth/login`)
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden text-slate-200">
      <Head title={`Iniciar Sesión - ${company.name}`} />
      
      <div className="w-full max-w-sm z-10">
        <Link href={`/order/${company.slug}`} className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Volver a {company.name}
        </Link>
        
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-1">¡Hola de nuevo! 👋</h2>
          <p className="text-sm text-slate-400 mb-6">Inicia sesión con tu teléfono o correo</p>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Teléfono o Correo</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={data.public_order_customer.login}
                  onChange={e => setData('public_order_customer', { ...data.public_order_customer, login: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  placeholder="ej. 56912345678 o correo@ejemplo.com"
                />
              </div>
              {errors['public_order_customer.login'] && <span className="text-rose-400 text-xs font-semibold">{errors['public_order_customer.login']}</span>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={data.public_order_customer.password}
                  onChange={e => setData('public_order_customer', { ...data.public_order_customer, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  placeholder="Tu contraseña"
                />
              </div>
              {errors['public_order_customer.password'] && <span className="text-rose-400 text-xs font-semibold">{errors['public_order_customer.password']}</span>}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <CustomSwitch
                checked={data.public_order_customer.remember_me === '1'}
                onChange={(v) => setData('public_order_customer', { ...data.public_order_customer, remember_me: v ? '1' : '0' })}
              />
              <span className="text-sm text-slate-400 font-medium">Mantener mi sesión iniciada</span>
            </div>
            
            {errors.email && <span className="text-rose-400 text-xs font-semibold block">{errors.email}</span>}
            {errors.phone && <span className="text-rose-400 text-xs font-semibold block">{errors.phone}</span>}

            <button
              type="submit"
              disabled={processing}
              className="w-full py-3.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-colors active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
            >
              {processing ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            ¿No tienes cuenta? <Link href={`/order/${company.slug}/auth/register`} className="text-primary-400 hover:text-primary-300 font-bold transition-colors">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
