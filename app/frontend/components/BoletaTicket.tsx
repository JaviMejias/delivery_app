import React from 'react'
import { usePage } from '@inertiajs/react'

interface BoletaTicketProps {
  sale: any
  paperSize: '58mm' | '80mm'
  printMode?: 'client' | 'store' | 'both'
}

export default function BoletaTicket({ sale, paperSize, printMode = 'both' }: BoletaTicketProps) {
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

  const copiesArray = printMode === 'both' 
    ? [{ key: 'client', label: 'COPIA CLIENTE' }, { key: 'store', label: 'COPIA COMERCIO' }]
    : printMode === 'client' 
      ? [{ key: 'client', label: 'COPIA CLIENTE' }]
      : [{ key: 'store', label: 'COPIA COMERCIO' }];

  return (
    <div className="flex flex-col items-center w-full print:block print:absolute print:left-0 print:top-0 print:w-full print:m-0 print:p-0" id="printable-ticket-container">
      <style>
        {`
          @media print {
            @page {
              margin: 0;
            }
            body, html {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              overflow: hidden !important;
            }
            body * {
              visibility: hidden;
            }
            dialog.native-modal {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              transform: none !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              background: transparent !important;
              box-shadow: none !important;
              overflow: visible !important;
              visibility: visible !important;
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
            }
            dialog.native-modal * {
              overflow: visible !important;
              max-height: none !important;
            }
            #printable-ticket-container, #printable-ticket-container * {
              visibility: visible !important;
              color: #000000 !important;
              background: transparent !important;
              text-shadow: none !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .ticket-page {
              page-break-after: always;
            }
            .ticket-page:last-child {
              page-break-after: auto;
            }
            .ticket-page * {
              font-size: 11px !important;
              line-height: 1.2 !important;
              -webkit-font-smoothing: none !important;
              font-weight: 700 !important;
              color: black !important;
            }
            .ticket-page h2 {
              font-size: 14px !important;
            }
            .ticket-page table {
              width: 100% !important;
              table-layout: auto !important;
            }
            .cut-line {
              display: none;
            }
          }
          
          @media print {
            .cut-line {
              display: block !important;
              text-align: center;
              font-family: monospace;
              color: #000;
              margin: 10mm 0 !important;
              font-size: 12px !important;
              visibility: visible !important;
            }
          }
        `}
      </style>
      
      {copiesArray.map((copy) => (
      <React.Fragment key={copy.key}>
        <div 
          className={`ticket-page bg-white text-black p-4 print:p-0 font-mono text-sm leading-tight border border-gray-300 print:border-none shadow-sm print:shadow-none mx-auto print:mx-0 mb-6 print:mb-0 ${paperSize === '80mm' ? 'w-[300px]' : 'w-[220px]'} print:w-full print:max-w-full`}
          style={{ fontFamily: "'Courier New', Courier, monospace" }}
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
                    <td className="py-1 align-top pr-1">
                      {item.product?.name?.substring(0, paperSize === '58mm' ? 12 : 20)}
                      {item.voucher_code && (
                        <div className="text-[10px] opacity-80">* Vale: {item.voucher_code}</div>
                      )}
                    </td>
                    <td className="py-1 align-top text-right">{formatMoney(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-black border-dashed mt-2 pt-2">
            {parseFloat(sale.card_surcharge || '0') > 0 && (
              <div className="flex justify-between text-xs mb-1">
                <span>Recargo Tarjeta:</span>
                <span>{formatMoney(sale.card_surcharge)}</span>
              </div>
            )}
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
            <p className="font-bold mb-2">{copy.label}</p>
            <p>¡Gracias por su preferencia!</p>
            <p className="mt-1 opacity-70 print:opacity-100">{app_name}</p>
          </div>
        </div>
        
        {/* Tear line for manual cutting, visible only in print mode between tickets */}
        {copiesArray.length > 1 && copy.key !== copiesArray[copiesArray.length - 1].key && (
          <div className="cut-line">
            - - - ✂ - - -
          </div>
        )}
      </React.Fragment>
      ))}
      
      {/* Feed paper space for tearing without cutting text */}
      <div className="hidden print:block text-white select-none pt-4">
        .<br/>.<br/>.
      </div>
    </div>
  )
}
