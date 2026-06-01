class CreateBrands < ActiveRecord::Migration[8.1]
  def change
    create_table :brands do |t|
      t.string :name, null: false

      t.timestamps
    end
  end
end
