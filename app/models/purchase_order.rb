class PurchaseOrder < ApplicationRecord
  acts_as_tenant :company
  belongs_to :supplier
  has_many :purchase_order_items, dependent: :destroy
  has_many :stock_movements, as: :reference
  has_many :purchase_documents, dependent: :nullify

  enum :status, { draft: 0, confirmed: 1, received: 2, cancelled: 3 }

  scope :with_full_details, -> { includes(:supplier, :purchase_documents, purchase_order_items: { product: :material }) }
  scope :search_by_query, ->(q) { 
    if q.present?
      clean_q = q.to_s.strip
      if clean_q.match?(/^(OC-)?\d+$/i)
        exact_id = clean_q.gsub(/\D/, '').to_i
        joins(:supplier).where("purchase_orders.id = :id OR suppliers.name ILIKE :q", id: exact_id, q: "%#{clean_q}%")
      else
        joins(:supplier).where("suppliers.name ILIKE :q", q: "%#{clean_q}%")
      end
    end
  }

  validates :status, presence: true

  def net_total
    purchase_order_items.sum(:subtotal)
  end

  def tax_total
    purchase_order_items.sum(:tax_amount)
  end

  def grand_total
    purchase_order_items.sum(:total)
  end
end
