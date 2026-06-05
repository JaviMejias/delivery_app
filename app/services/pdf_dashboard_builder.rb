require "prawn"
require "prawn/table"

class PdfDashboardBuilder
  def initialize(title:, theme_color:, kpis:, table_headers:, table_data:, is_landscape: false, numeric_columns: [], column_widths: nil)
    @title = title
    @theme_color = theme_color
    @kpis = kpis
    @table_headers = table_headers
    @table_data = table_data
    @is_landscape = is_landscape
    @numeric_columns = numeric_columns
    @column_widths = column_widths
  end

  def render
    layout = @is_landscape ? :landscape : :portrait
    pdf = Prawn::Document.new(page_size: "LETTER", page_layout: layout, margin: [ 0, 0, 0, 0 ])
    pdf.font "Helvetica"
    pdf.fill_color "111827"
    pdf.fill_rectangle [ 0, pdf.bounds.top ], pdf.bounds.width, 90
    pdf.fill_color "FFFFFF"
    pdf.draw_text @title, at: [ 30, pdf.bounds.top - 45 ], size: 24, style: :bold
    pdf.fill_color "9CA3AF"
    pdf.draw_text "Generado: #{Time.current.strftime('%d/%m/%Y %H:%M')}", at: [ 30, pdf.bounds.top - 65 ], size: 10
    pdf.bounding_box([ 30, pdf.bounds.top - 120 ], width: pdf.bounds.width - 60, height: pdf.bounds.height - 160) do
      card_width = (pdf.bounds.width - ((@kpis.size - 1) * 15)) / @kpis.size.to_f

      @kpis.each_with_index do |kpi, i|
        x = i * (card_width + 15)

        bg_color = kpi[:is_primary] ? @theme_color : "F3F4F6"
        label_color = kpi[:is_primary] ? "FFFFFF" : "6B7280"
        value_color = kpi[:is_primary] ? "FFFFFF" : "111827"

        pdf.fill_color bg_color
        pdf.fill_rounded_rectangle [ x, pdf.cursor ], card_width, 65, 8

        pdf.fill_color label_color
        pdf.draw_text kpi[:label].upcase, at: [ x + 15, pdf.cursor - 25 ], size: 9, style: :bold

        pdf.fill_color value_color
        pdf.draw_text kpi[:value], at: [ x + 15, pdf.cursor - 50 ], size: 16, style: :bold
      end

      pdf.move_down 90
      if @table_data.empty?
        pdf.move_down 40
        pdf.fill_color "6B7280"
        pdf.text "No hay datos para mostrar en este período.", align: :center, size: 14
      else
        full_table = [ @table_headers ] + @table_data
        pdf.table(full_table, width: pdf.bounds.width, column_widths: @column_widths, cell_style: { inline_format: true }) do |t|
          t.cells.padding = [ 8, 5 ]
          t.cells.borders = [ :bottom ]
          t.cells.border_width = 0.5
          t.cells.border_color = "E5E7EB"
          t.cells.text_color = "374151"
          t.cells.size = 9
          t.row(0).background_color = "F9FAFB"
          t.row(0).text_color = "6B7280"
          t.row(0).font_style = :bold
          t.row(0).borders = [ :bottom, :top ]
          t.row(0).border_width = 1
          t.row(0).border_color = "E5E7EB"
          @numeric_columns.each do |col_idx|
            t.column(col_idx).align = :right
          end
        end
      end
    end
    pdf.number_pages "Página <page> de <total>", {
      start_count_at: 1,
      page_filter: :all,
      at: [ pdf.bounds.right - 100, 30 ],
      align: :right,
      size: 9,
      color: "9CA3AF"
    }

    pdf.render
  end
end
