class CreateCompanies < ActiveRecord::Migration[8.1]
  def change
    create_table :companies do |t|
      t.string :name, null: false
      t.string :rut
      t.boolean :active, null: false, default: true

      t.timestamps
    end
  end
end
