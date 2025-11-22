# Historical Data Endpoints Summary

## Overview
This document summarizes the available endpoints for historical data (sensor readings and actions) and what has been fixed.

## ✅ Available Backend Endpoints

### Sensor Readings Historical Data

#### 1. **Get Readings by Sensor (with pagination)**
- **Endpoint**: `GET /sensor-readings/by-sensor/:sensorId`
- **Query Params**: `limit`, `offset`
- **Description**: Get paginated historical readings for a specific sensor
- **Frontend Method**: `apiService.getReadingsBySensor(sensorId, limit, offset)`

#### 2. **Get Latest Reading for Sensor**
- **Endpoint**: `GET /sensor-readings/by-sensor/:sensorId/latest`
- **Description**: Get the most recent reading for a sensor
- **Frontend Method**: `apiService.getLatestReading(sensorId)`

#### 3. **Get Readings by Date Range (Sensor)**
- **Endpoint**: `GET /sensor-readings/by-sensor/:sensorId/date-range`
- **Query Params**: `startDate`, `endDate`, `limit`
- **Description**: Get historical readings for a sensor within a specific date range
- **Frontend Method**: `apiService.getReadingsByDateRange(sensorId, startDate, endDate, limit)`

#### 4. **Get Sensor Statistics**
- **Endpoint**: `GET /sensor-readings/by-sensor/:sensorId/statistics`
- **Query Params**: `days` (default: 7)
- **Description**: Get statistics (average, min, max, count) for a sensor over a period
- **Returns**: `{ sensorId, period, count, average, min, max, latest }`
- **Frontend Method**: `apiService.getSensorStatistics(sensorId, days)`

#### 5. **Get Readings by Device (with pagination)**
- **Endpoint**: `GET /sensor-readings/by-device/:deviceId`
- **Query Params**: `limit`, `offset`
- **Description**: Get paginated historical readings for all sensors in a device
- **Frontend Method**: `apiService.getReadingsByDevice(deviceId, limit, offset)`

#### 6. **Get Readings by Device Date Range** ⭐ NEW
- **Endpoint**: `GET /sensor-readings/by-device/:deviceId/date-range`
- **Query Params**: `startDate`, `endDate`, `limit`
- **Description**: Get historical readings for all sensors in a device within a date range
- **Frontend Method**: `apiService.getReadingsByDeviceDateRange(deviceId, startDate, endDate, limit)`

#### 7. **Get Readings by Farm (with pagination)**
- **Endpoint**: `GET /sensor-readings/by-farm/:farmId`
- **Query Params**: `limit`, `offset`
- **Description**: Get paginated historical readings for all sensors in a farm
- **Frontend Method**: `apiService.getReadingsByFarm(farmId, limit, offset)`

#### 8. **Get Farm Statistics**
- **Endpoint**: `GET /sensor-readings/by-farm/:farmId/statistics`
- **Query Params**: `days` (default: 7)
- **Description**: Get aggregated statistics for all sensors in a farm
- **Returns**: `{ farmId, period, totalReadings, sensors: [{ sensorId, count, average, min, max }] }`
- **Frontend Method**: `apiService.getFarmStatistics(farmId, days)`

### Actions Historical Data

#### 1. **Get Actions (with filters)**
- **Endpoint**: `GET /actions`
- **Query Params**: 
  - `device_id` - Filter by device
  - `sensor_id` - Filter by sensor
  - `source` - Filter by trigger source ('auto' | 'manual')
  - `status` - Filter by status ('queued' | 'sent' | 'ack' | 'error')
  - `from` - Start date (ISO string)
  - `to` - End date (ISO string)
  - `limit` - Max results (default: 50, max: 200)
  - `offset` - Pagination offset
- **Description**: Get historical actions with flexible filtering
- **Returns**: `{ items: ActionLog[], total: number }`
- **Frontend Method**: `apiService.getActions(filters)`

#### 2. **Get Single Action**
- **Endpoint**: `GET /actions/:id`
- **Description**: Get details of a specific action
- **Frontend Method**: `apiService.getAction(id)`

## 🔧 Fixes Applied

### 1. Fixed Frontend API Service URL Paths
The frontend API service had incorrect URL paths. Fixed the following:

- ✅ `getReadingsBySensor()`: Changed from `/sensor-readings/sensor/` to `/sensor-readings/by-sensor/`
- ✅ `getLatestReading()`: Changed from `/sensor-readings/sensor/` to `/sensor-readings/by-sensor/`
- ✅ `getReadingsByDateRange()`: Changed from `/sensor-readings/sensor/.../range` to `/sensor-readings/by-sensor/.../date-range`
- ✅ `getSensorStatistics()`: Changed from `/sensor-readings/sensor/.../statistics` to `/sensor-readings/by-sensor/.../statistics`
- ✅ `getReadingsByFarm()`: Changed from `/sensor-readings/farm/` to `/sensor-readings/by-farm/`
- ✅ `getFarmStatistics()`: Changed from `/sensor-readings/farm/.../statistics` to `/sensor-readings/by-farm/.../statistics`
- ✅ `getReadingsByDevice()`: Changed from `/sensor-readings/device/` to `/sensor-readings/by-device/`

### 2. Added Missing Device Date-Range Endpoint
- ✅ Added backend service method: `getReadingsByDeviceDateRange()`
- ✅ Added backend controller endpoint: `GET /sensor-readings/by-device/:deviceId/date-range`
- ✅ Added frontend API method: `getReadingsByDeviceDateRange()`

## 📋 Usage Examples

### Frontend: Fetch Historical Sensor Data

```typescript
// Get readings for last 7 days
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - 7);

this.apiService.getReadingsByDateRange('sensor-123', startDate, endDate, 1000)
  .subscribe(readings => {
    console.log('Historical readings:', readings);
  });

// Get device historical data
this.apiService.getReadingsByDeviceDateRange('device-456', startDate, endDate, 1000)
  .subscribe(readings => {
    console.log('Device historical readings:', readings);
  });

// Get sensor statistics
this.apiService.getSensorStatistics('sensor-123', 30)
  .subscribe(stats => {
    console.log('Statistics:', stats);
    // { sensorId, period, count, average, min, max, latest }
  });
```

### Frontend: Fetch Historical Actions

```typescript
// Get actions for last 30 days
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - 30);

this.apiService.getActions({
  from: startDate.toISOString(),
  to: endDate.toISOString(),
  device_id: 'device-123',
  limit: 100
}).subscribe(response => {
  console.log('Actions:', response.items);
  console.log('Total:', response.total);
});
```

## ✅ Summary

**All endpoints are now available and working!** You don't need to build anything from scratch. The backend already has comprehensive historical data endpoints for:

- ✅ Sensor readings (by sensor, device, farm)
- ✅ Date range queries
- ✅ Statistics and aggregations
- ✅ Actions history with flexible filtering

The frontend API service has been fixed to use the correct endpoint URLs, and a new device date-range endpoint has been added for completeness.

## 🎯 Next Steps

1. **Use the existing endpoints** - All historical data endpoints are ready to use
2. **Update components** - Update your frontend components to use the corrected API methods
3. **Add date pickers** - Consider adding date range pickers to your UI for historical data views
4. **Implement charts** - Use the historical data to populate charts and visualizations

No additional backend work is needed - everything is already implemented! 🚀

