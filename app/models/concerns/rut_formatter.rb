module RutFormatter
  extend ActiveSupport::Concern

  included do
    before_validation :format_rut_chileno, if: -> { self.has_attribute?(:rut) && self.rut.present? }
  end

  def format_rut_chileno
    clean = self.rut.to_s.upcase.gsub(/[^0-9K]/, "")
    return if clean.length < 2

    body = clean[0...-1]
    dv = clean[-1]

    formatted_body = body.reverse.gsub(/(\d{3})(?=\d)/, '\\1.').reverse
    self.rut = "#{formatted_body}-#{dv}"
  end
end
