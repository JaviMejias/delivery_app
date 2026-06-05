import React from 'react'
import { Pencil, Globe, Copy } from 'lucide-react'
import Table from '@/components/Table'
import Pagination from '@/components/Pagination'
import { formatPhone } from '@/utils/formatters'
import Card from '@/components/Card'
import { Company } from './types'

interface CompanyTableProps {
  companies: Company[]
  pagination: any
  editingCompany: Company | null
  onEdit: (company: Company) => void
}

export default function CompanyTable({ companies, pagination, editingCompany, onEdit }: CompanyTableProps) {
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Empresa</Table.Th>
              <Table.Th>Contacto</Table.Th>
              <Table.Th>Portal Cliente</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th className="text-right">Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {companies.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                  No hay empresas registradas.
                </Table.Td>
              </Table.Tr>
            ) : (
              companies.map((c) => (
                <Table.Tr key={c.id} className={editingCompany?.id === c.id ? 'bg-primary-500/5' : ''}>
                  <Table.Td>
                    <div className="flex items-center gap-3">
                      {c.logo_url && (
                        <img src={c.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white/5 border border-white/10" />
                      )}
                      <div>
                        <div className="font-medium text-[var(--sf-text-main)]">{c.name}</div>
                        {c.rut && <div className="text-xs text-[var(--sf-text-muted)] mt-0.5">RUT: {c.rut}</div>}
                      </div>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <div className="text-sm">{c.email || <span className="opacity-50">Sin email</span>}</div>
                    <div className="text-xs text-[var(--sf-text-muted)] mt-0.5">{c.phone ? formatPhone(c.phone) : <span className="opacity-50">Sin teléfono</span>}</div>
                  </Table.Td>
                  <Table.Td>
                    {c.enable_public_orders && c.slug ? (
                      <div className="flex items-center gap-1.5">
                        <a 
                          href={`/order/${c.slug}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold shadow-sm shadow-primary-500/20 transition-all active:scale-95"
                          title="Abrir portal"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Portal
                        </a>
                        <button 
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/order/${c.slug}`)}
                          className="p-1.5 text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg transition-colors border border-transparent hover:border-primary-500/20"
                          title="Copiar enlace"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--sf-text-muted)] opacity-70 italic">
                        Inactivo
                      </span>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      c.active 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {c.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </Table.Td>
                  <Table.Td className="text-right">
                    <div className="flex items-center justify-end">
                      <button onClick={() => onEdit(c)} className="p-2 text-[var(--sf-text-muted)] hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors" title="Editar">
                        <Pencil size={18} />
                      </button>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </div>
      <div className="p-4 border-t border-[var(--sf-border)] bg-[var(--sf-surface)]">
        <Pagination pagination={pagination} />
      </div>
    </Card>
  )
}
