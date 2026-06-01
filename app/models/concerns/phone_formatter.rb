module PhoneFormatter
  extend ActiveSupport::Concern

  included do
    before_validation :clean_phone
  end

  def clean_phone
    if self.has_attribute?(:phone) && self.phone.present?
      cleaned = self.phone.to_s.gsub(/\s+/, '')
      self.phone = ['+569', '+56', '+'].include?(cleaned) ? nil : cleaned
    end
    if self.has_attribute?(:contact_phone) && self.contact_phone.present?
      cleaned = self.contact_phone.to_s.gsub(/\s+/, '')
      self.contact_phone = ['+569', '+56', '+'].include?(cleaned) ? nil : cleaned
    end
  end
end
