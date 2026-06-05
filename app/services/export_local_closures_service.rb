require "caxlsx"

class ExportLocalClosuresService
  def initialize(closures, theme = 'indigo')
    @closures = closures
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

      wb.add_worksheet(name: "Cierres de Caja") do |sheet|
        sheet.add_row [
          "Fecha", "Bodega", "Estado",
          "Efectivo Sis.", "Tarjeta Sis.", "Transf. Sis.", "Total Sis.",
          "Efectivo Decl.", "Tarjeta Decl.", "Transf. Decl.", "Total Decl.",
          "Diferencia", "Observaciones"
        ], style: header_style

        @closures.each do |closure|
          status_es = closure.status == 'approved' ? 'Aprobado' : (closure.status == 'rejected' ? 'Rechazado' : closure.status&.capitalize || 'Pendiente')
          diff = closure.declared_total - closure.system_total

          sheet.add_row [
            closure.date,
            closure.warehouse&.name || "-",
            status_es,
            closure.system_cash.to_i,
            closure.system_card.to_i,
            closure.system_transfer.to_i,
            closure.system_total.to_i,
            closure.declared_cash.to_i,
            closure.declared_card.to_i,
            closure.declared_transfer.to_i,
            closure.declared_total.to_i,
            diff.to_i,
            closure.observations
          ], style: [
            date_style, cell_style, cell_style,
            currency_style, currency_style, currency_style, currency_style,
            currency_style, currency_style, currency_style, currency_style,
            currency_style, cell_style
          ]
        end

        sheet.add_row [
          "", "", "TOTALES:",
          @closures.sum(&:system_cash).to_i,
          @closures.sum(&:system_card).to_i,
          @closures.sum(&:system_transfer).to_i,
          @closures.sum(&:system_total).to_i,
          @closures.sum(&:declared_cash).to_i,
          @closures.sum(&:declared_card).to_i,
          @closures.sum(&:declared_transfer).to_i,
          @closures.sum(&:declared_total).to_i,
          @closures.sum { |c| c.declared_total - c.system_total }.to_i,
          ""
        ], style: [
          nil, nil, total_label_style,
          total_currency_style, total_currency_style, total_currency_style, total_currency_style,
          total_currency_style, total_currency_style, total_currency_style, total_currency_style,
          total_currency_style, nil
        ]

        sheet.column_widths 15, 25, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 30
      end
    end
    p.to_stream.read
  end
end
