require "prawn"
require "prawn/table"

class GeneratePurchaseOrderPdfService
  def initialize(order, theme = 'indigo')
    @order = order
    @company = order.company
    @theme = theme || 'indigo'
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

  def call
    pdf = Prawn::Document.new(page_size: "LETTER", margin: [0, 0, 0, 0])
    pdf.font "Helvetica"
    
    # Header Banner
    pdf.fill_color theme_hex
    pdf.fill_rectangle [0, pdf.bounds.top], pdf.bounds.width, 100
    
    # Header Content inside banner
    pdf.bounding_box([40, pdf.bounds.top - 20], width: pdf.bounds.width - 80, height: 60) do
      pdf.fill_color "FFFFFF"
      pdf.text "ORDEN DE COMPRA", size: 24, style: :bold
      pdf.text "N° #{@order.id.to_s.rjust(5, '0')}", size: 14, style: :normal
      
      pdf.bounding_box([pdf.bounds.width - 150, pdf.bounds.top], width: 150) do
        pdf.text "Fecha: #{@order.created_at.strftime('%d/%m/%Y')}", size: 10, align: :right
        status_es = case @order.status
          when "draft" then "BORRADOR"
          when "confirmed" then "CONFIRMADA"
          when "received" then "RECIBIDA"
          when "cancelled" then "CANCELADA"
          else @order.status.upcase
        end
        pdf.text "Estado: #{status_es}", size: 10, align: :right, style: :bold
      end
    end
    
    pdf.fill_color "333333" # Reset color
    
    # Two Columns for Company and Supplier inside rounded boxes
    gap = 20
    box_width = (pdf.bounds.width - 80 - gap) / 2.0

    pdf.bounding_box([40, pdf.bounds.top - 120], width: pdf.bounds.width - 80) do
      # Company Box
      pdf.bounding_box([0, pdf.bounds.top], width: box_width, height: 120) do
        pdf.stroke_color theme_hex
        pdf.line_width 1.5
        pdf.stroke_rounded_rectangle [0, pdf.bounds.top], box_width, 120, 8
        pdf.fill_color "333333"
        
        pdf.bounding_box([15, pdf.bounds.top - 15], width: box_width - 30) do
          pdf.text "EMISOR", size: 9, color: theme_hex, style: :bold
          pdf.move_down 5
          pdf.text @company.name, size: 12, style: :bold
          pdf.move_down 5
          pdf.text "<b>RUT:</b> #{@company.rut || 'No Registrado'}", size: 9, color: "4B5563", inline_format: true
          pdf.text "<b>Giro:</b> #{@company.business_activity || 'No Registrado'}", size: 9, color: "4B5563", inline_format: true
          pdf.text "<b>Email:</b> #{@company.email}", size: 9, color: "4B5563", inline_format: true if @company.email.present?
          pdf.text "<b>Teléfono:</b> #{@company.phone}", size: 9, color: "4B5563", inline_format: true if @company.phone.present?
          pdf.text "<b>Dirección:</b> #{@company.address}", size: 9, color: "4B5563", inline_format: true if @company.address.present?
        end
      end
      
      # Supplier Box
      pdf.bounding_box([box_width + gap, pdf.bounds.top], width: box_width, height: 120) do
        pdf.stroke_color theme_hex
        pdf.line_width 1.5
        pdf.stroke_rounded_rectangle [0, pdf.bounds.top], box_width, 120, 8
        pdf.fill_color "333333"
        
        pdf.bounding_box([15, pdf.bounds.top - 15], width: box_width - 30) do
          pdf.text "PROVEEDOR", size: 9, color: theme_hex, style: :bold
          pdf.move_down 5
          pdf.text "#{@order.supplier.name}", size: 12, style: :bold
          pdf.move_down 5
          pdf.text "<b>RUT:</b> #{@order.supplier.rut || 'N/A'}", size: 9, color: "4B5563", inline_format: true
          pdf.text "<b>Email:</b> #{@order.supplier.contact_email || 'N/A'}", size: 9, color: "4B5563", inline_format: true
          pdf.text "<b>Teléfono:</b> #{@order.supplier.contact_phone || 'N/A'}", size: 9, color: "4B5563", inline_format: true
        end
      end
    end
    
    # Table
    pdf.bounding_box([40, pdf.bounds.top - 260], width: pdf.bounds.width - 80) do
      table_data = [ [ "SKU", "Descripción", "Cant.", "Precio Neto", "IVA", "Total" ] ]

      @order.purchase_order_items.each do |item|
        qty = @order.status == "received" ? item.received_quantity : item.quantity
        net_subtotal = qty * item.unit_price
        tax = item.has_iva ? (net_subtotal * 0.19).round : 0
        total_line = net_subtotal + tax

        table_data << [
          item.product.sku || "-",
          item.product.name,
          qty.to_s,
          format_money(item.unit_price),
          item.has_iva ? "19%" : "Exento",
          format_money(total_line)
        ]
      end

      pdf.table(table_data, width: pdf.bounds.width, header: true) do |t|
        t.cells.padding = [10, 8]
        t.cells.size = 9
        t.cells.border_width = 0.5
        t.cells.border_color = "D1D5DB"
        
        t.row(0).font_style = :bold
        t.row(0).background_color = theme_hex
        t.row(0).text_color = "FFFFFF"
        t.row(0).align = :center

        t.columns(2..5).align = :right
        (1..table_data.length - 1).each do |i|
          t.row(i).background_color = "F3F4F6" if i.even?
        end
      end

      pdf.move_down 20
      total_x = pdf.bounds.width - 250
      pdf.bounding_box([total_x, pdf.cursor], width: 250) do
        net_amount = @order.status == "received" ? total_received_net : @order.net_total
        tax_amount = @order.status == "received" ? total_received_tax : @order.tax_total
        total_amount = @order.status == "received" ? total_received_grand : @order.grand_total

        data = [
          [ "TOTAL NETO:", format_money(net_amount) ],
          [ "IVA (19%):", format_money(tax_amount) ],
          [ "TOTAL ORDEN:", format_money(total_amount) ]
        ]

        pdf.table(data, width: 250) do |t|
          t.cells.padding = [8, 5]
          t.cells.borders = [:bottom]
          t.cells.border_width = 1
          t.cells.border_color = "E5E7EB"

          t.row(2).border_color = theme_hex
          t.row(2).size = 12
          t.row(2).font_style = :bold
          t.columns(0).align = :right
          t.columns(1).align = :right
          t.row(2).columns(1).text_color = theme_hex
        end
      end

    end
    
    pdf.repeat(:all) do
      pdf.bounding_box([40, 70], width: pdf.bounds.width - 80, height: 60) do
        pdf.stroke_color theme_hex
        pdf.line_width 1.5
        pdf.stroke_horizontal_rule
        pdf.move_down 10
        pdf.text "Observaciones:", size: 10, style: :bold, color: theme_hex
        pdf.text "Documento emitido internamente para respaldar la orden de compra.", size: 9, color: "6B7280"
        pdf.move_down 5
        pdf.text "Documento Interno - No Válido como Boleta SII", size: 8, color: "9CA3AF", align: :center
      end
    end

    pdf.render
  end

  private

  def total_received_net
    @order.purchase_order_items.sum { |i| i.received_quantity * i.unit_price }
  end

  def total_received_tax
    @order.purchase_order_items.sum { |i| i.has_iva ? ((i.received_quantity * i.unit_price) * 0.19).round : 0 }
  end

  def total_received_grand
    total_received_net + total_received_tax
  end

  def format_money(amount)
    "$#{amount.to_i.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1.').reverse}"
  end
end
