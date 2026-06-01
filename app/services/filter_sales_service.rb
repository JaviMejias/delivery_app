class FilterSalesService
  def self.call(params)
    sales = LocalSale.with_details.recent
    sales = sales.search_by_query(params[:search]) if params[:search].present?
    
    start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.current.beginning_of_month
    end_date = params[:end_date].present? ? Date.parse(params[:end_date]) : Date.current
    
    sales.where(date: start_date..end_date)
  end
end
