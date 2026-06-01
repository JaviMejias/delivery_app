class LocalClosure < ApplicationRecord
  acts_as_tenant :company
  belongs_to :company
  belongs_to :warehouse

  enum :status, { pending: 0, completed: 1 }

  validates :date, presence: true
  validates :warehouse_id, uniqueness: { scope: [:date, :company_id], message: "Ya existe un cierre para este local en esta fecha" }

  scope :with_details, -> { includes(:warehouse) }

  after_create :register_treasury_incomes

  private

  def register_treasury_incomes
    if declared_cash.to_f > 0
      TreasuryIncome.create!(
        company_id: company_id,
        date: date,
        amount: declared_cash,
        payment_method: 'cash',
        source: self
      )
    end
    if declared_card.to_f > 0
      TreasuryIncome.create!(
        company_id: company_id,
        date: date,
        amount: declared_card,
        payment_method: 'card',
        source: self
      )
    end
    if declared_transfer.to_f > 0
      TreasuryIncome.create!(
        company_id: company_id,
        date: date,
        amount: declared_transfer,
        payment_method: 'transfer',
        source: self
      )
    end
  end
end
