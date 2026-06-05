require "caxlsx"

class ExportInventoryService
  def initialize(inventories, theme = 'indigo')
    @inventories = inventories
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

      total_label_style = s.add_style bg_color: "F3F4F6", b: true, alignment: { horizontal: :right, vertical: :center }, border: borders
      total_number_style = s.add_style bg_color: "F3F4F6", b: true, border: borders, alignment: { horizontal: :right, vertical: :center }

      products = @inventories.select { |inv| inv.item.is_a?(Product) }
      materials = @inventories.select { |inv| inv.item.is_a?(Material) }

      # Sheet 1: Cilindros Llenos
      wb.add_worksheet(name: "Cilindros Llenos") do |sheet|
        sheet.add_row [ "Bodega", "SKU", "Producto", "Cantidad" ], style: header_style

        products.each do |inv|
          sheet.add_row [
            inv.warehouse.name,
            inv.item.sku || "-",
            inv.item.name,
            inv.quantity.to_i
          ], style: [ cell_style, cell_style, cell_style, cell_style ]
        end

        sheet.add_row [
          "", "", "TOTAL LLENOS:",
          products.sum(&:quantity).to_i
        ], style: [ nil, nil, total_label_style, total_number_style ]

        sheet.column_widths 25, 20, 40, 15
      end

      # Sheet 2: Envases Vacíos
      wb.add_worksheet(name: "Envases Vacíos") do |sheet|
        sheet.add_row [ "Bodega", "Material", "Cantidad" ], style: header_style

        materials.each do |inv|
          sheet.add_row [
            inv.warehouse.name,
            inv.item.name,
            inv.quantity.to_i
          ], style: [ cell_style, cell_style, cell_style ]
        end

        sheet.add_row [
          "", "TOTAL VACÍOS:",
          materials.sum(&:quantity).to_i
        ], style: [ nil, total_label_style, total_number_style ]

        sheet.column_widths 25, 40, 15
      end
    end
    p.to_stream.read
  end
end
