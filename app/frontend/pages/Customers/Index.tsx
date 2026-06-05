import React, { useState } from 'react'
import { Head, Link, useForm, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import { TableFilters } from '@/components/TableFilters'
import Pagination from '@/components/Pagination'
import { Users, ShieldAlert, CheckCircle, Search, Mail, Phone, MapPin, Filter, Unlock } from 'lucide-react'
import { confirmDelete } from '@/utils/alerts'

export default function CustomersIndex({ customers, pagination, currentSearch, currentStatus }: any) {
  const { put, processing } = useForm()
  const [search, setSearch] = useState(currentSearch || '')
  const [status, setStatus] = useState(currentStatus || 'all')

  const [isFiltering, setIsFiltering] = useState(false)

  const applyFilters = () => {
    router.get('/customers', { search, status }, { 
      preserveState: true,
      onStart: () => setIsFiltering(true),
      onFinish: () => setIsFiltering(false)
    })
  }

  const handleUnblock = (id: number) => {
    confirmDelete({
      title: '¿Desbloquear cliente?',
      text: '¿Estás seguro de que deseas perdonar a este cliente? Su contador de cancelaciones volverá a 0 y podrá hacer pedidos nuevamente.',
      confirmButtonText: 'Sí, desbloquear',
      onConfirm: () => put(`/customers/${id}/unblock`)
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

        <TableFilters onApply={applyFilters} isLoading={isFiltering}>
          <TableFilters.Search
            value={search}
            onChange={setSearch}
            onSearch={applyFilters}
            placeholder="Buscar por nombre, teléfono o correo..."
            className="w-full sm:w-96"
          />
          <TableFilters.Select
            label="Estado"
            value={status}
            onChange={setStatus}
            options={[
              { label: 'Todos', value: 'all' },
              { label: 'Activos', value: 'active' },
              { label: 'Bloqueados', value: 'blocked' }
            ]}
          />
        </TableFilters>

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
                        <div className="w-10 h-10 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold text-lg border border-primary-500/20">
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
                          className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center justify-center"
                          title="Desbloquear"
                        >
                          <Unlock size={18} />
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
