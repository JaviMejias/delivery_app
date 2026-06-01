require "caxlsx"

class ExportPurchasesService
  def initialize(purchases)
    @purchases = purchases
  end

  def to_xlsx
    p = Axlsx::Package.new
    wb = p.workbook

    wb.styles do |s|
      borders = { style: :thin, color: "000000", edges: [ :top, :bottom, :left, :right ] }

      header_style = s.add_style bg_color: "059669", fg_color: "FFFFFF", b: true, alignment: { horizontal: :center, vertical: :center }, border: borders
      cell_style = s.add_style border: borders, alignment: { vertical: :center }
      currency_style = s.add_style border: borders, format_code: "$#,##0", alignment: { horizontal: :right, vertical: :center }
      date_style = s.add_style border: borders, format_code: "dd/mm/yyyy", alignment: { horizontal: :center, vertical: :center }

      total_label_style = s.add_style bg_color: "F3F4F6", b: true, alignment: { horizontal: :right, vertical: :center }, border: borders
      total_currency_style = s.add_style bg_color: "F3F4F6", b: true, border: borders, format_code: "$#,##0", alignment: { horizontal: :right, vertical: :center }
      total_number_style = s.add_style bg_color: "F3F4F6", b: true, border: borders, alignment: { horizontal: :right, vertical: :center }

      wb.add_worksheet(name: "Compras (Resumen)") do |sheet|
        sheet.add_row [ "Código", "Fecha", "Proveedor", "Estado", "Total" ], style: header_style

        @purchases.each do |po|
          sheet.add_row [
            "OC-#{po.id.to_s.rjust(4, '0')}",
            po.created_at.to_date,
            po.supplier.name,
            po.status.capitalize,
            po.total.to_i
          ], style: [ cell_style, date_style, cell_style, cell_style, currency_style ]
        end

        sheet.add_row [
          "", "", "", "TOTALES:",
          @purchases.sum(&:total).to_i
        ], style: [ nil, nil, nil, total_label_style, total_currency_style ]

        sheet.column_widths 15, 15, 30, 20, 20
      end

      wb.add_worksheet(name: "Detalle de Ítems") do |sheet|
        sheet.add_row [ "Código Compra", "Fecha", "Proveedor", "SKU", "Producto", "Solicitados", "Recibidos", "Precio Unit.", "Subtotal" ], style: header_style

        total_qty = 0
        total_rec = 0
        total_sub = 0

        @purchases.each do |po|
          po.purchase_order_items.each do |item|
            total_qty += item.quantity.to_i
            total_rec += item.received_quantity.to_i
            total_sub += item.subtotal.to_i

            sheet.add_row [
              "OC-#{po.id.to_s.rjust(4, '0')}",
              po.created_at.to_date,
              po.supplier.name,
              item.product.sku || "-",
              item.product.name,
              item.quantity,
              item.received_quantity,
              item.unit_price.to_i,
              item.subtotal.to_i
            ], style: [ cell_style, date_style, cell_style, cell_style, cell_style, cell_style, cell_style, currency_style, currency_style ]
          end
        end

        sheet.add_row [
          "", "", "", "", "TOTALES:",
          total_qty,
          total_rec,
          "",
          total_sub
        ], style: [ nil, nil, nil, nil, total_label_style, total_number_style, total_number_style, nil, total_currency_style ]

        sheet.column_widths 15, 15, 30, 15, 40, 15, 15, 15, 20
      end
    end
    p.to_stream.read
  end
end
