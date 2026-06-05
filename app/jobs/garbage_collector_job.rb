class GarbageCollectorJob < ApplicationJob
  queue_as :background

  def perform
    # Buscamos y eliminamos notificaciones más antiguas de 14 días.
    # Usamos in_batches para no saturar la memoria si hay miles de registros.
    deleted = Notification.where('created_at < ?', 14.days.ago).in_batches.destroy_all
    
    Rails.logger.info "[GarbageCollectorJob] Se eliminaron notificaciones antiguas (> 14 dias)."
  end
end
