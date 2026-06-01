class AddAcceptsVouchersToProducts < ActiveRecord::Migration[8.1]
  def change
    add_column :products, :accepts_vouchers, :boolean, default: false
  end
end
