import React from 'react'
import { usePage } from '@inertiajs/react'

interface BoletaTicketProps {
  sale: any
  paperSize: '58mm' | '80mm'
}

export default function BoletaTicket({ sale, paperSize }: BoletaTicketProps) {
  const { auth, app_name } = usePage<any>().props
  
  // Try to find the active company to show its details in the header
  const company = auth?.current_company || {
    name: 'EMPRESA',
    address: 'Dirección Comercial',
    rut: '12.345.678-9',
    business_activity: 'Comercio'
  }

  const formatMoney = (amount: string | number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(amount))
  }

  // Common wrapper width based on paper size
  const maxWidth = paperSize === '80mm' ? '300px' : '220px'

  return (
    <div className="flex flex-col items-center">
      <style>
        {`
          @media print {
            @page {
              margin: 0;
              size: ${paperSize} auto;
            }
            body * {
              visibility: hidden;
            }
            #printable-ticket, #printable-ticket * {
              visibility: visible;
              color: #000000 !important;
              background: #ffffff !important;
              text-shadow: none !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            #printable-ticket {
              position: absolute;
              left: 0;
              top: 0;
              width: ${paperSize};
              margin: 0;
              padding: 0;
              text-rendering: optimizeSpeed;
              -webkit-font-smoothing: none;
            }
          }
        `}
      </style>
      
      <div 
        id="printable-ticket" 
        className="bg-white text-black p-4 font-mono text-sm leading-tight border border-gray-300 shadow-sm mx-auto"
        style={{ width: maxWidth, fontFamily: "'Courier New', Courier, monospace" }}
      >
        <div className="text-center mb-4">
          <h2 className="font-bold text-lg uppercase leading-none">{company.name}</h2>
          <p className="text-xs uppercase mt-1">{company.address}</p>
          <p className="text-xs mt-1">RUT: {company.rut}</p>
          <p className="text-xs">Giro: {company.business_activity}</p>
        </div>

        <div className="border-b border-black border-dashed mb-2 pb-2">
          <p className="font-bold text-center">TICKET DE VENTA</p>
          <p className="text-xs text-center">N° VTA-{sale.id?.toString().padStart(4, '0')}</p>
        </div>

        <div className="text-xs mb-2">
          <p>Fecha: {new Date(sale.date || sale.created_at).toLocaleDateString('es-CL')} {new Date(sale.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
          <p>Bodega: {sale.warehouse?.name}</p>
          <p>Tipo: {sale.sale_type === 'wholesale' ? 'V. Mayorista' : 'V. Local'}</p>
        </div>

        <div className="border-t border-black border-dashed mt-2 pt-2 text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left font-normal pb-1">CANT</th>
                <th className="text-left font-normal pb-1">ARTICULO</th>
                <th className="text-right font-normal pb-1">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {sale.local_sale_items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-1 align-top">{item.quantity}</td>
                  <td className="py-1 align-top pr-1">{item.product?.name?.substring(0, paperSize === '58mm' ? 12 : 20)}</td>
                  <td className="py-1 align-top text-right">{formatMoney(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-black border-dashed mt-2 pt-2">
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL:</span>
            <span>{formatMoney(sale.total_revenue)}</span>
          </div>
        </div>

        <div className="border-t border-black border-dashed mt-2 pt-2 text-xs">
          <p className="text-center font-bold mb-1">PAGOS</p>
          {parseFloat(sale.cash_revenue) > 0 && (
            <div className="flex justify-between"><span>Efectivo:</span><span>{formatMoney(sale.cash_revenue)}</span></div>
          )}
          {parseFloat(sale.card_revenue) > 0 && (
            <div className="flex justify-between"><span>Tarjeta:</span><span>{formatMoney(sale.card_revenue)}</span></div>
          )}
          {parseFloat(sale.transfer_revenue) > 0 && (
            <div className="flex justify-between"><span>Transf:</span><span>{formatMoney(sale.transfer_revenue)}</span></div>
          )}
          {parseFloat(sale.voucher_revenue) > 0 && (
            <div className="flex justify-between"><span>Vales:</span><span>{formatMoney(sale.voucher_revenue)}</span></div>
          )}
        </div>

        <div className="border-t border-black border-dashed mt-4 pt-4 text-center text-xs pb-4">
          <p>¡Gracias por su preferencia!</p>
          <p className="mt-1 opacity-70">Sistema {app_name}</p>
        </div>
      </div>
    </div>
  )
}
