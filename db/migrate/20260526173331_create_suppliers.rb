class CreateSuppliers < ActiveRecord::Migration[8.1]
  def change
    create_table :suppliers do |t|
      t.string :name, null: false
      t.string :rut, null: false
      t.string :contact_email
      t.string :contact_phone

      t.timestamps
    end
  end
end
