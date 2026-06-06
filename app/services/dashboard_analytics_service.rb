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
      alerts: fetch_alerts,
      payment_methods: fetch_payment_methods,
      seven_day_trends: fetch_seven_day_trends
    }
  end

  private

  def parse_date(date_str, default_date)
    date_str.present? ? Date.parse(date_str) : default_date
  rescue ArgumentError
    default_date
  end

  def fetch_warehouses
    Warehouse.where(company_id: @company.id).includes(:truck).map do |w|
      { id: w.id, name: w.name, is_truck: w.truck.present? }
    end
  end

  def fetch_stats
    route_revenue = calculate_route_revenue
    local_revenue = calculate_local_revenue

    # Gastos Operativos del Período (usando @from_date y @to_date)
    query_expenses_period = RouteSettlementExpense.joins(:route_settlement)
                                                  .where(route_settlements: { company_id: @company.id, status: "completed" })
                                                  .where("route_settlements.date >= ? AND route_settlements.date <= ?", @from_date, @to_date)
    
    query_expenses_period = query_expenses_period.joins(route_settlement: :truck).where(trucks: { warehouse_id: @warehouse_id }) if @warehouse_id
    total_expenses_period = query_expenses_period.sum(:amount)

    {
      total_sales_period: route_revenue + local_revenue,
      route_revenue: route_revenue,
      local_revenue: local_revenue,
      total_expenses_period: total_expenses_period
    }
  end

  def calculate_route_revenue
    query = RouteSettlement.where(company_id: @company.id, status: "completed")
                           .where("date >= ? AND date <= ?", @from_date, @to_date)

    query = query.joins(:truck).where(trucks: { warehouse_id: @warehouse_id }) if @warehouse_id
    query.sum(:total_revenue)
  end

  def calculate_local_revenue
    query = LocalSale.where(company_id: @company.id, status: "completed")
                     .where("local_sales.created_at >= ? AND local_sales.created_at <= ?", @from_date.beginning_of_day, @to_date.end_of_day)

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
    base_qty = query.sum(:quantity)

    projected_empties = projected_unsettled_orders(material.id)
    base_qty + projected_empties
  end

  def calculate_filled_inventory(material_id)
    products_of_mat = Product.where(material_id: material_id)
    query = Inventory.where(company_id: @company.id, item: products_of_mat)
    query = query.where(warehouse_id: @warehouse_id) if @warehouse_id
    base_qty = query.sum(:quantity)

    projected_fulls = projected_unsettled_orders(material_id)
    [base_qty - projected_fulls, 0].max
  end

  def projected_unsettled_orders(material_id)
    product_ids_for_material = Product.where(material_id: material_id).pluck(:id).to_set
    
    trucks = @company.trucks.active
    trucks = trucks.where(warehouse_id: @warehouse_id) if @warehouse_id
    return 0 if trucks.empty?

    total = 0
    trucks.each do |truck|
      last_settlement = RouteSettlement.where(truck_id: truck.id, status: "completed").order(updated_at: :desc).first
      
      orders_query = CustomerOrder.where(company_id: @company.id, truck_id: truck.id, status: :completed)
      
      if last_settlement
        orders_query = orders_query.where("updated_at > ?", last_settlement.updated_at)
      else
        orders_query = orders_query.where("updated_at >= ?", Date.current.beginning_of_day)
      end

      orders_query.find_each do |order|
        items = order.details["items"] || []
        items.each do |item|
          p_id = (item["id"] || item["product_id"]).to_i
          if product_ids_for_material.include?(p_id)
            total += item["quantity"].to_i
          end
        end
      end
    end
    total
  end

  def fetch_truck_performance
    # Filter trucks by warehouse if selected
    trucks = @company.trucks.active
    trucks = trucks.where(warehouse_id: @warehouse_id) if @warehouse_id

    # For each truck, calculate the total route_revenue and expenses in the period
    performance = trucks.map do |truck|
      query = RouteSettlement.where(truck: truck, status: "completed")
                             .where("date >= ? AND date <= ?", @from_date, @to_date)

      expenses = RouteSettlementExpense.where(route_settlement_id: query.select(:id)).sum(:amount)

      {
        name: truck.plate_number,
        driver_name: truck.driver&.full_name || "Sin Chofer",
        revenue: query.sum(:total_revenue).to_f,
        expenses: expenses.to_f
      }
    end

    # Sort descending by revenue, return top 5
    performance.select { |t| t[:revenue] > 0 || t[:expenses] > 0 }.sort_by { |t| -t[:revenue] }.first(5)
  end

  def fetch_critical_stock
    query = Inventory.joins("INNER JOIN products ON products.id = inventories.item_id AND inventories.item_type = 'Product'")
                     .where(company_id: @company.id, products: { active: true })
    query = query.where(warehouse_id: @warehouse_id) if @warehouse_id

    stock_by_product = query.group(:item_id).sum(:quantity)
    products = Product.where(id: stock_by_product.keys).index_by(&:id)

    critical_items = []
    stock_by_product.each do |product_id, qty|
      product = products[product_id]
      next unless product
      
      threshold = product.critical_stock_threshold || 20
      
      if qty <= threshold
        critical_items << {
          name: product.name,
          sku: product.sku,
          stock: qty.to_i,
          threshold: threshold,
          ratio: qty.to_f / threshold.to_f
        }
      end
    end

    critical_items.sort_by { |item| item[:ratio] }.first(5)
  end

  def fetch_alerts
    {
      expiring_drivers: expiring_drivers.as_json,
      expired_drivers: expired_drivers.as_json,
      upcoming_birthdays: upcoming_birthdays.as_json,
      maintenance_trucks: maintenance_trucks.as_json
    }
  end

  def maintenance_trucks
    @company.trucks.active
            .where("next_maintenance_km IS NOT NULL AND current_km IS NOT NULL AND (next_maintenance_km - current_km) <= 1000")
            .order(current_km: :desc)
            .select(:id, :plate_number, :current_km, :next_maintenance_km)
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
          .where("license_expiration <= ? AND license_expiration >= ?", 30.days.from_now.to_date, Date.current)
          .order(:license_expiration)
  end

  def expired_drivers
    @company.users.drivers.active
          .where("license_expiration < ?", Date.current)
          .order(license_expiration: :desc)
  end

  def fetch_payment_methods
    # Recaudación de LocalSales
    local_sales = LocalSale.where(company_id: @company.id, status: "completed")
                           .where("created_at >= ? AND created_at <= ?", @from_date.beginning_of_day, @to_date.end_of_day)
    local_sales = local_sales.where(warehouse_id: @warehouse_id) if @warehouse_id

    # Recaudación de RouteSettlements
    route_settlements = RouteSettlement.where(company_id: @company.id, status: "completed")
                                       .where("date >= ? AND date <= ?", @from_date, @to_date)
    route_settlements = route_settlements.joins(:truck).where(trucks: { warehouse_id: @warehouse_id }) if @warehouse_id

    cash = local_sales.sum(:cash_revenue) + route_settlements.sum(:cash_revenue)
    card = local_sales.sum(:card_revenue) + route_settlements.sum(:card_revenue)
    transfer = local_sales.sum(:transfer_revenue) + route_settlements.sum(:transfer_revenue)
    voucher = local_sales.sum(:voucher_revenue) # RouteSettlements no tienen voucher_revenue en este schema

    [
      { name: "Efectivo", value: cash.to_f, fill: "#10b981" },
      { name: "Tarjeta", value: card.to_f, fill: "#3b82f6" },
      { name: "Transferencia", value: transfer.to_f, fill: "#8b5cf6" },
      { name: "Vale/Voucher", value: voucher.to_f, fill: "#f59e0b" }
    ].reject { |m| m[:value] == 0 }
  end

  def fetch_seven_day_trends
    trends = []
    7.downto(0) do |i|
      date = Date.current - i.days

      # Ingresos del día
      local = LocalSale.where(company_id: @company.id, status: "completed", date: date)
      local = local.where(warehouse_id: @warehouse_id) if @warehouse_id
      
      route = RouteSettlement.where(company_id: @company.id, status: "completed", date: date)
      route = route.joins(:truck).where(trucks: { warehouse_id: @warehouse_id }) if @warehouse_id

      daily_revenue = local.sum(:total_revenue) + route.sum(:total_revenue)

      # Gastos del día
      expenses_query = RouteSettlementExpense.joins(:route_settlement)
                                             .where(route_settlements: { company_id: @company.id, status: "completed", date: date })
      expenses_query = expenses_query.joins(route_settlement: :truck).where(trucks: { warehouse_id: @warehouse_id }) if @warehouse_id
      daily_expenses = expenses_query.sum(:amount)

      trends << {
        date: date.strftime("%d/%m"),
        ingresos: daily_revenue.to_f,
        gastos: daily_expenses.to_f
      }
    end
    trends
  end
end
