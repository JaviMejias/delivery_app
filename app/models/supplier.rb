class Supplier < ApplicationRecord
  include RutFormatter
  include PhoneFormatter
  acts_as_tenant :company

  has_many :purchase_documents, dependent: :destroy

  scope :search_by_name, ->(query) {
    if query.present?
      clean_rut = query.to_s.upcase.gsub(/[^0-9K]/, "")
      if clean_rut.present?
        where("name ILIKE :q OR REPLACE(REPLACE(rut, '.', ''), '-', '') ILIKE :rut_q", q: "%#{query}%", rut_q: "%#{clean_rut}%")
      else
        where("name ILIKE :q", q: "%#{query}%")
      end
    end
  }
end
