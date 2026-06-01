Rails.application.routes.draw do
  devise_for :customers
  # Devise routes for authentication
  devise_for :users, path: "", path_names: {
    sign_in: "login",
    sign_out: "logout"
  }, controllers: {
    sessions: "users/sessions"
  }

  # Authenticated routes
  authenticated :user do
    root "dashboard#show", as: :authenticated_root
  end

  # The rest of the routes are protected by authenticate_user! in ApplicationController
  get "dashboard", to: "dashboard#show"

  resources :companies, only: [:index, :create, :update] do
    member do
      post :switch
    end
  end

  # Catalog
  resources :material_categories, path: "catalog/material-categories", except: [ :show ]
  resources :materials, path: "catalog/materials", except: [ :show ]
  resources :brands, path: "catalog/brands", except: [ :show ]
  resources :suppliers, path: "catalog/suppliers", except: [ :show ]
  resources :price_lists, path: "catalog/price-lists", except: [ :show ]
  resources :products, path: "catalog/products" do
    resources :product_prices, only: [ :create, :update, :destroy ], shallow: true
  end

  resources :local_closures, path: "sales/local/closures", only: [:index, :new, :create, :show]

  resources :local_sales, path: "sales/local", only: [ :index, :create ] do
    collection do
      get :pos
    end
  end

  # Logistics
  resources :trucks, only: [ :index, :create, :update ] do
    collection do
      get :map
      get :locations
      post 'cancel_order/:order_id', to: 'trucks#cancel_order'
      post 'assign_order/:order_id', to: 'trucks#assign_order'
    end
    member do
      patch :toggle_active
      patch :remove_driver
      patch :set_destination
      patch :clear_destination
    end
  end

  resources :drivers, only: [ :index, :create, :update ] do
    collection do
      get :search
    end
  end

  resources :customer_orders, path: "logistics/orders", only: [:index]

  resources :customers, only: [:index] do
    member do
      put :unblock
    end
  end

  resources :users, only: [ :index, :create, :update, :destroy ]

  # Inventory & Purchases
  resources :warehouses, path: "inventory/warehouses", except: [ :show ]

  namespace :inventory do
    resources :transfers, controller: "/stock_transfers", only: [ :index, :show, :create, :destroy ] do
      member do
        post :complete
      end
      resources :items, controller: "/stock_transfer_items", only: [ :create, :destroy ]
    end
    resources :adjustments, controller: "/inventory_adjustments", only: [ :new, :create ]
  end

  resources :route_settlements, path: "sales/settlements", only: [ :index, :show, :create, :update ] do
    member do
      post :complete
    end
    resources :items, controller: "route_settlement_items", only: [ :create, :destroy ]
  end

  resources :purchase_orders, path: "purchases/orders" do
    member do
      post :receive
    end
    resources :items, controller: "purchase_order_items", only: [ :create, :destroy ]
  end

  resources :purchase_documents, path: "purchases/documents", except: [:destroy] do
    member do
      patch :mark_as_paid
      patch :finalize
      patch :void
      delete 'delete_file/:file_id', to: 'purchase_documents#delete_file', as: :delete_file
    end
    resources :items, controller: "purchase_document_items", only: [ :create, :update, :destroy ]
  end

  get "inventory/stock", to: "inventories#index", as: :inventory_stock

  # Treasury
  resources :treasury_expenses, path: "treasury/expenses", only: [:index, :new, :create, :show]
  resources :treasury_incomes, path: "treasury/incomes", only: [:index]

  # API de Integracion para GPS Externos (fuera del bloque autenticado de usuario)
  namespace :api, defaults: { format: :json } do
    namespace :v1 do
      post 'gps/update', to: 'gps#update'
      get 'geocode', to: 'geocoding#search'
      get 'reverse_geocode', to: 'geocoding#reverse'
      
      namespace :dispatch do
        resources :orders, only: [:create]
      end
    end
  end


  # Public customer order portal (no auth required)
  scope '/order/:company_slug', as: 'public_order' do
    get '/', to: 'public/customer_orders#new', as: 'new'
    post '/', to: 'public/customer_orders#create', as: 'create'
    get '/history', to: 'public/customer_orders#history', as: 'history'
    get '/track/:token', to: 'public/customer_orders#show', as: 'tracking'
    post '/orders/:id/cancel', to: 'public/customer_orders#cancel', as: 'cancel'

    resources :customer_addresses, only: [:index, :create, :update, :destroy], controller: 'public/customer_addresses' do
      member do
        patch :set_default
      end
    end
    devise_for :customers, 
      module: 'public/customers',
      path: 'auth',
      path_names: {
        sign_in: 'login',
        sign_out: 'logout',
        sign_up: 'register'
      }
  end

  # Driver radar (authenticated driver only)
  namespace :driver do
    get 'radar', to: 'radar#index'
    get 'radar/orders', to: 'radar#orders', as: :radar_orders
    post 'radar/accept/:order_id', to: 'radar#accept_order', as: :accept_radar_order
    post 'radar/complete/:order_id', to: 'radar#complete_order', as: :complete_radar_order
    post 'radar/cancel/:order_id', to: 'radar#cancel_order', as: :cancel_radar_order
    post 'radar/reject_proposal/:order_id', to: 'radar#reject_proposal', as: :reject_radar_proposal
    post 'radar/update_location', to: 'radar#update_location', as: :radar_update_location
  end

  # Unauthenticated root - redirect to login
  devise_scope :user do
    root "users/sessions#new"
  end

  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
end
