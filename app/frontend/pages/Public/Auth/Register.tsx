import React, { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { User, Lock, Mail, ArrowLeft } from 'lucide-react'
import Swal from 'sweetalert2'
import PhoneInput from '@/components/PhoneInput'

export default function Register({ company }: { company: { id: number, slug: string, name: string } }) {
  const { data, setData, processing, errors } = useForm({
    customer: {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      password: '',
      password_confirmation: ''
    }
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = (document.querySelector('meta[name="csrf-token"]') as any)?.content || ''
      const res = await fetch(`/order/${company.slug}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify({ public_order_customer: data.customer })
      })
      const result = await res.json()
      
      if (result.success) {
        window.location.href = `/order/${company.slug}`
      } else if (result.errors) {
        Swal.fire({
          icon: 'error',
          title: 'Error de Registro',
          text: result.errors.join(', '),
          background: '#0f172a',
          color: 'white'
        })
      }
    } catch (e) {
      alert("Error de conexión")
    }
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden text-slate-200">
      <Head title={`Registro - ${company.name}`} />
      
      <div className="w-full max-w-md z-10">
        <Link href={`/order/${company.slug}/auth/login`} className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Volver al Inicio de Sesión
        </Link>
        
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-1">Nueva Cuenta ✨</h2>
          <p className="text-sm text-slate-400 mb-6">Guarda tus datos para pedir más rápido en {company.name}</p>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                  <input
                    type="text" required
                    value={data.customer.first_name}
                    onChange={e => setData('customer', { ...data.customer, first_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Apellido</label>
                <input
                  type="text" required
                  value={data.customer.last_name}
                  onChange={e => setData('customer', { ...data.customer, last_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Teléfono (Celular)</label>
              <div className="relative">
                <PhoneInput
                  value={data.customer.phone}
                  onValueChange={(val) => setData('customer', { ...data.customer, phone: val })}
                  className="!w-full !bg-slate-950 !border-slate-800 !rounded-xl !py-2.5 !text-sm !text-white focus:!ring-1 focus:!ring-indigo-500 !transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Correo (Opcional)</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                <input
                  type="email"
                  value={data.customer.email}
                  onChange={e => setData('customer', { ...data.customer, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                  <input
                    type="password" required minLength={6}
                    value={data.customer.password}
                    onChange={e => setData('customer', { ...data.customer, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Repetir Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                  <input
                    type="password" required minLength={6}
                    value={data.customer.password_confirmation}
                    onChange={e => setData('customer', { ...data.customer, password_confirmation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors active:scale-[0.98] mt-6 flex items-center justify-center gap-2"
            >
              {processing ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
