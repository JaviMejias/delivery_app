class Api::OmniSearchController < ApplicationController
  def index
    query = params[:q].to_s.strip
    return render json: { results: [] } if query.length < 2

    clean_q = query.gsub(/[^A-Za-z0-9]/, '').upcase
    like_q = "%#{query}%"

    results = []

    # 1. Trucks
    trucks = Truck.where(company_id: current_tenant.id).left_joins(:driver).where(
      "REPLACE(UPPER(trucks.plate_number), '-', '') LIKE :clean_q OR " \
      "REPLACE(REPLACE(UPPER(users.rut), '.', ''), '-', '') LIKE :clean_q OR " \
      "users.first_name ILIKE :like_q OR " \
      "users.last_name ILIKE :like_q",
      clean_q: "%#{clean_q}%", like_q: like_q
    ).limit(4)

    trucks.each do |t|
      results << { type: 'truck', title: "Camión #{t.plate_number}", subtitle: t.driver ? t.driver.full_name : 'Sin Chofer', is_active: t.active, id: t.id }
    end

    role_names = { 'admin' => 'Administrador', 'warehouse_keeper' => 'Bodeguero', 'driver' => 'Chofer', 'cashier' => 'Cajero' }

    # 2. Users
    users = current_tenant.users.where(
      "first_name ILIKE :q OR last_name ILIKE :q OR email ILIKE :q OR REPLACE(REPLACE(UPPER(rut), '.', ''), '-', '') LIKE :clean_q",
      q: like_q, clean_q: "%#{clean_q}%"
    ).limit(3)

    users.each do |u|
      results << { type: 'user', title: u.full_name, subtitle: "#{role_names[u.role] || u.role.humanize} - #{u.email || u.rut}", id: u.id }
    end

    # 3. Customers
    customers = Customer.where(company_id: current_tenant.id).where(
      "first_name ILIKE :q OR last_name ILIKE :q OR email ILIKE :q OR phone ILIKE :q",
      q: like_q
    ).limit(3)

    customers.each do |c|
      results << { type: 'customer', title: "#{c.first_name} #{c.last_name}".strip, subtitle: c.phone || c.email, id: c.id }
    end

    # 4. Orders (CustomerOrders)
    if CustomerOrder.table_exists?
      order_statuses = {
        'pending' => 'Pendiente',
        'accepted' => 'Aceptado',
        'in_transit' => 'En Tránsito',
        'completed' => 'Completado',
        'cancelled' => 'Cancelado',
        'nearby' => 'Cerca',
        'arrived' => 'Llegó al destino'
      }
      orders = CustomerOrder.where(company_id: current_tenant.id).where(
        "client_name ILIKE :q OR address ILIKE :q OR order_token ILIKE :q",
        q: like_q
      ).limit(3)
      orders.each do |o|
        results << { type: 'order', title: "Pedido ##{o.order_token.to_s[0..6].upcase}", subtitle: "#{o.client_name} - #{order_statuses[o.status] || o.status.humanize}", id: o.id, token: o.order_token }
      end
    end

    # 5. Local Sales
    if LocalSale.table_exists?
      sales = LocalSale.where(company_id: current_tenant.id).joins(:warehouse).where(
        "local_sales.id::text ILIKE :q OR ('VTA-' || LPAD(local_sales.id::text, 4, '0')) ILIKE :q OR warehouses.name ILIKE :q",
        q: "%#{query}%"
      ).limit(3)
      sales.each do |s|
        results << { type: 'sale', title: "Venta VTA-#{s.id.to_s.rjust(4, '0')}", subtitle: "Bodega: #{s.warehouse.name} - $#{s.total_revenue.to_i}", id: s.id }
      end
    end

    # 6. Products
    if Product.table_exists?
      products = Product.where(company_id: current_tenant.id).includes(:brand, :material).where(
        "products.name ILIKE :q OR products.sku ILIKE :q",
        q: like_q
      ).limit(4)
      
      if products.any? && Inventory.table_exists?
        product_ids = products.map(&:id)
        material_ids = products.map(&:material_id).compact

        full_stock = Inventory.where(company_id: current_tenant.id, item_type: "Product", item_id: product_ids).group(:item_id).sum(:quantity)
        empty_stock = Inventory.where(company_id: current_tenant.id, item_type: "Material", item_id: material_ids).group(:item_id).sum(:quantity)

        products.each do |p|
          s_full = full_stock[p.id].to_i
          s_empty = empty_stock[p.material_id].to_i
          subtitle = "Llenos: #{s_full} | Vacíos: #{s_empty} | #{p.brand&.name || 'Genérica'}"
          results << { type: 'product', title: p.name, subtitle: subtitle, id: p.id }
        end
      else
        products.each do |p|
          results << { type: 'product', title: p.name, subtitle: "SKU: #{p.sku.presence || 'Sin SKU'} | Marca: #{p.brand&.name || 'Genérica'}", id: p.id }
        end
      end
    end

    # 7. Brands
    if Brand.table_exists?
      brands = Brand.where(company_id: current_tenant.id).where("name ILIKE :q", q: like_q).limit(3)
      brands.each do |b|
        results << { type: 'brand', title: b.name, subtitle: 'Marca Registrada', id: b.id }
      end
    end

    # 8. Warehouses
    if Warehouse.table_exists?
      warehouses = Warehouse.where(company_id: current_tenant.id).where("name ILIKE :q", q: like_q).limit(3)
      warehouses.each do |w|
        results << { type: 'warehouse', title: w.name, subtitle: "Instalación", id: w.id }
      end
    end

    # ================= 3 LETTERS OR MORE =================
    if query.length >= 3
      # 9. Suppliers
      if Supplier.table_exists?
        suppliers = Supplier.where(company_id: current_tenant.id).where("name ILIKE :q OR REPLACE(REPLACE(UPPER(rut), '.', ''), '-', '') LIKE :clean_q", q: like_q, clean_q: "%#{clean_q}%").limit(3)
        suppliers.each do |s|
          results << { type: 'supplier', title: s.name, subtitle: s.rut, id: s.id }
        end
      end

      # 10. Purchase Orders
      if PurchaseOrder.table_exists?
        orders = PurchaseOrder.where(company_id: current_tenant.id).joins(:supplier).where("purchase_orders.id::text ILIKE :q OR suppliers.name ILIKE :q", q: "%#{query}%").limit(3)
        orders.each do |o|
          results << { type: 'purchase_order', title: "Orden de Compra OC-#{o.id}", subtitle: "#{o.supplier.name} - #{o.status.humanize}", id: o.id }
        end
      end

      # 11. Purchase Documents
      if PurchaseDocument.table_exists?
        pdocs = PurchaseDocument.where(company_id: current_tenant.id).joins("LEFT JOIN suppliers ON suppliers.id = purchase_documents.supplier_id").where("purchase_documents.document_number ILIKE :q OR suppliers.name ILIKE :q", q: "%#{query}%").limit(3)
        pdocs.each do |pd|
          results << { type: 'purchase_document', title: "Doc. Compra #{pd.document_number}", subtitle: "#{pd.supplier&.name || 'Sin Proveedor'} - $#{pd.total_amount.to_i}", id: pd.id, token: pd.document_number }
        end
      end

      # 12. Treasury Expenses
      if TreasuryExpense.table_exists?
        expenses = TreasuryExpense.where(company_id: current_tenant.id).where("REPLACE(UPPER(reference_number), '-', '') LIKE :clean_q OR reference_number ILIKE :q OR notes ILIKE :q OR REPLACE(UPPER(notes), '-', '') LIKE :clean_q", q: like_q, clean_q: "%#{clean_q}%").limit(3)
        expenses.each do |te|
          results << { type: 'expense', title: "Egreso: #{te.reference_number || 'Sin Ref'}", subtitle: "$#{te.amount.to_i} - #{te.notes.to_s.truncate(40)}", id: te.id }
        end
      end

      # 13. Treasury Incomes
      if TreasuryIncome.table_exists?
        incomes = TreasuryIncome.where(company_id: current_tenant.id).where("payment_method ILIKE :q", q: like_q).limit(3)
        incomes.each do |ti|
          results << { type: 'income', title: "Ingreso - #{ti.payment_method.humanize}", subtitle: "$#{ti.amount.to_i} - #{ti.date}", id: ti.id }
        end
      end

      # 14. Local Closures
      if LocalClosure.table_exists?
        closures = LocalClosure.where(company_id: current_tenant.id).joins(:warehouse).where("local_closures.date::text ILIKE :q OR warehouses.name ILIKE :q", q: "%#{query}%").limit(3)
        closures.each do |lc|
          results << { type: 'closure', title: "Cierre #{lc.date}", subtitle: "Bodega: #{lc.warehouse.name} - Estado: #{lc.status.humanize}", id: lc.id }
        end
      end

      # 15. Route Settlements
      if RouteSettlement.table_exists?
        settlements = RouteSettlement.where(company_id: current_tenant.id).joins(:truck).where("REPLACE(UPPER(trucks.plate_number), '-', '') LIKE :clean_q OR route_settlements.id::text ILIKE :q", q: "%#{query}%", clean_q: "%#{clean_q}%").limit(3)
        settlements.each do |rs|
          results << { type: 'settlement', title: "Rendición RUTA-#{rs.id}", subtitle: "Camión #{rs.plate_number rescue rs.truck&.plate_number} - $#{rs.total_revenue.to_i}", id: rs.id }
        end
      end
    end

    render json: { results: results }
  end
end
