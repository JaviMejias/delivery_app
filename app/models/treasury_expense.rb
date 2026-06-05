class TreasuryExpense < ApplicationRecord
  acts_as_tenant :company
  belongs_to :company

  has_many :expense_documents, dependent: :destroy
  has_many :purchase_documents, through: :expense_documents

  validates :date, presence: true
  validates :amount, numericality: { greater_than: 0 }
  validates :payment_method, presence: true

  scope :search_by_query, ->(q) { where("reference_number ILIKE :q OR notes ILIKE :q", q: "%#{q}%") if q.present? }
end
