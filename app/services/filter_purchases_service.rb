class FilterPurchasesService
  def self.call(params)
    orders = PurchaseOrder.with_full_details.recent
    orders = orders.search_by_query(params[:search]) if params[:search].present?

    start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
    end_date = params[:end_date].present? ? Date.parse(params[:end_date]) : Date.today

    orders.where(created_at: start_date.beginning_of_day..end_date.end_of_day)
  end
end
