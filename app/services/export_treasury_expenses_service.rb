class ExportTreasuryExpensesService
  def initialize(expenses, theme = 'rose')
    @expenses = expenses
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
    else "F43F5E" # rose default for expenses
    end
  end

  def to_xlsx
    p = Axlsx::Package.new
    wb = p.workbook

    wb.styles do |s|
      borders = { style: :thin, color: "000000", edges: [ :top, :bottom, :left, :right ] }

      header_style = s.add_style bg_color: theme_hex, fg_color: "FFFFFF", b: true, alignment: { horizontal: :center, vertical: :center }, border: borders
      cell_style = s.add_style border: borders, alignment: { vertical: :center }
      money_style = s.add_style border: borders, alignment: { horizontal: :right, vertical: :center }, format_code: "$#,##0"
      date_style = s.add_style border: borders, alignment: { horizontal: :center, vertical: :center }, format_code: "dd/mm/yyyy"

      wb.add_worksheet(name: "Egresos") do |sheet|
        sheet.add_row ["Fecha", "N° Referencia", "Método", "Monto", "Detalle"], style: header_style

        @expenses.each do |exp|
          details = []
          details << exp.notes if exp.notes.present?
          exp.expense_documents.each do |ed|
            details << "Factura \##{ed.purchase_document&.document_number} ($#{ed.amount_applied.to_i})"
          end

          method_label = case exp.payment_method
            when 'cash' then 'Efectivo'
            when 'card' then 'Tarjeta'
            when 'transfer' then 'Transferencia'
            else exp.payment_method
            end

          sheet.add_row [
            exp.date.to_s,
            exp.reference_number || '-',
            method_label,
            exp.amount.to_i,
            details.join(' | ')
          ], style: [date_style, cell_style, cell_style, money_style, cell_style]
        end
      end
    end

    p.to_stream.read
  end
end
