class Company < ApplicationRecord
  include RutFormatter
  has_many :company_memberships, dependent: :destroy
  has_many :users, through: :company_memberships
  has_one_attached :logo
  has_many :stock_movements, dependent: :destroy
  has_many :stock_transfers, dependent: :destroy
  has_many :local_sales, dependent: :destroy
  has_many :local_closures, dependent: :destroy
  has_many :price_lists, dependent: :destroy
  has_many :customer_orders, dependent: :destroy
  has_many :products, dependent: :destroy
  has_many :brands, dependent: :destroy
  has_many :trucks, dependent: :destroy
  has_many :notifications, dependent: :destroy
  has_many :warehouses, dependent: :destroy
  has_many :materials, dependent: :destroy
  has_many :material_categories, dependent: :destroy
  has_many :company_phones, dependent: :destroy
  accepts_nested_attributes_for :company_phones, allow_destroy: true

  validates :name, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :slug, uniqueness: true, allow_nil: true

  before_validation :generate_slug, on: :create

  private

  def generate_slug
    if slug.blank? && name.present?
      base_slug = name.parameterize
      self.slug = base_slug
      counter = 1
      while Company.exists?(slug: self.slug)
        self.slug = "#{base_slug}-#{counter}"
        counter += 1
      end
    end
  end
end
