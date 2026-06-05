class User < ApplicationRecord
  devise :database_authenticatable, :recoverable, :rememberable, :validatable
  belongs_to :current_company, class_name: "Company", optional: true
  has_many :company_memberships, dependent: :destroy
  has_many :companies, through: :company_memberships
  before_validation :generate_driver_credentials, on: :create
  has_many :notifications, dependent: :destroy
  enum :role, { admin: 0, warehouse_keeper: 1, driver: 2, cashier: 3 }, default: :admin
  validates :first_name, :last_name, presence: true
  validates :role, presence: true
  validates :rut, presence: true, if: -> { role == "driver" }
  scope :active, -> { where(active: true) }
  scope :drivers, -> { where(role: :driver) }
  scope :warehouse_keepers, -> { where(role: :warehouse_keeper) }
  def full_name
    "#{first_name} #{last_name}"
  end

  def admin?
    role == "admin"
  end

  def active_for_authentication?
    super && active?
  end

  def inactive_message
    active? ? super : :account_inactive
  end

  private

  def generate_driver_credentials
    if role == "driver"
      if email.blank? && rut.present?
        clean_rut = rut.gsub(/[^0-9kK]/, "").downcase
        self.email = "#{clean_rut}@gmail.com"
      end
      if password.blank?
        generated_password = SecureRandom.hex(8)
        self.password = generated_password
        self.password_confirmation = generated_password
      end
    end
  end
end
