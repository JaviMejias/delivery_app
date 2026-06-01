class Api::V1::GeocodingController < ApplicationController
  skip_before_action :authenticate_user!, raise: false
  skip_before_action :require_admin!, raise: false

  def search
    query = params[:q]
    return render json: [] if query.blank?

    url = "https://photon.komoot.io/api/?q=#{URI.encode_www_form_component(query)}&limit=5"
    response = fetch_from_photon(url)
    results = (response['features'] || []).map do |f|
      prop = f['properties']
      coord = f['geometry']['coordinates'] # [lon, lat]
      display_name = [prop['name'], prop['street'], prop['city'], prop['state']].compact.reject(&:empty?).join(', ')
      {
        lat: coord[1],
        lon: coord[0],
        display_name: display_name.presence || 'Ubicación Desconocida'
      }
    end

    render json: results
  end

  def reverse
    lat = params[:lat]
    lon = params[:lon]
    return render json: {} if lat.blank? || lon.blank?

    url = "https://photon.komoot.io/reverse?lon=#{lon}&lat=#{lat}"
    response = fetch_from_photon(url)
    feature = (response['features'] || []).first
    if feature
      prop = feature['properties']
      street_parts = [prop['street'], prop['housenumber']].compact.reject(&:empty?).join(' ')
      name_or_street = street_parts.presence || prop['name']
      
      parts = [name_or_street, prop['city'], prop['state']].compact.reject(&:empty?)
      display_name = parts.join(', ')
      
      render json: { display_name: display_name.presence || 'Dirección Desconocida' }
    else
      render json: {}
    end
  end

  private

  def fetch_from_photon(url)
    require 'net/http'
    require 'uri'

    uri = URI.parse(url)
    request = Net::HTTP::Get.new(uri)
    request['User-Agent'] = 'StockFlow/1.0 (contacto@stockflow.com)' 

    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(request)
    end

    JSON.parse(response.body) rescue {}
  end
end
