import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WeatherResponse } from '../models/weather.model';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private readonly WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/onecall';

  constructor(private http: HttpClient) {}

  /**
   * Get weather data for a specific location using OpenWeatherMap One Call API
   * @param lat Latitude of the location
   * @param lon Longitude of the location
   * @returns Observable of weather data
   */
  getWeather(lat: number, lon: number): Observable<WeatherResponse> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('units', 'metric')
      .set('exclude', 'minutely,alerts')
      .set('appid', environment.openWeather.apiKey);

    return this.http.get<WeatherResponse>(this.WEATHER_API_URL, { params });
  }
}

