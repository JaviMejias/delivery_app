class RouteSettlement < ApplicationRecord
  acts_as_tenant :company
  belongs_to :truck
  has_many :route_settlement_items, dependent: :destroy
  has_many :route_settlement_expenses, dependent: :destroy

  accepts_nested_attributes_for :route_settlement_items, allow_destroy: true
  accepts_nested_attributes_for :route_settlement_expenses, allow_destroy: true

  enum :status, { draft: 0, completed: 1 }

  validates :date, presence: true
  validates :total_revenue, numericality: true
  validates :cash_revenue, numericality: true
  validates :card_revenue, numericality: true
  validates :transfer_revenue, numericality: true

  before_validation :calculate_total_revenue

  def calculate_total_revenue
    self.total_revenue = (self.cash_revenue || 0) + (self.card_revenue || 0) + (self.transfer_revenue || 0)
  end

  scope :completed, -> { where(status: :completed) }
  scope :in_date_range, ->(start_date, end_date) { where(date: start_date..end_date) }
  scope :search_by_query, ->(q) { joins(:truck).where("trucks.plate_number ILIKE :q OR route_settlements.date::text ILIKE :q", q: "%#{q}%") if q.present? }
  scope :with_details, -> { includes(truck: [ :warehouse, :driver ]) }
  scope :with_full_details, -> { includes(truck: [ :warehouse, :driver ], route_settlement_items: { product: [ :material, :brand, :product_prices ] }) }

  after_save :register_treasury_incomes, if: -> { saved_change_to_status? && completed? }

  private

  def register_treasury_incomes
    cash_expenses_total = route_settlement_expenses.where(payment_method: 'cash').sum(:amount)
    adjusted_cash_income = cash_revenue.to_f + cash_expenses_total.to_f

    if adjusted_cash_income > 0
      TreasuryIncome.create!(
        company_id: company_id,
        date: date,
        amount: adjusted_cash_income,
        payment_method: "cash",
        source: self
      )
    end
    if card_revenue.to_f > 0
      TreasuryIncome.create!(
        company_id: company_id,
        date: date,
        amount: card_revenue,
        payment_method: "card",
        source: self
      )
    end
    if transfer_revenue.to_f > 0
      TreasuryIncome.create!(
        company_id: company_id,
        date: date,
        amount: transfer_revenue,
        payment_method: "transfer",
        source: self
      )
    end

    route_settlement_expenses.each do |expense|
      TreasuryExpense.create!(
        company_id: company_id,
        date: date,
        amount: expense.amount,
        payment_method: expense.payment_method,
        notes: "Rendición de Ruta - #{truck.plate_number}: #{expense.description}",
        reference_number: "RUTA-#{id}"
      )
    end
  end
end
