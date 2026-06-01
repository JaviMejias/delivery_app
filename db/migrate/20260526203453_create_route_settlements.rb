class CreateRouteSettlements < ActiveRecord::Migration[8.1]
  def change
    create_table :route_settlements do |t|
      t.references :truck, null: false, foreign_key: true
      t.date :date
      t.decimal :total_revenue
      t.integer :status
      t.references :company, null: false, foreign_key: true

      t.timestamps
    end
  end
end
