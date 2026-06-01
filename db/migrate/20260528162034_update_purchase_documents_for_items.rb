class UpdatePurchaseDocumentsForItems < ActiveRecord::Migration[8.1]
  def change
    change_column_null :purchase_documents, :supplier_id, true
    change_column_null :purchase_documents, :document_number, true
  end
end
