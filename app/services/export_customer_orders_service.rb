require "caxlsx"

class ExportCustomerOrdersService
  def initialize(orders, theme = 'indigo')
    @orders = orders
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
      date_style = s.add_style border: borders, format_code: "dd/mm/yyyy hh:mm", alignment: { horizontal: :center, vertical: :center }

      wb.add_worksheet(name: "Historial de Pedidos") do |sheet|
        sheet.add_row [ "Código", "Fecha", "Cliente", "Teléfono", "Dirección", "Camión Asignado", "Estado", "Detalle Pedido" ], style: header_style

        @orders.each do |order|
          truck_display = order.truck ? "#{order.truck.plate_number} (#{order.truck.driver&.full_name})" : "Sin Asignar"
          status_es = case order.status
                      when 'pending' then 'Pendiente'
                      when 'accepted' then 'Aceptado'
                      when 'in_transit' then 'En Camino'
                      when 'nearby' then 'Cerca'
                      when 'arrived' then 'Llegó'
                      when 'completed' then 'Completado'
                      when 'cancelled' then 'Cancelado'
                      else order.status.capitalize
                      end
          
          sheet.add_row [
            "PED-#{order.id.to_s.rjust(4, '0')}",
            order.created_at,
            order.client_name,
            order.phone,
            order.address,
            truck_display,
            status_es,
            order.summary_text
          ], style: [ cell_style, date_style, cell_style, cell_style, cell_style, cell_style, cell_style, cell_style ]
        end

        sheet.column_widths 15, 20, 30, 20, 40, 25, 15, 50
      end
    end
    p.to_stream.read
  end
end
