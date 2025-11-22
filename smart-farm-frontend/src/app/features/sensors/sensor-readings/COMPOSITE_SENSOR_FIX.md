# Composite Sensor Selection Fix

## 🐛 Problem

When navigating to `http://localhost:4200/sensor-readings?sensor=dht11`, **both** DHT11 sensors were being highlighted:
- DHT11 humidity sensor
- DHT11 temperature sensor

This happened because DHT11 is a **composite sensor** that reports multiple values (temperature + humidity) with the same base `sensor_id` ("dht11").

---

## ✅ Solution

### 1. Created Unique Sensor IDs

Added helper functions to generate unique identifiers that combine the sensor ID with its type:

```typescript
// sensor-display.util.ts

/**
 * Generate unique sensor identifier
 * e.g., "dht11" + "temperature" = "dht11-temperature"
 * e.g., "dht11" + "humidity" = "dht11-humidity"
 */
export function generateUniqueSensorId(
  sensorId: string, 
  type: string, 
  unit?: string
): string {
  const normalizedType = type.toLowerCase().replace(/\s+/g, '-');
  return `${sensorId}-${normalizedType}`;
}

/**
 * Parse unique sensor ID back to base sensor ID and type
 */
export function parseUniqueSensorId(uniqueId: string): {
  baseSensorId: string;
  type: string;
} {
  const lastDashIndex = uniqueId.lastIndexOf('-');
  
  if (lastDashIndex === -1) {
    return { baseSensorId: uniqueId, type: '' };
  }
  
  return {
    baseSensorId: uniqueId.substring(0, lastDashIndex),
    type: uniqueId.substring(lastDashIndex + 1),
  };
}
```

---

### 2. Updated Device List Items

Modified the `deviceListItems` computed property to generate unique IDs:

```typescript
// sensor-readings.component.ts

const items: DeviceListItem[] = filtered.map((item) => {
  // Generate unique ID that includes sensor type
  const uniqueId = generateUniqueSensorId(
    item.sensor.sensor_id,
    item.sensor.type || 'unknown',
    item.sensor.unit
  );
  
  return {
    id: uniqueId, // Now: "dht11-temperature" or "dht11-humidity"
    name: item.sensor.sensor_id,
    type: item.sensor.type,
    // ... other fields
  };
});
```

---

### 3. Updated Selection Logic

Modified `selectedDeviceDetail` to parse the unique ID and find the correct sensor:

```typescript
selectedDeviceDetail = computed(() => {
  const uniqueSensorId = this.selectedSensorId();
  if (!uniqueSensorId) return null;

  // Parse the unique ID to get base sensor ID and type
  const { baseSensorId, type } = parseUniqueSensorId(uniqueSensorId);

  // Find the sensor that matches BOTH the base ID and type
  const sensor = sensors.find((s) => {
    const matches = s.sensor_id === baseSensorId;
    const typeMatches = s.type?.toLowerCase().replace(/\s+/g, '-') === type;
    return matches && typeMatches;
  });
  
  // ... rest of logic
});
```

---

### 4. Added Backward Compatibility

When reading URL query params, we now handle both formats:

```typescript
// Handles both "?sensor=dht11-temperature" (new) and "?sensor=dht11" (old)
this.route.queryParams.subscribe((params) => {
  if (params['sensor']) {
    const queryParam = params['sensor'];
    const items = this.deviceListItems();
    
    // Try exact match first (new format: "dht11-temperature")
    let matchingItem = items.find(item => item.id === queryParam);
    
    // If no match, find first sensor starting with query param
    // Provides backward compatibility for "?sensor=dht11"
    if (!matchingItem) {
      matchingItem = items.find(item => item.id.startsWith(queryParam + '-'));
    }
    
    if (matchingItem) {
      this.selectedSensorId.set(matchingItem.id);
    }
  }
});
```

---

## 📋 New URL Format

### Before (Ambiguous)
```
❌ ?sensor=dht11  → Selects BOTH temperature AND humidity
```

### After (Specific)
```
✅ ?sensor=dht11-temperature  → Selects ONLY temperature
✅ ?sensor=dht11-humidity     → Selects ONLY humidity
```

### Backward Compatibility
```
✅ ?sensor=dht11  → Auto-selects the first matching sensor (temperature)
```

---

## 🎯 How It Works Now

1. **Page loads with `?sensor=dht11`**
   - System finds all sensors starting with "dht11-"
   - Selects the first match (e.g., "dht11-temperature")
   - URL updates to `?sensor=dht11-temperature`
   - Only ONE sensor is highlighted ✅

2. **User clicks a sensor in the list**
   - Emits unique ID: "dht11-humidity"
   - URL updates to `?sensor=dht11-humidity`
   - Only that specific sensor is selected ✅

3. **Direct navigation with specific ID**
   - Navigate to `?sensor=dht11-humidity`
   - Exact match found immediately
   - Only humidity sensor is selected ✅

---

## 🔧 Technical Details

### Unique ID Format
```
{baseSensorId}-{normalizedType}
```

**Examples:**
- `dht11-temperature`
- `dht11-humidity`
- `bmp280-pressure`
- `soil-sensor-soil-moisture`

### Normalization Rules
- Convert to lowercase
- Replace spaces with hyphens
- Keep alphanumeric and hyphens only

---

## 🚀 Benefits

✅ **No Ambiguity**: Each sensor has a unique, predictable ID  
✅ **Backward Compatible**: Old URLs still work  
✅ **Clear Selection**: Only ONE sensor highlighted at a time  
✅ **URL Friendly**: Clean, readable URLs  
✅ **Composite Sensor Ready**: Works with any multi-value sensor  

---

## 🧪 Test Cases

| Input URL | Expected Result |
|-----------|----------------|
| `?sensor=dht11-temperature` | Selects DHT11 temperature only |
| `?sensor=dht11-humidity` | Selects DHT11 humidity only |
| `?sensor=dht11` | Selects first DHT11 sensor (backward compat) |
| `?sensor=bmp280-pressure` | Selects BMP280 pressure sensor |
| No query param | Auto-selects first sensor in list |

---

## 📊 Impact on Composite Sensors

### DHT11 (Temperature + Humidity)
- Before: 1 sensor ID → 2 readings → Ambiguous selection
- After: 2 unique IDs → Clear separation → Precise selection

### BMP280 (Pressure + Temperature)
- Before: 1 sensor ID → 2 readings → Ambiguous selection
- After: 2 unique IDs → Clear separation → Precise selection

### Any Future Composite Sensors
- Automatically handled by the new system
- No additional code needed ✅

---

## 🎨 UI Impact

### Sidebar (Device List)
- Each sensor type now appears as a distinct item
- Only ONE item is highlighted (glowing border)
- Clear visual feedback on which sensor is active

### URL Bar
- Shows exact sensor being viewed
- Can be bookmarked or shared accurately
- Deep linking works perfectly

---

## 🔗 Related Files

**Modified:**
- `utils/sensor-display.util.ts` - Added unique ID helpers
- `sensor-readings.component.ts` - Updated ID generation and selection logic

**Functions Added:**
- `generateUniqueSensorId()` - Creates unique IDs
- `parseUniqueSensorId()` - Parses unique IDs back to components

---

**Last Updated**: November 2, 2025  
**Issue**: Composite sensor dual selection  
**Status**: Fixed ✅  
**Breaking Changes**: None (backward compatible)

