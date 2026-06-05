class CreateRouteSettlementExpenses < ActiveRecord::Migration[8.1]
  def change
    create_table :route_settlement_expenses do |t|
      t.references :route_settlement, null: false, foreign_key: true
      t.string :description
      t.decimal :amount
      t.string :payment_method

      t.timestamps
    end
  end
end
