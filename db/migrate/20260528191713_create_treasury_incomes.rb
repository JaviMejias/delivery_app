class CreateTreasuryIncomes < ActiveRecord::Migration[8.1]
  def change
    create_table :treasury_incomes do |t|
      t.references :company, null: false, foreign_key: true
      t.date :date
      t.decimal :amount, precision: 12, scale: 2, default: "0.0"
      t.string :payment_method
      t.references :source, polymorphic: true, null: false

      t.timestamps
    end
  end
end
