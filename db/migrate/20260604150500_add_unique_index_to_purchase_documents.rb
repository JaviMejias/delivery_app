class AddUniqueIndexToPurchaseDocuments < ActiveRecord::Migration[8.1]
  def change
    add_index :purchase_documents, [:company_id, :supplier_id, :document_type, :document_number], unique: true, name: "index_purchase_documents_uniqueness", where: "document_number IS NOT NULL AND document_number != '' AND status != 3"
  end
end
