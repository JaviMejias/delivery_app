class AddAvailableInAppToProducts < ActiveRecord::Migration[8.1]
  def change
    add_column :products, :available_in_app, :boolean, default: true
  end
end
