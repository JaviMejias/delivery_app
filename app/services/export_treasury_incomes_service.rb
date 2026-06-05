class ExportTreasuryIncomesService
  def initialize(incomes, theme = 'emerald')
    @incomes = incomes
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
    else "10B981" # emerald default for incomes
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

      wb.add_worksheet(name: "Ingresos") do |sheet|
        sheet.add_row ["Fecha", "Origen", "Método", "Monto"], style: header_style

        @incomes.each do |income|
          source_label = case income.source_type
            when 'LocalClosure' then "Cierre Local \##{income.source_id}"
            when 'RouteSettlement' then "Rendición Ruta \##{income.source_id}"
            else income.source_type || 'Manual'
            end

          method_label = case income.payment_method
            when 'cash' then 'Efectivo'
            when 'card' then 'Tarjeta'
            when 'transfer' then 'Transferencia'
            else income.payment_method
            end

          sheet.add_row [
            income.date.to_s,
            source_label,
            method_label,
            income.amount.to_i
          ], style: [date_style, cell_style, cell_style, money_style]
        end
      end
    end

    p.to_stream.read
  end
end
