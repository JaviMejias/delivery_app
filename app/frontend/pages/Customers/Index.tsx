import React, { useState } from 'react'
import { Head, Link, useForm, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import { Users, ShieldAlert, CheckCircle, Search, Mail, Phone, MapPin, Filter } from 'lucide-react'
import Swal from 'sweetalert2'

export default function CustomersIndex({ customers, pagination, currentSearch, currentStatus }: any) {
  const { put, processing } = useForm()
  const [search, setSearch] = useState(currentSearch || '')
  const [status, setStatus] = useState(currentStatus || 'all')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.get('/customers', { search, status }, { preserveState: true })
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    router.get('/customers', { search, status: newStatus }, { preserveState: true })
  }

  const handleUnblock = (id: number) => {
    Swal.fire({
      title: '¿Desbloquear cliente?',
      text: '¿Estás seguro de que deseas perdonar a este cliente? Su contador de cancelaciones volverá a 0 y podrá hacer pedidos nuevamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, desbloquear',
      cancelButtonText: 'Cancelar',
      background: 'var(--sf-bg)',
      color: 'var(--sf-text-main)',
      customClass: {
        popup: 'border border-[var(--sf-border)] rounded-2xl shadow-2xl',
        confirmButton: 'rounded-xl px-4 py-2 font-bold',
        cancelButton: 'rounded-xl px-4 py-2 font-bold'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        put(`/customers/${id}/unblock`)
      }
    })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Clientes" />

      <div className="space-y-6">
        <PageHeader 
          icon={<Users className="w-8 h-8 opacity-80" />}
          title="Directorio de Clientes"
          description="Visualiza todos los clientes registrados y gestiona bloqueos."
          color="indigo"
        />

        {/* Filters */}
        <div className="bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearch} className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-[var(--sf-text-muted)]" />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono o correo..."
              className="block w-full pl-10 pr-3 py-2.5 border border-[var(--sf-border)] rounded-xl leading-5 bg-[var(--sf-bg)] text-[var(--sf-text-main)] placeholder-[var(--sf-text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 sm:text-sm transition-all"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-hide pb-2 sm:pb-0">
            <div className="flex items-center gap-2 bg-[var(--sf-bg)] p-1 rounded-xl border border-[var(--sf-border)] shrink-0">
              <button
                onClick={() => handleStatusChange('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'all' ? 'bg-[var(--sf-surface)] text-[var(--sf-text-main)] shadow-sm' : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]'}`}
              >
                Todos
              </button>
              <button
                onClick={() => handleStatusChange('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'active' ? 'bg-[var(--sf-surface)] text-emerald-500 shadow-sm' : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]'}`}
              >
                Activos
              </button>
              <button
                onClick={() => handleStatusChange('blocked')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'blocked' ? 'bg-[var(--sf-surface)] text-rose-500 shadow-sm' : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]'}`}
              >
                Bloqueados
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--sf-bg)] text-[var(--sf-text-muted)] text-xs uppercase font-bold border-b border-[var(--sf-border)]">
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-center">Cancelaciones</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sf-border)] text-[var(--sf-text-main)]">
                {customers.map((customer: any) => (
                  <tr key={customer.id} className="hover:bg-[var(--sf-bg)]/50 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-lg border border-indigo-500/20">
                          {customer.first_name?.[0]}{customer.last_name?.[0]}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--sf-text-main)]">{customer.first_name} {customer.last_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--sf-text-muted)] text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" /> {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" /> {customer.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {customer.blocked ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-500 text-xs font-bold rounded-full border border-rose-500/20">
                          <ShieldAlert className="w-3.5 h-3.5" /> Bloqueado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full border border-emerald-500/20">
                          <CheckCircle className="w-3.5 h-3.5" /> Activo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-bold">
                      {customer.cancellations_count} <span className="text-xs font-normal text-[var(--sf-text-muted)]">/ 24h</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {customer.blocked && (
                        <button
                          onClick={() => handleUnblock(customer.id)}
                          disabled={processing}
                          className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
                        >
                          Desbloquear
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="w-12 h-12 mb-4 opacity-20" />
                        <p>No se encontraron clientes.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-[var(--sf-border)] flex justify-center">
            <Pagination pagination={pagination} />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
