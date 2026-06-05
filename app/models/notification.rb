class Notification < ApplicationRecord
  belongs_to :company
  belongs_to :user, optional: true

  validates :title, presence: true
  validates :message, presence: true
  validates :notification_type, presence: true

  scope :unread, -> { where(read_at: nil) }
  scope :recent, -> { order(created_at: :desc) }
end
