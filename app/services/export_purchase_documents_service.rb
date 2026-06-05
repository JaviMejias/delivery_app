require "caxlsx"

class ExportPurchaseDocumentsService
  def initialize(documents, theme = 'indigo')
    @documents = documents
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

      wb.add_worksheet(name: "Facturas de Compra") do |sheet|
        sheet.add_row [ "Fecha", "Proveedor", "Documento", "Neto", "IVA", "Total", "Estado" ], style: header_style

        @documents.each do |doc|
          type_es = case doc.document_type.to_s
                    when "invoice" then "Factura"
                    when "credit_note" then "Nota de Crédito"
                    when "debit_note" then "Nota de Débito"
                    when "receipt" then "Boleta"
                    else "Otro"
                    end
          
          status_es = case doc.status.to_s
                      when "draft" then "Borrador"
                      when "pending" then "No Pagada"
                      when "partial" then "Parcial"
                      when "paid" then "Pagada"
                      when "voided" then "Anulada"
                      else doc.status.to_s.capitalize
                      end

          sheet.add_row [
            doc.issue_date,
            doc.supplier&.name || "Sin Proveedor",
            "#{type_es.upcase} #{doc.document_number}",
            doc.net_amount.to_i,
            doc.tax_amount.to_i,
            doc.total_amount.to_i,
            status_es
          ], style: [ date_style, cell_style, cell_style, currency_style, currency_style, currency_style, cell_style ]
        end

        sheet.add_row [
          "", "", "TOTALES:",
          @documents.sum(&:net_amount).to_i,
          @documents.sum(&:tax_amount).to_i,
          @documents.sum(&:total_amount).to_i,
          ""
        ], style: [ nil, nil, total_label_style, total_currency_style, total_currency_style, total_currency_style, nil ]

        sheet.column_widths 15, 30, 20, 15, 15, 15, 15
      end
    end
    p.to_stream.read
  end
end
