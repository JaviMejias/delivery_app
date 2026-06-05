class UpdateProductPricesForDynamicLists < ActiveRecord::Migration[8.1]
  def up
    add_reference :product_prices, :price_list, foreign_key: true, null: true

    Company.find_each do |company|
      pl_wh = company.price_lists.find_or_create_by!(name: 'Bodega Local', code: 'warehouse', active: true)
      pl_tr = company.price_lists.find_or_create_by!(name: 'Venta en Camión', code: 'truck', active: true)
      pl_ws = company.price_lists.find_or_create_by!(name: 'Mayorista', code: 'wholesale', active: true)

      ProductPrice.where(company_id: company.id).where("channel = 0").update_all(price_list_id: pl_wh.id)
      ProductPrice.where(company_id: company.id).where("channel = 1").update_all(price_list_id: pl_tr.id)
      ProductPrice.where(company_id: company.id).where("channel = 2").update_all(price_list_id: pl_ws.id)
    end

    ProductPrice.where(price_list_id: nil).destroy_all

    change_column_null :product_prices, :price_list_id, false
    remove_column :product_prices, :channel
  end

  def down
    add_column :product_prices, :channel, :integer

    ProductPrice.joins(:price_list).find_each do |pp|
      case pp.price_list.code
      when 'warehouse' then pp.update_columns(channel: 0)
      when 'truck' then pp.update_columns(channel: 1)
      when 'wholesale' then pp.update_columns(channel: 2)
      else pp.update_columns(channel: 0)
      end
    end

    remove_reference :product_prices, :price_list
  end
end
