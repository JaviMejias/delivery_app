require 'prawn'
require 'prawn/table'

class GeneratePurchaseOrderPdfService
  def initialize(order)
    @order = order
    @company = order.company
  end

  def call
    pdf = Prawn::Document.new(page_size: 'LETTER', margin: [40, 40, 40, 40])
    pdf.font "Helvetica"
    pdf.bounding_box([0, pdf.bounds.top], width: pdf.bounds.width, height: 130) do
      if @company.logo.attached?
        pdf.bounding_box([0, pdf.bounds.top], width: 120, height: 80) do
          begin
            logo_path = ActiveStorage::Blob.service.path_for(@company.logo.key)
            pdf.image logo_path, fit: [110, 80], position: :center, vposition: :center
          rescue StandardError
          end
        end
      end
      info_x = @company.logo.attached? ? 130 : 0
      info_width = @company.logo.attached? ? 220 : 350
      
      pdf.bounding_box([info_x, pdf.bounds.top], width: info_width) do
        pdf.text @company.name, size: 16, style: :bold
        pdf.move_down 5
        pdf.text "<b>RUT:</b> #{@company.rut || 'No Registrado'}", size: 10, color: "4B5563", inline_format: true
        pdf.text "<b>Giro:</b> #{@company.business_activity || 'No Registrado'}", size: 10, color: "4B5563", inline_format: true
        pdf.text "<b>Email:</b> #{@company.email}", size: 10, color: "4B5563", inline_format: true if @company.email.present?
        pdf.text "<b>Teléfono:</b> #{@company.phone}", size: 10, color: "4B5563", inline_format: true if @company.phone.present?
        pdf.text "<b>Dirección:</b> #{@company.address}", size: 10, color: "4B5563", inline_format: true if @company.address.present?
      end
      pdf.bounding_box([pdf.bounds.width - 180, pdf.bounds.top], width: 180) do
        pdf.stroke_color "059669"
        pdf.line_width 2
        pdf.stroke_bounds
        
        pdf.move_down 10
        pdf.text "ORDEN DE COMPRA", size: 12, style: :bold, align: :center, color: "059669"
        pdf.move_down 5
        pdf.text "N° #{@order.id.to_s.rjust(5, '0')}", size: 14, style: :bold, align: :center
        pdf.move_down 5
      end
    end
    pdf.move_down 10
    pdf.bounding_box([0, pdf.cursor], width: pdf.bounds.width) do
      pdf.move_down 12
      pdf.indent(15) do
        pdf.text "<b>Señor(es):</b> #{@order.supplier.name}", size: 10, inline_format: true
        pdf.move_down 5
        pdf.text "<b>RUT:</b> #{@order.supplier.rut || 'N/A'}", size: 10, inline_format: true
        pdf.move_down 5
        pdf.text "<b>Email:</b> #{@order.supplier.contact_email || 'N/A'}    <b>Teléfono:</b> #{@order.supplier.contact_phone || 'N/A'}", size: 10, inline_format: true
        pdf.move_down 5
        
        status_es = case @order.status
                    when 'draft' then 'BORRADOR'
                    when 'confirmed' then 'CONFIRMADA'
                    when 'received' then 'RECIBIDA'
                    when 'cancelled' then 'CANCELADA'
                    else @order.status.upcase
                    end
        
        pdf.text "<b>Fecha:</b> #{@order.created_at.strftime('%d/%m/%Y')}    <b>Estado:</b> <color rgb='059669'>#{status_es}</color>", size: 10, inline_format: true
      end
      pdf.move_down 12
      
      pdf.stroke_color "E5E7EB"
      pdf.line_width 1
      pdf.stroke_bounds
    end

    pdf.move_down 20
    table_data = [['SKU', 'Descripción', 'Cant.', 'Precio Neto', 'IVA', 'Total']]
    
    @order.purchase_order_items.each do |item|
      qty = @order.status == 'received' ? item.received_quantity : item.quantity
      net_subtotal = qty * item.unit_price
      tax = item.has_iva ? (net_subtotal * 0.19).round : 0
      total_line = net_subtotal + tax

      table_data << [
        item.product.sku || "-",
        item.product.name,
        qty.to_s,
        format_money(item.unit_price),
        item.has_iva ? '19%' : 'Exento',
        format_money(total_line)
      ]
    end

    pdf.table(table_data, width: pdf.bounds.width, header: true) do |t|
      t.cells.padding = [8, 5]
      t.cells.size = 9
      t.cells.border_width = 0.5
      t.cells.border_color = "D1D5DB"
      
      t.row(0).font_style = :bold
      t.row(0).background_color = "059669"
      t.row(0).text_color = "FFFFFF"
      t.row(0).align = :center
      
      t.columns(2..5).align = :right
      (1..table_data.length - 1).each do |i|
        t.row(i).background_color = "F9FAFB" if i.even?
      end
    end

    pdf.move_down 20
    total_x = pdf.bounds.width - 250
    pdf.bounding_box([total_x, pdf.cursor], width: 250) do
      net_amount = @order.status == 'received' ? total_received_net : @order.net_total
      tax_amount = @order.status == 'received' ? total_received_tax : @order.tax_total
      total_amount = @order.status == 'received' ? total_received_grand : @order.grand_total
      
      data = [
        ["TOTAL NETO:", format_money(net_amount)],
        ["IVA (19%):", format_money(tax_amount)],
        ["TOTAL ORDEN:", format_money(total_amount)]
      ]
      
      pdf.table(data, width: 250) do |t|
        t.cells.padding = [8, 5]
        t.cells.borders = [:top, :bottom]
        t.cells.border_width = 1
        t.cells.border_color = "D1D5DB"
        
        t.row(2).border_color = "059669"
        t.row(2).size = 12
        t.row(2).font_style = :bold
        t.columns(0).align = :right
        t.columns(1).align = :right
        t.row(2).columns(1).text_color = "059669"
      end
    end

    pdf.move_down 50
    pdf.bounding_box([0, 50], width: pdf.bounds.width) do
      pdf.stroke_color "E5E7EB"
      pdf.stroke_horizontal_rule
      pdf.move_down 10
      pdf.text "Observaciones:", size: 10, style: :bold
      pdf.text "Documento emitido internamente para respaldar la orden de compra.", size: 9, color: "6B7280"
      pdf.move_down 5
      pdf.text "Documento Interno - No Válido como Boleta SII", size: 8, color: "9CA3AF", align: :center
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
