class RemoveUnusedMaintenanceFieldsFromTrucks < ActiveRecord::Migration[8.1]
  def change
    remove_column :trucks, :insurance_date, :date
    remove_column :trucks, :next_maintenance_date, :date
  end
end
