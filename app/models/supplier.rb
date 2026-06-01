class Supplier < ApplicationRecord
  include RutFormatter
  include PhoneFormatter
  acts_as_tenant :company

  has_many :purchase_documents, dependent: :destroy

  scope :search_by_name, ->(query) { where('name ILIKE ?', "%#{query}%") if query.present? }
end
