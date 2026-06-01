class CreatePurchaseDocumentItems < ActiveRecord::Migration[8.1]
  def change
    create_table :purchase_document_items do |t|
      t.references :purchase_document, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.decimal :quantity
      t.decimal :unit_price
      t.decimal :subtotal
      t.decimal :tax_amount
      t.decimal :total
      t.boolean :has_iva, default: true

      t.timestamps
    end
  end
end
