class CalculateLocalClosureTotalsService
  def initialize(company, warehouse_id, date)
    @company = company
    @warehouse_id = warehouse_id
    @date = date
  end

  def call
    return nil unless @warehouse_id.present? && @date.present?

    if LocalClosure.exists?(company_id: @company.id, warehouse_id: @warehouse_id, date: @date)
      { already_closed: true, totals: default_totals }
    else
      sales = LocalSale.completed
                       .where(company_id: @company.id, warehouse_id: @warehouse_id, date: @date)

      cash = sales.sum(:cash_revenue)
      card = sales.sum(:card_revenue)
      transfer = sales.sum(:transfer_revenue)

      totals = {
        cash: cash,
        card: card,
        transfer: transfer,
        total: cash + card + transfer
      }

      { already_closed: false, totals: totals }
    end
  end

  private

  def default_totals
    { cash: 0, card: 0, transfer: 0, total: 0 }
  end
end
