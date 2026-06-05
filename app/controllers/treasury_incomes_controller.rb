class TreasuryIncomesController < ApplicationController
  before_action :require_admin!

  def index
    incomes = TreasuryIncome.order(date: :desc, created_at: :desc).includes(:source)
    
    start_date = params[:start_date].presence || Date.today.beginning_of_month.to_s
    end_date = params[:end_date].presence || Date.today.to_s

    incomes = incomes.where("date >= ?", start_date).where("date <= ?", end_date)

    if params[:payment_method].present?
      incomes = incomes.where(payment_method: params[:payment_method])
    end

    if params[:format] == "xlsx"
      send_data ExportTreasuryIncomesService.new(incomes, params[:theme]).to_xlsx, filename: "ingresos-#{Date.today}.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else
      pagy, records = pagy(:offset, incomes, limit: 30)

      render inertia: "Treasury/Incomes/Index", props: {
        incomes: records.map { |income|
          json = income.as_json(include: :source)
          if income.source_type == 'RouteSettlement' && income.source.present?
            json['source']['route_settlement_expenses'] = income.source.route_settlement_expenses.as_json
          end
          json
        },
        pagination: extract_pagy(pagy),
        filters: {
          start_date: start_date,
          end_date: end_date,
          payment_method: params[:payment_method]
        }
      }
    end
  end
end
