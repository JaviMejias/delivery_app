class Customer < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable, authentication_keys: [:login]
  # Support both email and phone for login
  attr_accessor :login

  validates :first_name, :last_name, :phone, presence: true
  validates :phone, uniqueness: { scope: :company_id, message: "ya está registrado en esta empresa" }
  validates :email, uniqueness: { scope: :company_id, message: "ya está registrado en esta empresa", allow_blank: true }

  has_many :customer_addresses, dependent: :destroy
  has_many :customer_orders, dependent: :nullify

  scope :search_by_query, ->(query) {
    return all if query.blank?
    where("first_name ILIKE :q OR last_name ILIKE :q OR phone ILIKE :q OR email ILIKE :q", q: "%#{query}%")
  }

  scope :filter_by_status, ->(status) {
    return all if status.blank? || status == 'all'
    
    blocked_ids = Customer.joins(:customer_orders)
                          .where(customer_orders: { status: :cancelled })
                          .where('customer_orders.updated_at >= GREATEST(?, COALESCE(customers.cancellations_reset_at, ?))', 24.hours.ago, 24.hours.ago)
                          .group('customers.id')
                          .having('COUNT(customer_orders.id) >= 3')
                          .pluck(:id)
                          
    if status == 'blocked'
      where(id: blocked_ids)
    else
      where.not(id: blocked_ids)
    end
  }

  def cancellations_in_last_24h
    start_time = [24.hours.ago, cancellations_reset_at].compact.max
    customer_orders.where(status: :cancelled, updated_at: start_time..Time.current).count
  end

  def self.find_for_database_authentication(warden_conditions)
    conditions = warden_conditions.dup
    if (login = conditions.delete(:login))
      if login.include?('@')
        where(conditions.to_h).where(["lower(email) = :value", { :value => login.downcase }]).first
      else
        digits = login.gsub(/\D/, '')
        if digits.length >= 8
          last_8 = digits.chars.last(8).join
          where(conditions.to_h).where("REGEXP_REPLACE(phone, '\\D', '', 'g') LIKE ?", "%#{last_8}").first
        else
          where(conditions.to_h).where(["phone = :value", { :value => login }]).first
        end
      end
    elsif conditions.has_key?(:phone) || conditions.has_key?(:email)
      where(conditions.to_h).first
    end
  end

  def email_required?
    false
  end

  def email_changed?
    false
  end
end
