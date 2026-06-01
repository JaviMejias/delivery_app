class DashboardAnalyticsService
  def initialize(company, params)
    @company = company
    @params = params
    @from_date = parse_date(params[:from], Date.current.beginning_of_month)
    @to_date = parse_date(params[:to], Date.current)
    @warehouse_id = params[:warehouse_id].presence
  end

  def call
    {
      warehouses: fetch_warehouses,
      filters: {
        from: @from_date.to_s,
        to: @to_date.to_s,
        warehouse_id: @warehouse_id
      },
      stats: fetch_stats,
      chart_data: fetch_chart_data,
      truck_performance: fetch_truck_performance,
      critical_stock: fetch_critical_stock,
      alerts: fetch_alerts
    }
  end

  private

  def parse_date(date_str, default_date)
    date_str.present? ? Date.parse(date_str) : default_date
  rescue ArgumentError
    default_date
  end

  def fetch_warehouses
    Warehouse.where(company_id: @company.id).as_json(only: [:id, :name])
  end

  def fetch_stats
    route_revenue = calculate_route_revenue
    local_revenue = calculate_local_revenue

    {
      total_sales_period: route_revenue + local_revenue,
      route_revenue: route_revenue,
      local_revenue: local_revenue
    }
  end

  def calculate_route_revenue
    query = RouteSettlement.where(company_id: @company.id, status: 'completed')
                           .where('date >= ? AND date <= ?', @from_date, @to_date)
                           
    query = query.joins(:truck).where(trucks: { warehouse_id: @warehouse_id }) if @warehouse_id
    query.sum(:total_revenue)
  end

  def calculate_local_revenue
    query = LocalSale.where(company_id: @company.id, status: 'completed')
                     .where('local_sales.created_at >= ? AND local_sales.created_at <= ?', @from_date.beginning_of_day, @to_date.end_of_day)
                     
    query = query.where(warehouse_id: @warehouse_id) if @warehouse_id
    query.sum(:total_revenue)
  end

  def fetch_chart_data
    materials = Material.where(company_id: @company.id, returnable: true)
    
    materials.map do |mat|
      {
        name: mat.name,
        llenos: calculate_filled_inventory(mat.id),
        vacios: calculate_empty_inventory(mat)
      }
    end
  end

  def calculate_empty_inventory(material)
    query = Inventory.where(company_id: @company.id, item: material)
    query = query.where(warehouse_id: @warehouse_id) if @warehouse_id
    query.sum(:quantity)
  end

  def calculate_filled_inventory(material_id)
    products_of_mat = Product.where(material_id: material_id)
    query = Inventory.where(company_id: @company.id, item: products_of_mat)
    query = query.where(warehouse_id: @warehouse_id) if @warehouse_id
    query.sum(:quantity)
  end

  def fetch_truck_performance
    # Filter trucks by warehouse if selected
    trucks = @company.trucks.active
    trucks = trucks.where(warehouse_id: @warehouse_id) if @warehouse_id

    # For each truck, calculate the total route_revenue in the period
    performance = trucks.map do |truck|
      query = RouteSettlement.where(truck: truck, status: 'completed')
                             .where('date >= ? AND date <= ?', @from_date, @to_date)
      
      { 
        name: truck.plate_number, 
        driver_name: truck.driver&.full_name || 'Sin Chofer',
        revenue: query.sum(:total_revenue).to_f 
      }
    end
    
    # Sort descending by revenue, return top 5
    performance.select { |t| t[:revenue] > 0 }.sort_by { |t| -t[:revenue] }.first(5)
  end

  def fetch_critical_stock
    # Top 5 products with lowest inventory (that are active)
    query = Inventory.joins("INNER JOIN products ON products.id = inventories.item_id AND inventories.item_type = 'Product'")
                     .where(company_id: @company.id, products: { active: true })
    query = query.where(warehouse_id: @warehouse_id) if @warehouse_id
    
    # Group by product, sum quantities, order ascending
    stock_by_product = query.group(:item_id).sum(:quantity)
    
    stock_by_product.map do |product_id, qty|
      product = Product.find(product_id)
      { 
        name: product.name, 
        sku: product.sku,
        stock: qty.to_i 
      }
    end.sort_by { |item| item[:stock] }.first(5)
  end

  def fetch_alerts
    {
      expiring_drivers: expiring_drivers.as_json,
      expired_drivers: expired_drivers.as_json,
      upcoming_birthdays: upcoming_birthdays.as_json
    }
  end

  def upcoming_birthdays
    @company.users.active.where.not(birthday: nil).select do |user|
      next_bday = Date.new(Date.current.year, user.birthday.month, user.birthday.day)
      next_bday = next_bday.next_year if next_bday < Date.current
      (Date.current..(Date.current + 7.days)).cover?(next_bday)
    end.sort_by do |u|
      bday = Date.new(Date.current.year, u.birthday.month, u.birthday.day)
      bday < Date.current ? bday.next_year : bday
    end
  end

  def expiring_drivers
    @company.users.drivers.active
          .where('license_expiration <= ? AND license_expiration >= ?', 30.days.from_now.to_date, Date.current)
          .order(:license_expiration)
  end

  def expired_drivers
    @company.users.drivers.active
          .where('license_expiration < ?', Date.current)
          .order(license_expiration: :desc)
  end
end
