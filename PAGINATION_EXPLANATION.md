# Pagination with Limit & Offset - Complete Explanation

## 📚 What is Pagination?

**Pagination** is a technique used to split large datasets into smaller, manageable chunks (pages) that can be loaded incrementally. Instead of loading all 10,000 sensor readings at once, you load 10 or 20 at a time.

## 🔢 Limit & Offset Concepts

### **Limit** (also called `pageSize` or `take`)
- **Definition**: The maximum number of items to return in a single request
- **Purpose**: Controls how many records you want to fetch
- **Example**: `limit=10` means "give me 10 records"

### **Offset** (also called `skip`)
- **Definition**: The number of records to skip before starting to return results
- **Purpose**: Controls where to start reading from in the dataset
- **Example**: `offset=20` means "skip the first 20 records, then start returning"

## 📖 Real-World Example

Imagine you have **100 sensor readings** in your database, ordered by date (newest first):

```
Reading IDs: [100, 99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, ... 1]
```

### Example 1: First Page
```
GET /api/v1/sensor-readings?limit=10&offset=0
```
- **Limit**: 10 records
- **Offset**: Skip 0 records
- **Result**: Returns readings [100, 99, 98, 97, 96, 95, 94, 93, 92, 91]
- **SQL Equivalent**: `SELECT * FROM sensor_readings ORDER BY createdAt DESC LIMIT 10 OFFSET 0`

### Example 2: Second Page
```
GET /api/v1/sensor-readings?limit=10&offset=10
```
- **Limit**: 10 records
- **Offset**: Skip first 10 records
- **Result**: Returns readings [90, 89, 88, 87, 86, 85, 84, 83, 82, 81]
- **SQL Equivalent**: `SELECT * FROM sensor_readings ORDER BY createdAt DESC LIMIT 10 OFFSET 10`

### Example 3: Third Page
```
GET /api/v1/sensor-readings?limit=10&offset=20
```
- **Limit**: 10 records
- **Offset**: Skip first 20 records
- **Result**: Returns readings [80, 79, 78, 77, 76, 75, 74, 73, 72, 71]

## 🎯 Visual Representation

```
Total Records: 100
Page Size (limit): 10

Page 1: [Records 1-10]   → offset=0,  limit=10
Page 2: [Records 11-20]  → offset=10, limit=10
Page 3: [Records 21-30]  → offset=20, limit=10
Page 4: [Records 31-40]  → offset=30, limit=10
...
Page 10: [Records 91-100] → offset=90, limit=10
```

## 💻 How It Works in Your Code

### Backend (NestJS/TypeORM)

```typescript
// Controller receives query parameters
@Get()
async findAll(
  @Query('limit') limit?: string,    // "10"
  @Query('offset') offset?: string    // "0"
) {
  const limitNum = limit ? parseInt(limit, 10) : 100;  // Convert to number: 10
  const offsetNum = offset ? parseInt(offset, 10) : 0;  // Convert to number: 0
  
  return this.service.findAll(limitNum, offsetNum);
}

// Service uses TypeORM QueryBuilder
async findAll(limit = 100, offset = 0) {
  return this.repository
    .createQueryBuilder('reading')
    .orderBy('reading.createdAt', 'DESC')
    .take(limit)    // LIMIT clause
    .skip(offset)   // OFFSET clause
    .getMany();
}
```

### Frontend (Angular)

```typescript
// Service method
getSensorReadings(limit = 100, offset = 0): Observable<SensorReading[]> {
  const params = new HttpParams()
    .set('limit', limit.toString())   // "10"
    .set('offset', offset.toString()); // "0"
  
  return this.http.get<SensorReading[]>(
    `${this.API_URL}/sensor-readings`, 
    { params }
  );
}

// Component usage
loadPage(pageNumber: number) {
  const limit = 10;
  const offset = (pageNumber - 1) * limit;  // Page 1: 0, Page 2: 10, Page 3: 20
  
  this.apiService.getSensorReadings(limit, offset).subscribe({
    next: (readings) => {
      this.readings = readings;
    }
  });
}
```

## 🔄 Calculating Offset from Page Number

If you're using page numbers (1, 2, 3...) instead of offsets:

```typescript
function calculateOffset(pageNumber: number, pageSize: number): number {
  return (pageNumber - 1) * pageSize;
}

// Examples:
calculateOffset(1, 10)  // Returns: 0   (Page 1: skip 0)
calculateOffset(2, 10)  // Returns: 10  (Page 2: skip 10)
calculateOffset(3, 10)  // Returns: 20  (Page 3: skip 20)
```

## ✅ Advantages of Limit/Offset Pagination

1. **Simple to implement** - Easy to understand and code
2. **Flexible** - Can jump to any page directly
3. **Works with any ordering** - Works regardless of sort order
4. **Standard** - Widely used and understood

## ⚠️ Disadvantages & Considerations

1. **Performance with large offsets** - `OFFSET 10000` can be slow
   - Solution: Use cursor-based pagination for very large datasets

2. **Inconsistent results** - If data changes while paginating, you might see duplicates or miss records
   - Example: If a new record is added while you're on page 2, it might shift everything

3. **No total count by default** - You need a separate query to know total pages
   ```typescript
   // Get total count
   const total = await repository.count();
   const totalPages = Math.ceil(total / limit);
   ```

## 🎨 Frontend Pagination UI Example

```typescript
export class SensorReadingsComponent {
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  readings: SensorReading[] = [];

  loadReadings() {
    const offset = (this.currentPage - 1) * this.pageSize;
    
    this.apiService.getSensorReadings(this.pageSize, offset).subscribe({
      next: (readings) => {
        this.readings = readings;
      }
    });
  }

  nextPage() {
    if (this.currentPage * this.pageSize < this.totalItems) {
      this.currentPage++;
      this.loadReadings();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadReadings();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadReadings();
  }
}
```

## 🔍 SQL Translation

Your TypeORM code:
```typescript
.take(10)    // LIMIT 10
.skip(20)    // OFFSET 20
```

Translates to SQL:
```sql
SELECT * FROM sensor_readings 
ORDER BY createdAt DESC 
LIMIT 10 
OFFSET 20;
```

## 📊 Summary Table

| Parameter | Meaning | Example | SQL Equivalent |
|-----------|---------|---------|---------------|
| `limit=10` | Return 10 records | First 10 items | `LIMIT 10` |
| `offset=0` | Start from beginning | Skip 0 items | `OFFSET 0` |
| `offset=10` | Skip first 10 | Start at 11th item | `OFFSET 10` |
| `offset=20` | Skip first 20 | Start at 21st item | `OFFSET 20` |

## 🚀 Best Practices

1. **Set reasonable defaults**: `limit=100, offset=0`
2. **Validate inputs**: Ensure limit/offset are positive numbers
3. **Set maximum limits**: Prevent users from requesting too many records at once
   ```typescript
   const maxLimit = 1000;
   const safeLimit = Math.min(limit, maxLimit);
   ```
4. **Return metadata**: Include total count, current page, etc.
   ```typescript
   return {
     data: readings,
     pagination: {
       limit,
       offset,
       total: totalCount,
       hasMore: offset + limit < totalCount
     }
   };
   ```

## 🎯 Your Current Implementation

In your codebase:
- **Frontend**: `apiService.getSensorReadings(limit, offset)` sends query params
- **Backend**: Controller parses `limit` and `offset` from query string
- **Service**: Uses TypeORM's `take()` and `skip()` methods
- **Database**: Executes SQL with `LIMIT` and `OFFSET` clauses

The fix I applied uses QueryBuilder instead of the simple `find()` method, which properly handles the nested relation filtering for owner-based queries.











