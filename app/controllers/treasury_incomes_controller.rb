class TreasuryIncomesController < ApplicationController
  def index
    incomes = TreasuryIncome.order(date: :desc, created_at: :desc).includes(:source)
    date_from = params[:date_from].presence || Date.today.beginning_of_month.to_s
    date_to = params[:date_to].presence || Date.today.to_s

    incomes = incomes.where('date >= ?', date_from)
    incomes = incomes.where('date <= ?', date_to)
    if params[:payment_method].present?
      incomes = incomes.where(payment_method: params[:payment_method])
    end

    pagy, records = pagy(:offset, incomes, limit: 30)

    render inertia: "Treasury/Incomes/Index", props: {
      incomes: records.as_json(include: :source),
      pagination: extract_pagy(pagy),
      filters: {
        date_from: date_from,
        date_to: date_to,
        payment_method: params[:payment_method]
      }
    }
  end
end
