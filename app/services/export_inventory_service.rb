require "caxlsx"

class ExportInventoryService
  def initialize(inventories)
    @inventories = inventories
  end

  def to_xlsx
    p = Axlsx::Package.new
    wb = p.workbook

    wb.styles do |s|
      borders = { style: :thin, color: "000000", edges: [ :top, :bottom, :left, :right ] }

      header_style = s.add_style bg_color: "D97706", fg_color: "FFFFFF", b: true, alignment: { horizontal: :center, vertical: :center }, border: borders
      cell_style = s.add_style border: borders, alignment: { vertical: :center }

      total_label_style = s.add_style bg_color: "F3F4F6", b: true, alignment: { horizontal: :right, vertical: :center }, border: borders
      total_number_style = s.add_style bg_color: "F3F4F6", b: true, border: borders, alignment: { horizontal: :right, vertical: :center }

      wb.add_worksheet(name: "Estado de Inventario") do |sheet|
        sheet.add_row [ "Bodega", "Tipo", "SKU", "Ítem", "Cantidad" ], style: header_style

        @inventories.each do |inv|
          item_name = inv.item.is_a?(Product) ? inv.item.name : inv.item.name
          sku = inv.item.is_a?(Product) ? inv.item.sku || "-" : "-"
          type = inv.item.is_a?(Product) ? "Cilindro Lleno" : "Envase Vacío"

          sheet.add_row [
            inv.warehouse.name,
            type,
            sku,
            item_name,
            inv.quantity.to_i
          ], style: [ cell_style, cell_style, cell_style, cell_style, cell_style ]
        end

        sheet.add_row [
          "", "", "", "TOTAL UNIDADES:",
          @inventories.sum(&:quantity).to_i
        ], style: [ nil, nil, nil, total_label_style, total_number_style ]

        sheet.column_widths 25, 20, 20, 40, 15
      end
    end
    p.to_stream.read
  end
end
