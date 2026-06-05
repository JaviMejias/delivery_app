class TruckMaintenanceAlertsService
  def self.call
    Company.find_each do |company|
      new(company).call
    end
  end

  def initialize(company)
    @company = company
  end

  def call
    @company.trucks.active.find_each do |truck|
      check_date(truck, :technical_revision_date, "Revisión Técnica")
      check_date(truck, :circulation_permit_date, "Permiso de Circulación y SOAP")
      check_km(truck)
    end
    check_mileage_updates
  end

  private

  def check_mileage_updates
    manual_trucks = @company.trucks.active.where(has_gps: false)
    return if manual_trucks.empty?

    unless Notification.where(company: @company, title: "Actualización de Kilometraje", read_at: nil).where("created_at >= ?", Date.today.beginning_of_day).exists?
        Notification.create!(
          company: @company,
          title: "Actualización de Kilometraje",
          message: "Tienes camiones sin GPS que requieren actualización de kilometraje.",
          notification_type: "info",
          action_url: "/trucks?action=update_mileage"
        )
      end
  end

  def check_date(truck, field, name)
    date = truck.public_send(field)
    return unless date

    days_left = (date - Date.today).to_i

    if days_left < 0
      create_alert(truck, "danger", "El #{name} de #{truck.plate_number} ha VENCIDO.")
    elsif days_left == 0
      create_alert(truck, "danger", "El #{name} de #{truck.plate_number} vence HOY.")
    elsif days_left <= 30
      # Only alert on exactly 30, 15, 7, 3, 2, 1 days to avoid daily spam, or just alert once and keep it unread
      if [30, 15, 7, 3, 2, 1].include?(days_left)
        create_alert(truck, "warning", "El #{name} de #{truck.plate_number} vence en #{days_left} días (#{date.strftime('%d/%m/%Y')}).")
      end
    end
  end

  def check_km(truck)
    return unless truck.current_km.present? && truck.next_maintenance_km.present?

    km_left = truck.next_maintenance_km - truck.current_km

    if km_left <= 0
      create_alert(truck, "danger", "El camión #{truck.plate_number} superó el kilometraje para su mantención preventiva.")
    elsif km_left <= 1000
      last_notification = Notification.where(company: @company, notification_type: ["warning", "danger"])
                                      .where("title LIKE ?", "%#{truck.plate_number}%")
                                      .where("message LIKE ?", "%kilometraje%")
                                      .where(read_at: nil).exists?
      
      unless last_notification
        create_alert(truck, "warning", "El camión #{truck.plate_number} está a #{km_left} km de su próxima mantención preventiva.")
      end
    end
  end

  def create_alert(truck, type, message)
    # Check if this exact message is already unread to avoid spam
    return if Notification.where(company: @company, message: message, read_at: nil).exists?

    Notification.create!(
      company: @company,
      title: "Alerta de Flota: #{truck.plate_number}",
      message: message,
      notification_type: type,
      action_url: "/trucks/#{truck.id}/edit"
    )
  end
end
