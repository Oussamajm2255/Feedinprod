export interface Farm {
  farm_id: string;
  name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  owner_id: string;
  created_at?: Date;
  updated_at?: Date;
  devices?: Device[];
  sensors?: Sensor[];
}

export interface Device {
  device_id: string;
  name: string;
  location: string;
  status: DeviceStatus;
  farm_id: string;
  device_type?: string;
  description?: string;
  ip_address?: string;
  mac_address?: string;
  firmware_version?: string;
  last_seen?: Date;
  created_at?: Date;
  updated_at?: Date;
  sensors?: Sensor[];
}

export enum DeviceStatus {
  ONLINE = 'online',
  ACTIVE = 'active',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance'
}

export interface Sensor {
  id: number;
  sensor_id: string;
  farm_id: string;
  type: string;
  unit: string;
  device_id: string;
  location?: string;
  crop_id?: string;
  min_critical?: number;
  min_warning?: number;
  max_warning?: number;
  max_critical?: number;
  action_low?: string;
  action_high?: string;
  readings?: SensorReading[];
}

export interface SensorReading {
  id: string;
  sensor_id: string;
  value1?: number;
  value2?: number;
  createdAt: Date;
  sensor?: Sensor; // optional relation when backend includes relations
}

export interface Crop {
  crop_id: string;
  name: string;
  description?: string;
  variety?: string;
  planting_date?: Date;
  expected_harvest_date?: Date;
  status: CropStatus;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
  sensors?: Sensor[];
}

export enum CropStatus {
  PLANTED = 'planted',
  GROWING = 'growing',
  HARVESTED = 'harvested',
  FAILED = 'failed'
}
