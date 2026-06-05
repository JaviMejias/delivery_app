class UnifyDriversAndUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :rut, :string
    add_column :users, :phone, :string
    add_column :users, :license_type, :string
    add_column :users, :license_expiration, :date

    execute "UPDATE trucks SET driver_id = NULL"

    remove_foreign_key :trucks, :drivers
    add_foreign_key :trucks, :users, column: :driver_id

    drop_table :drivers
  end
end
