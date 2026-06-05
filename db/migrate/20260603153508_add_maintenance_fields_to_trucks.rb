class AddMaintenanceFieldsToTrucks < ActiveRecord::Migration[8.1]
  def change
    add_column :trucks, :technical_revision_date, :date
    add_column :trucks, :circulation_permit_date, :date
    add_column :trucks, :insurance_date, :date
    add_column :trucks, :next_maintenance_date, :date
    add_column :trucks, :current_km, :integer
    add_column :trucks, :next_maintenance_km, :integer
  end
end
