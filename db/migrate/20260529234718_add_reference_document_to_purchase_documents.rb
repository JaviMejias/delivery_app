class AddReferenceDocumentToPurchaseDocuments < ActiveRecord::Migration[8.1]
  def change
    add_column :purchase_documents, :reference_document_id, :integer
    add_index :purchase_documents, :reference_document_id
  end
end
