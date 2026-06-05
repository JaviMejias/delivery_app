require "prawn"
require "prawn/table"

class GenerateStockTransferPdfService
  def initialize(transfer)
    @transfer = transfer
    @company = ActsAsTenant.current_tenant || @transfer.source_warehouse&.company
  end

  def call
    pdf = Prawn::Document.new(page_size: "LETTER", margin: [ 40, 40, 40, 40 ])
    pdf.font "Helvetica"
    pdf.bounding_box([ 0, pdf.bounds.top ], width: pdf.bounds.width, height: 130) do
      if @company&.logo&.attached?
        pdf.bounding_box([ 0, pdf.bounds.top ], width: 120, height: 80) do
          begin
            logo_path = ActiveStorage::Blob.service.path_for(@company.logo.key)
            pdf.image logo_path, fit: [ 110, 80 ], position: :center, vposition: :center
          rescue StandardError
          end
        end
      end
      info_x = @company&.logo&.attached? ? 130 : 0
      info_width = @company&.logo&.attached? ? 220 : 350

      pdf.bounding_box([ info_x, pdf.bounds.top ], width: info_width) do
        pdf.text @company&.name || "Empresa No Registrada", size: 16, style: :bold
        pdf.move_down 5
        pdf.text "<b>RUT:</b> #{@company&.rut || 'No Registrado'}", size: 10, color: "4B5563", inline_format: true
        pdf.text "<b>Giro:</b> #{@company&.business_activity || 'No Registrado'}", size: 10, color: "4B5563", inline_format: true
        pdf.text "<b>Email:</b> #{@company&.email}", size: 10, color: "4B5563", inline_format: true if @company&.email.present?
        pdf.text "<b>Teléfono:</b> #{@company&.phone}", size: 10, color: "4B5563", inline_format: true if @company&.phone.present?
        pdf.text "<b>Dirección:</b> #{@company&.address}", size: 10, color: "4B5563", inline_format: true if @company&.address.present?
      end
      pdf.bounding_box([ pdf.bounds.width - 180, pdf.bounds.top ], width: 180) do
        pdf.stroke_color "4F46E5" # Indigo-600
        pdf.line_width 2
        pdf.stroke_bounds

        pdf.move_down 10
        pdf.text "GUÍA DE DESPACHO INTERNA", size: 10, style: :bold, align: :center, color: "4F46E5"
        pdf.move_down 5
        pdf.text "N° #{@transfer.id.to_s.rjust(5, '0')}", size: 14, style: :bold, align: :center
        pdf.move_down 5
      end
    end
    pdf.move_down 10
    pdf.bounding_box([ 0, pdf.cursor ], width: pdf.bounds.width) do
      pdf.move_down 12
      pdf.indent(15) do
        pdf.text "<b>Bodega Origen:</b> #{@transfer.source_warehouse.name}", size: 10, inline_format: true
        pdf.move_down 5
        pdf.text "<b>Destino:</b> #{@transfer.destination_warehouse.name}", size: 10, inline_format: true
        pdf.move_down 5

        status_es = case @transfer.status
        when "draft" then "BORRADOR"
        when "completed" then "COMPLETADA"
        else @transfer.status.upcase
        end

        pdf.text "<b>Fecha:</b> #{@transfer.created_at.strftime('%d/%m/%Y %H:%M')}    <b>Estado:</b> <color rgb='4F46E5'>#{status_es}</color>", size: 10, inline_format: true
      end
      pdf.move_down 12

      pdf.stroke_color "E5E7EB"
      pdf.line_width 1
      pdf.stroke_bounds
    end

    pdf.move_down 20
    table_data = [ [ "SKU", "Producto", "Cantidad" ] ]

    @transfer.stock_transfer_items.each do |item|
      table_data << [
        item.item.is_a?(Product) ? (item.item.sku || "-") : "-",
        item.item.name,
        item.quantity.to_s
      ]
    end

    pdf.table(table_data, width: pdf.bounds.width, header: true) do |t|
      t.cells.padding = [ 8, 5 ]
      t.cells.size = 9
      t.cells.border_width = 0.5
      t.cells.border_color = "D1D5DB"

      t.row(0).font_style = :bold
      t.row(0).background_color = "4F46E5"
      t.row(0).text_color = "FFFFFF"
      t.row(0).align = :center

      t.columns(2).align = :center
      (1..table_data.length - 1).each do |i|
        t.row(i).background_color = "F9FAFB" if i.even?
      end
    end

    pdf.move_down 50
    pdf.bounding_box([ 0, 80 ], width: pdf.bounds.width) do
      pdf.bounding_box([ 20, pdf.bounds.top ], width: 200) do
        pdf.stroke_horizontal_rule
        pdf.move_down 5
        pdf.text "Firma Bodeguero (Entrega)", size: 10, align: :center, style: :bold
      end

      pdf.bounding_box([ pdf.bounds.width - 220, pdf.bounds.top ], width: 200) do
        pdf.stroke_horizontal_rule
        pdf.move_down 5
        pdf.text "Firma Chofer (Recibe)", size: 10, align: :center, style: :bold
      end

      pdf.move_down 40

      pdf.stroke_color "E5E7EB"
      pdf.stroke_horizontal_rule
      pdf.move_down 5
      pdf.text "Documento Interno - Guía de Movimiento de Inventario. No constituye venta ni es válido como documento tributario del SII.", size: 8, color: "9CA3AF", align: :center
    end

    pdf.render
  end
end
