class CreatePurchaseDocuments < ActiveRecord::Migration[8.1]
  def change
    create_table :purchase_documents do |t|
      t.references :company, null: false, foreign_key: true
      t.references :supplier, null: false, foreign_key: true
      t.references :purchase_order, null: true, foreign_key: true
      t.string :document_number
      t.integer :document_type, default: 0
      t.date :issue_date
      t.date :due_date
      t.decimal :net_amount, precision: 12, scale: 2, default: 0
      t.decimal :tax_amount, precision: 12, scale: 2, default: 0
      t.decimal :total_amount, precision: 12, scale: 2, default: 0
      t.integer :status, default: 0

      t.timestamps
    end
  end
end
