class AddNotesToCustomerAddresses < ActiveRecord::Migration[8.1]
  def change
    add_column :customer_addresses, :notes, :text
  end
end
