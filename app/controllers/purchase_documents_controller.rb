class PurchaseDocumentsController < ApplicationController
  before_action :require_inventory_access!
  def index
    documents = PurchaseDocument.includes(:supplier, :purchase_order).order(created_at: :desc)

    if params[:search].present?
      q = "%#{params[:search]}%"
      documents = documents.joins(:supplier).where("purchase_documents.document_number ILIKE ? OR suppliers.name ILIKE ?", q, q)
    end

    start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
    end_date = params[:end_date].present? ? Date.parse(params[:end_date]) : Date.today

    documents = documents.where(issue_date: start_date..end_date)

    if params[:format] == "xlsx"
      send_data ExportPurchaseDocumentsService.new(documents, params[:theme]).to_xlsx, filename: "facturas-#{Date.today}.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else
      pagy, records = pagy(:offset, documents, limit: 20)
      records_json = records.map do |doc|
        json = doc.as_json(include: [ :supplier, :purchase_order ])
        json["file_url"] = doc.files.attached? ? rails_blob_path(doc.files.first, only_path: true) : nil
        json
      end

      render inertia: "Purchases/Documents/Index", props: {
        documents: records_json,
        pagination: extract_pagy(pagy),
        currentSearch: params[:search],
        suppliers: Supplier.active.ordered_by_name.as_json,
        available_invoices: PurchaseDocument.where(document_type: :invoice, status: [ :pending, :partial, :paid ]).select(:id, :document_number, :supplier_id, :total_amount).as_json,
        purchase_orders: PurchaseOrder.includes(purchase_order_items: :product)
                                      .where(status: :received)
                                      .where.not(id: PurchaseDocument.where.not(status: :voided).where.not(purchase_order_id: nil).select(:purchase_order_id))
                                      .order(created_at: :desc)
                                      .limit(50)
                                      .as_json(include: [ :supplier, { purchase_order_items: { include: :product } } ])
      }
    end
  end

  def new
    suppliers = Supplier.active.ordered_by_name
    purchase_orders = PurchaseOrder.includes(purchase_order_items: :product).order(created_at: :desc).limit(50)

    po = nil
    if params[:purchase_order_id].present?
      po = PurchaseOrder.find(params[:purchase_order_id])
    end

    render inertia: "Purchases/Documents/Form", props: {
      suppliers: suppliers,
      purchase_orders: purchase_orders.as_json(include: [ :supplier, { purchase_order_items: { include: :product } } ]),
      initialData: {
        supplier_id: po&.supplier_id || "",
        purchase_order_id: po&.id || "",
        document_number: "",
        document_type: "invoice",
        issue_date: Date.today.to_s,
        due_date: (Date.today + 30.days).to_s,
        net_amount: po ? po.net_total : 0,
        tax_amount: po ? po.tax_total : 0,
        total_amount: po ? po.total : 0,
        status: "pending"
      }
    }
  end

  def create
    doc = PurchaseDocument.new(document_params)
    
    if doc.purchase_order_id.present?
      po = doc.purchase_order
      doc.supplier_id ||= po.supplier_id
      doc.net_amount = po.net_total if doc.net_amount.blank? || doc.net_amount == 0
      doc.tax_amount = po.tax_total if doc.tax_amount.blank? || doc.tax_amount == 0
      doc.total_amount = po.total if doc.total_amount.blank? || doc.total_amount == 0
      doc.issue_date ||= Date.today
      doc.due_date ||= Date.today + 30.days
    end

    if doc.document_number.blank?
      doc.status = :draft
      doc.total_amount = doc.total_amount || 0
    end

    if doc.save
      redirect_to purchase_document_path(doc), notice: "Documento en borrador creado."
    else
      redirect_to purchase_documents_path, alert: "Error al registrar: #{doc.errors.full_messages.join(', ')}"
    end
  end


  def update
    doc = PurchaseDocument.find(params[:id])

    if params[:files].present?
      files_array = params[:files].is_a?(ActionController::Parameters) || params[:files].is_a?(Hash) ? params[:files].values : params[:files]
      doc.files.attach(files_array)
    elsif params[:file].present?
      doc.files.attach(params[:file])
    end

    doc.assign_attributes(document_params.except(:file))
    
    if doc.purchase_order_id_changed? && doc.purchase_order_id.present?
      po = doc.purchase_order
      doc.supplier_id = po.supplier_id
      doc.net_amount = po.net_total
      doc.tax_amount = po.tax_total
      doc.total_amount = po.total
    elsif doc.purchase_order_id_changed? && doc.purchase_order_id.blank?
      doc.net_amount = 0
      doc.tax_amount = 0
      doc.total_amount = 0
    end

    if doc.save
      redirect_to request.referer || purchase_document_path(doc), notice: "Cabecera guardada correctamente."
    else
      redirect_to request.referer || purchase_document_path(doc), alert: "Error al actualizar: #{doc.errors.full_messages.join(', ')}"
    end
  end

  def show
    doc = PurchaseDocument.includes(:supplier, purchase_document_items: :product, purchase_order: { purchase_order_items: :product }).find(params[:id])
    doc_json = doc.as_json(include: {
      supplier: {},
      purchase_document_items: {
        include: :product
      },
      purchase_order: {
        include: {
          purchase_order_items: {
            include: :product
          }
        }
      }
    })
    doc_json["files"] = doc.files.attached? ? doc.files.map { |f| { id: f.id, url: rails_blob_path(f, only_path: true), filename: f.filename.to_s } } : []

    render inertia: "Purchases/Documents/Show", props: {
      document: doc_json,
      products: Product.active.ordered_by_name.as_json,
      suppliers: Supplier.active.ordered_by_name.as_json,
      available_invoices: PurchaseDocument.where(document_type: :invoice, status: [ :pending, :partial, :paid ], supplier_id: doc.supplier_id).select(:id, :document_number, :total_amount).as_json,
      purchase_orders: PurchaseOrder.includes(purchase_order_items: :product)
                                    .where(status: :received)
                                    .where.not(id: PurchaseDocument.where.not(status: :voided).where.not(id: doc.id).where.not(purchase_order_id: nil).select(:purchase_order_id))
                                    .order(created_at: :desc)
                                    .limit(50)
                                    .as_json(include: [ :supplier, { purchase_order_items: { include: :product } } ])
    }
  end



  def finalize
    doc = PurchaseDocument.find(params[:id])

    if doc.document_number.blank?
      redirect_to request.referer, alert: "Debe asignar un Número de Folio antes de emitir el documento."
      return
    end

    if doc.purchase_document_items.empty? && doc.purchase_order_id.blank?
      redirect_to request.referer, alert: "Debe agregar al menos un ítem al documento."
      return
    end

    if doc.update(status: :pending)
      if doc.purchase_order_id.blank?
        ProcessPurchaseDocumentService.new(doc).process!
      end
      redirect_to request.referer, notice: "Documento emitido correctamente."
    else
      redirect_to request.referer, alert: "Error al emitir: #{doc.errors.full_messages.join(', ')}"
    end
  end

  def void
    doc = PurchaseDocument.find(params[:id])

    if doc.update(status: :voided)
      if doc.purchase_order_id.blank?
        ProcessPurchaseDocumentService.new(doc).reverse!
      end
      redirect_to request.referer, notice: "Documento anulado correctamente."
    else
      redirect_to request.referer, alert: "Error al anular."
    end
  end

  def delete_file
    doc = PurchaseDocument.find(params[:id])
    file = doc.files.find(params[:file_id])
    file.purge
    redirect_to request.referer, notice: "Archivo eliminado."
  end

  def destroy
    doc = PurchaseDocument.find(params[:id])
    if doc.draft?
      doc.destroy
      redirect_to purchase_documents_path, notice: "Borrador eliminado correctamente."
    else
      redirect_to purchase_documents_path, alert: "Solo se pueden eliminar documentos en borrador."
    end
  end

  private

  def document_params
    params.permit(
      :supplier_id, :purchase_order_id, :reference_document_id, :document_number, :document_type,
      :issue_date, :due_date, :net_amount, :tax_amount, :total_amount, :status, :file
    )
  end
end
