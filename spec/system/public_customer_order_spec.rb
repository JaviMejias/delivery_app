require 'rails_helper'

RSpec.describe 'Public Customer Order', type: :system do
  let!(:company) { Company.create!(name: 'Test Company', slug: 'test', enable_public_orders: true) }
  let!(:material_category) { MaterialCategory.create!(name: 'Gas', company_id: company.id) }
  let!(:material) { Material.create!(name: 'Cilindro', company_id: company.id, material_category_id: material_category.id) }
  let!(:brand) { Brand.create!(name: 'Brand', company_id: company.id) }
  let!(:product) { Product.create!(name: 'Gas 15kg', company_id: company.id, brand_id: brand.id, material_id: material.id) }

  before do
    # Ensure product is active and visible in app
    product.update!(active: true, available_in_app: true)
  end

  it 'allows a customer to create an order via the public portal', js: true do
    visit public_order_new_path(company_slug: company.slug)

    # 1. Start the order
    expect(page).to have_content('Bienvenido a Test Company')
    click_button 'Continuar como Invitado'

    # 2. Confirm Location
    expect(page).to have_content('Selecciona tu ubicación')
    click_button 'Confirmar Ubicación'

    # Wait for the product selection to appear
    expect(page).to have_content('PASO 2 DE 4')

    # 3. Fill personal information
    # In step 2, the user enters Name, Phone, and Address
    fill_in 'Nombre y Apellido', with: 'Juan Perez'
    find('input[type="tel"]').set('912345678')
    fill_in 'Dirección exacta (Ej: Av. Principal 123)', with: 'Calle Falsa 123'
    fill_in 'Nota (Ej: Timbre malo, dejar en portería)', with: 'Timbre malo'

    # Click continue
    click_button 'Siguiente Paso'

    # 4. Select product
    expect(page).to have_content('PASO 3 DE 4')
    expect(page).to have_content('Gas 15kg')

    # We look for the product name and click the '+' button (the second button in the group)
    product_container = find('p', text: 'Gas 15kg').find(:xpath, '../..')
    product_container.all('button').last.click

    # Click continue/next step
    click_button 'Siguiente Paso'

    # 5. Confirm order
    expect(page).to have_content('PASO 4 DE 4')
    click_button 'Confirmar Pedido'

    # 6. Success screen
    expect(page).to have_content('¡Pedido Enviado!')

    # Verify in database
    expect(CustomerOrder.count).to eq(1)
    order = CustomerOrder.last
    expect(order.client_name).to eq('Juan Perez')
    expect(order.address).to eq('Calle Falsa 123')
    expect(order.details['items'].first['name']).to eq('Gas 15kg')
  end
end
