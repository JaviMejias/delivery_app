require_relative 'config/environment'

puts "Formateando Telefonos..."

[ Supplier, Driver ].each do |klass|
  puts "Procesando #{klass.name}..."
  klass.find_each do |record|
    record.valid? # triggers before_validation clean_phone
    if record.has_attribute?(:phone) && record.phone.present?
      record.update_column(:phone, record.phone)
    end
    if record.has_attribute?(:contact_phone) && record.contact_phone.present?
      record.update_column(:contact_phone, record.contact_phone)
    end
  end
end

puts "¡Listo!"
