require "csv"
require "prawn"
require "prawn/table"

class ExportSalesService
  def initialize(sales)
    @sales = sales
  end

  def to_xlsx
    p = Axlsx::Package.new
    wb = p.workbook

    wb.styles do |s|
      borders = { style: :thin, color: "000000", edges: [ :top, :bottom, :left, :right ] }
      header_style = s.add_style(
        bg_color: "4F46E5",
        fg_color: "FFFFFF",
        b: true,
        alignment: { horizontal: :center, vertical: :center },
        border: borders
      )
      cell_style = s.add_style(
        border: borders,
        alignment: { vertical: :center }
      )
      currency_style = s.add_style(
        border: borders,
        format_code: "$#,##0",
        alignment: { horizontal: :right, vertical: :center }
      )
      date_style = s.add_style(
        border: borders,
        format_code: "dd/mm/yyyy",
        alignment: { horizontal: :center, vertical: :center }
      )
      total_label_style = s.add_style(
        bg_color: "F3F4F6",
        b: true,
        alignment: { horizontal: :right, vertical: :center },
        border: borders
      )
      total_currency_style = s.add_style(
        bg_color: "F3F4F6",
        b: true,
        border: borders,
        format_code: "$#,##0",
        alignment: { horizontal: :right, vertical: :center }
      )
      total_number_style = s.add_style(
        bg_color: "F3F4F6",
        b: true,
        border: borders,
        alignment: { horizontal: :right, vertical: :center }
      )

      wb.add_worksheet(name: "Ventas (Resumen)") do |sheet|
        sheet.add_row [ "Código", "Fecha", "Tipo", "Bodega", "Ítems", "Efectivo", "Tarjeta", "Transferencia", "Vales", "Total" ], style: header_style

        @sales.each do |sale|
          items_summary = sale.local_sale_items.map { |item| "#{item.quantity}x #{item.product.name}" }.join(", ")

          sheet.add_row [
            "VTA-#{sale.id.to_s.rjust(4, '0')}",
            sale.date,
            sale.sale_type == "warehouse" ? "Bodega" : "Mayorista",
            sale.warehouse.name,
            items_summary,
            sale.cash_revenue.to_i,
            sale.card_revenue.to_i,
            sale.transfer_revenue.to_i,
            sale.voucher_revenue.to_i,
            sale.total_revenue.to_i
          ], style: [ cell_style, date_style, cell_style, cell_style, cell_style, currency_style, currency_style, currency_style, currency_style, currency_style ]
        end

        sheet.add_row [
          "", "", "", "", "TOTALES:",
          @sales.sum(&:cash_revenue).to_i,
          @sales.sum(&:card_revenue).to_i,
          @sales.sum(&:transfer_revenue).to_i,
          @sales.sum(&:voucher_revenue).to_i,
          @sales.sum(&:total_revenue).to_i
        ], style: [ nil, nil, nil, nil, total_label_style, total_currency_style, total_currency_style, total_currency_style, total_currency_style, total_currency_style ]

        sheet.column_widths 15, 15, 15, 25, 50, 15, 15, 15, 15, 15
      end

      wb.add_worksheet(name: "Detalle de Ítems") do |sheet|
        sheet.add_row [ "Código Venta", "Fecha", "Bodega", "SKU", "Producto", "Cantidad", "Precio Unitario", "Subtotal" ], style: header_style

        total_qty = 0
        total_sub = 0

        @sales.each do |sale|
          sale.local_sale_items.each do |item|
            unit_price = item.quantity.to_i > 0 ? (item.subtotal.to_f / item.quantity).to_i : 0

            total_qty += item.quantity.to_i
            total_sub += item.subtotal.to_i

            sheet.add_row [
              "VTA-#{sale.id.to_s.rjust(4, '0')}",
              sale.date,
              sale.warehouse.name,
              item.product.sku || "-",
              item.product.name,
              item.quantity,
              unit_price,
              item.subtotal.to_i
            ], style: [ cell_style, date_style, cell_style, cell_style, cell_style, cell_style, currency_style, currency_style ]
          end
        end

        sheet.add_row [
          "", "", "", "", "TOTALES:",
          total_qty,
          "",
          total_sub
        ], style: [ nil, nil, nil, nil, total_label_style, total_number_style, nil, total_currency_style ]

        sheet.column_widths 15, 15, 25, 15, 40, 15, 20, 20
      end
    end

    p.to_stream.read
  end

  private

  def format_money(amount)
    return "$0" if amount.nil? || amount.to_i == 0
    "$#{amount.to_i.to_s.reverse.scan(/.{1,3}/).join('.').reverse}"
  end
end
