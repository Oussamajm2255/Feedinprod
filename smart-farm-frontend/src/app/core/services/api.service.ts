import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';
import { Farm, Device, Sensor, SensorReading, Crop } from '../models/farm.model';
import { ActionLog, ExecuteActionRequest, ListActionsResponse } from '../models/action-log.model';
import { environment } from '../../../environments/environment';
import { AppNotification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}
  // Actions endpoints
  getActions(filters?: {
    limit?: number;
    offset?: number;
    device_id?: string;
    sensor_id?: string;
    trigger_source?: 'auto' | 'manual';
    status?: 'queued' | 'sent' | 'ack' | 'error';
    from?: string;
    to?: string;
  }): Observable<ListActionsResponse> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<ListActionsResponse>(`${this.API_URL}/actions`, { params });
  }

  // Notifications endpoints
  getNotifications(params?: { limit?: number; offset?: number; is_read?: '0' | '1'; level?: string; source?: string; from?: string; to?: string; }) {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(k, String(v));
      });
    }
    return this.http.get<{ items: AppNotification[]; total: number }>(`${this.API_URL}/notifications`, { params: httpParams });
  }

  getNotificationsUnreadCount() {
    return this.http.get<{ count: number }>(`${this.API_URL}/notifications/unread-count`);
  }

  markNotificationsRead(ids: string[]) {
    return this.http.post<{ updated: number }>(`${this.API_URL}/notifications/mark-read`, { ids });
  }

  markAllNotificationsRead() {
    return this.http.post<{ updated: number }>(`${this.API_URL}/notifications/mark-all-read`, {});
  }

  deleteNotification(id: string) {
    return this.http.delete<{ deleted: number }>(`${this.API_URL}/notifications/${id}`);
  }

  getAction(id: string) {
    return this.http.get<ActionLog>(`${this.API_URL}/actions/${id}`);
  }

  executeAction(body: ExecuteActionRequest) {
    return this.http.post<{ ok: boolean }>(`${this.API_URL}/actions/execute`, body);
  }

  // Auth endpoints
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials, { withCredentials: true });
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/users/register`, userData, { withCredentials: true });
  }

  // User endpoints
  getUsers(includeFarms = false): Observable<User[]> {
    const params = new HttpParams().set('includeFarms', includeFarms.toString());
    return this.http.get<User[]>(`${this.API_URL}/users`, { params });
  }

  getUser(id: string, includeFarms = false): Observable<User> {
    const params = new HttpParams().set('includeFarms', includeFarms.toString());
    return this.http.get<User>(`${this.API_URL}/users/${id}`, { params });
  }

  updateUser(id: string, userData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/users/${id}`, userData);
  }

  updatePassword(id: string, password: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.API_URL}/users/${id}/password`, { password });
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/users/${id}`);
  }

  getUserFarms(userId: string): Observable<Farm[]> {
    return this.http.get<Farm[]>(`${this.API_URL}/users/${userId}/farms`);
  }

  // Farm endpoints
  getFarms(): Observable<Farm[]> {
    return this.http.get<Farm[]>(`${this.API_URL}/farms`);
  }

  getFarm(id: string): Observable<Farm> {
    return this.http.get<Farm>(`${this.API_URL}/farms/${id}`);
  }

  createFarm(farmData: Partial<Farm>): Observable<Farm> {
    return this.http.post<Farm>(`${this.API_URL}/farms`, farmData);
  }

  updateFarm(id: string, farmData: Partial<Farm>): Observable<Farm> {
    return this.http.patch<Farm>(`${this.API_URL}/farms/${id}`, farmData);
  }

  deleteFarm(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/farms/${id}`);
  }

  // Device endpoints
  getDevices(includeSensors = false): Observable<Device[]> {
    const params = new HttpParams().set('includeSensors', includeSensors.toString());
    return this.http.get<Device[]>(`${this.API_URL}/devices`, { params });
  }

  getDevice(id: string, includeSensors = false): Observable<Device> {
    const params = new HttpParams().set('includeSensors', includeSensors.toString());
    return this.http.get<Device>(`${this.API_URL}/devices/${id}`, { params });
  }

  createDevice(deviceData: Partial<Device>): Observable<Device> {
    return this.http.post<Device>(`${this.API_URL}/devices`, deviceData);
  }

  updateDevice(id: string, deviceData: Partial<Device>): Observable<Device> {
    return this.http.patch<Device>(`${this.API_URL}/devices/${id}`, deviceData);
  }

  getDeviceActions(deviceId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/devices/${deviceId}/actions`);
  }

  deleteDevice(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/devices/${id}`);
  }

  getDevicesByFarm(farmId: string): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.API_URL}/devices/by-farm/${farmId}`);
  }

  getDevicesByStatus(status: string): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.API_URL}/devices/status/${status}`);
  }

  updateDeviceStatus(deviceId: string, status: string): Observable<Device> {
    return this.http.patch<Device>(`${this.API_URL}/devices/${deviceId}/status`, { status });
  }

  getDeviceStatistics(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/devices/statistics`);
  }

  // Sensor endpoints
  getSensors(): Observable<Sensor[]> {
    return this.http.get<Sensor[]>(`${this.API_URL}/sensors`);
  }

  getSensor(id: string): Observable<Sensor> {
    return this.http.get<Sensor>(`${this.API_URL}/sensors/${id}`);
  }

  createSensor(sensorData: Partial<Sensor>): Observable<Sensor> {
    return this.http.post<Sensor>(`${this.API_URL}/sensors`, sensorData);
  }

  updateSensor(id: string, sensorData: Partial<Sensor>): Observable<Sensor> {
    return this.http.patch<Sensor>(`${this.API_URL}/sensors/${id}`, sensorData);
  }

  deleteSensor(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/sensors/${id}`);
  }

  getSensorsByFarm(farmId: string): Observable<Sensor[]> {
    return this.http.get<Sensor[]>(`${this.API_URL}/sensors/by-farm/${farmId}`);
  }

  getSensorsByDevice(deviceId: string): Observable<Sensor[]> {
    return this.http.get<Sensor[]>(`${this.API_URL}/sensors/by-device/${deviceId}`);
  }

  getSensorsByCrop(cropId: string, includeReadings = false): Observable<Sensor[]> {
    const params = new HttpParams().set('includeReadings', includeReadings.toString());
    return this.http.get<Sensor[]>(`${this.API_URL}/crops/${cropId}/sensors`, { params });
  }

  // Sensor Reading endpoints
  getSensorReadings(limit = 100, offset = 0): Observable<SensorReading[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    return this.http.get<SensorReading[]>(`${this.API_URL}/sensor-readings`, { params });
  }

  getSensorReading(id: string): Observable<SensorReading> {
    return this.http.get<SensorReading>(`${this.API_URL}/sensor-readings/${id}`);
  }

  createSensorReading(readingData: Partial<SensorReading>): Observable<SensorReading> {
    return this.http.post<SensorReading>(`${this.API_URL}/sensor-readings`, readingData);
  }

  deleteSensorReading(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/sensor-readings/${id}`);
  }

  getReadingsBySensor(sensorId: string, limit = 100, offset = 0): Observable<SensorReading[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    return this.http.get<SensorReading[]>(`${this.API_URL}/sensor-readings/by-sensor/${sensorId}`, { params });
  }

  getLatestReading(sensorId: string): Observable<SensorReading | null> {
    return this.http.get<SensorReading | null>(`${this.API_URL}/sensor-readings/by-sensor/${sensorId}/latest`);
  }

  getReadingsByDateRange(sensorId: string, startDate: Date, endDate: Date, limit = 1000): Observable<SensorReading[]> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString())
      .set('limit', limit.toString());
    return this.http.get<SensorReading[]>(`${this.API_URL}/sensor-readings/by-sensor/${sensorId}/date-range`, { params });
  }

  getReadingsByFarm(farmId: string, limit = 100, offset = 0): Observable<SensorReading[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    return this.http.get<SensorReading[]>(`${this.API_URL}/sensor-readings/by-farm/${farmId}`, { params });
  }

  getReadingsByDevice(deviceId: string, limit = 100, offset = 0): Observable<SensorReading[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    return this.http.get<SensorReading[]>(`${this.API_URL}/sensor-readings/by-device/${deviceId}`, { params });
  }

  getReadingsByDeviceDateRange(deviceId: string, startDate: Date, endDate: Date, limit = 1000): Observable<SensorReading[]> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString())
      .set('limit', limit.toString());
    return this.http.get<SensorReading[]>(`${this.API_URL}/sensor-readings/by-device/${deviceId}/date-range`, { params });
  }

  getSensorStatistics(sensorId: string, days = 7): Observable<any> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<any>(`${this.API_URL}/sensor-readings/by-sensor/${sensorId}/statistics`, { params });
  }

  getFarmStatistics(farmId: string, days = 7): Observable<any> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<any>(`${this.API_URL}/sensor-readings/by-farm/${farmId}/statistics`, { params });
  }

  // Crop endpoints
  getCrops(): Observable<Crop[]> {
    return this.http.get<Crop[]>(`${this.API_URL}/crops`);
  }

  getCrop(id: string): Observable<Crop> {
    return this.http.get<Crop>(`${this.API_URL}/crops/${id}`);
  }

  createCrop(cropData: Partial<Crop>): Observable<Crop> {
    return this.http.post<Crop>(`${this.API_URL}/crops`, cropData);
  }

  updateCrop(id: string, cropData: Partial<Crop>): Observable<Crop> {
    return this.http.patch<Crop>(`${this.API_URL}/crops/${id}`, cropData);
  }

  deleteCrop(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/crops/${id}`);
  }

  // Health endpoint
  getHealth(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/health`);
  }

  getDetailedHealth(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/health/detailed`);
  }
}
