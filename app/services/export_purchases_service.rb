require "caxlsx"

class ExportPurchasesService
  def initialize(purchases, theme = 'indigo')
    @purchases = purchases
    @theme = theme
  end

  def theme_hex
    case @theme.to_s
    when 'red' then "EF4444"
    when 'blue' then "3B82F6"
    when 'amber' then "F59E0B"
    when 'orange' then "F97316"
    when 'emerald' then "10B981"
    when 'rose' then "F43F5E"
    when 'purple' then "A855F7"
    else "4F46E5" # indigo default
    end
  end

  def to_xlsx
    p = Axlsx::Package.new
    wb = p.workbook

    wb.styles do |s|
      borders = { style: :thin, color: "000000", edges: [ :top, :bottom, :left, :right ] }

      header_style = s.add_style bg_color: theme_hex, fg_color: "FFFFFF", b: true, alignment: { horizontal: :center, vertical: :center }, border: borders
      cell_style = s.add_style border: borders, alignment: { vertical: :center }
      currency_style = s.add_style border: borders, format_code: "$#,##0", alignment: { horizontal: :right, vertical: :center }
      date_style = s.add_style border: borders, format_code: "dd/mm/yyyy", alignment: { horizontal: :center, vertical: :center }

      total_label_style = s.add_style bg_color: "F3F4F6", b: true, alignment: { horizontal: :right, vertical: :center }, border: borders
      total_currency_style = s.add_style bg_color: "F3F4F6", b: true, border: borders, format_code: "$#,##0", alignment: { horizontal: :right, vertical: :center }
      total_number_style = s.add_style bg_color: "F3F4F6", b: true, border: borders, alignment: { horizontal: :right, vertical: :center }

      wb.add_worksheet(name: "Compras (Resumen)") do |sheet|
        sheet.add_row [ "Código", "Fecha", "Proveedor", "Estado", "Monto Neto", "IVA", "Total" ], style: header_style

        @purchases.each do |po|
          status_es = case po.status
                      when 'draft' then 'Borrador'
                      when 'confirmed' then 'Confirmada'
                      when 'received' then 'Recibida'
                      when 'cancelled' then 'Cancelada'
                      else po.status.capitalize
                      end

          neto = po.purchase_order_items.sum(&:subtotal).to_i
          iva = po.purchase_order_items.sum(&:tax_amount).to_i

          sheet.add_row [
            "OC-#{po.id.to_s.rjust(4, '0')}",
            po.created_at.to_date,
            po.supplier.name,
            status_es,
            neto,
            iva,
            po.total.to_i
          ], style: [ cell_style, date_style, cell_style, cell_style, currency_style, currency_style, currency_style ]
        end

        sheet.add_row [
          "", "", "", "TOTALES:",
          @purchases.sum { |po| po.purchase_order_items.sum(&:subtotal).to_i },
          @purchases.sum { |po| po.purchase_order_items.sum(&:tax_amount).to_i },
          @purchases.sum(&:total).to_i
        ], style: [ nil, nil, nil, total_label_style, total_currency_style, total_currency_style, total_currency_style ]

        sheet.column_widths 15, 15, 30, 20, 20, 20, 20
      end

      wb.add_worksheet(name: "Detalle de Ítems") do |sheet|
        sheet.add_row [ "Código Compra", "Fecha", "Proveedor", "SKU", "Producto", "Solicitados", "Recibidos", "Precio Neto Unit.", "Afecto a IVA", "Subtotal Neto", "IVA", "Total Línea" ], style: header_style

        total_qty = 0
        total_rec = 0
        total_sub = 0
        total_tax = 0
        total_line = 0

        @purchases.each do |po|
          po.purchase_order_items.each do |item|
            total_qty += item.quantity.to_i
            total_rec += item.received_quantity.to_i
            total_sub += item.subtotal.to_i
            total_tax += item.tax_amount.to_i
            total_line += item.total.to_i

            sheet.add_row [
              "OC-#{po.id.to_s.rjust(4, '0')}",
              po.created_at.to_date,
              po.supplier.name,
              item.product.sku || "-",
              item.product.name,
              item.quantity,
              item.received_quantity,
              item.unit_price.to_i,
              item.has_iva ? "Sí (19%)" : "Exento",
              item.subtotal.to_i,
              item.tax_amount.to_i,
              item.total.to_i
            ], style: [ cell_style, date_style, cell_style, cell_style, cell_style, cell_style, cell_style, currency_style, cell_style, currency_style, currency_style, currency_style ]
          end
        end

        sheet.add_row [
          "", "", "", "", "TOTALES:",
          total_qty,
          total_rec,
          "",
          "",
          total_sub,
          total_tax,
          total_line
        ], style: [ nil, nil, nil, nil, total_label_style, total_number_style, total_number_style, nil, nil, total_currency_style, total_currency_style, total_currency_style ]

        sheet.column_widths 15, 15, 30, 15, 35, 15, 15, 18, 15, 18, 18, 18
      end
    end
    p.to_stream.read
  end
end
