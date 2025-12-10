# 🔍 Crop Dashboard Freeze - Troubleshooting Guide

## ✅ Additional Fixes Applied

### Fix 1: Added `untracked()` to prevent circular dependencies
- Effect now uses `untracked()` when checking `isLoading()` and `isLoadingData()`
- This prevents the effect from subscribing to loading states

### Fix 2: Added `lastLoadedCropId` guard
- Prevents loading the same crop multiple times
- Effect will skip if trying to load the same crop again

### Fix 3: Added double-check for `isLoadingData()`
- `loadCropData()` now returns early if already loading
- Prevents multiple simultaneous API calls

---

## 🧪 STEP-BY-STEP DEBUGGING

### Step 1: Check Browser Console

Open Chrome DevTools (F12) and navigate to `/crops`. You should see:

**Expected Output:**
```
[CropsComponent] Loading initial data...
[CropDashboardService] Loading crops...
[CropDashboardService] Crops loaded: X
[CropsComponent] Crops loaded successfully: X
[CropsComponent] Effect triggered - CropId: xxx, Crops: X
[CropsComponent] Loading crop data for: xxx
[CropsComponent] All crop data loaded successfully
CropDashboard Init: ~850ms
```

**If you see infinite loops:**
```
[CropsComponent] Effect triggered... (repeated 100+ times)
```
→ **This means the effect is still looping**

**If you see API errors:**
```
[CropsComponent] Error loading crop data: ...
```
→ **API calls are failing**

---

### Step 2: Check Network Tab

1. Open DevTools → Network tab
2. Navigate to `/crops`
3. Look for these requests:

**Expected:**
- `GET /api/crops` → 1 call
- `GET /api/crops/{id}/...` → 5 calls via forkJoin

**If you see:**
- Same API called 10+ times → **Effect is looping**
- API calls hanging/timing out → **Backend issue**
- 500 errors → **Server error**

---

### Step 3: Check Performance Tab

1. Open DevTools → Performance tab
2. Click Record
3. Navigate to `/crops`
4. Stop recording after 5 seconds

**Look for:**
- Long tasks (red bars) → CPU intensive operations
- Excessive layout/paint operations → Rendering issues
- Memory growing continuously → Memory leak

---

### Step 4: Check If It's a Data Issue

Add this temporary code to see what data is being loaded:

```typescript
// In crops.component.ts, add to loadCropData success handler:
next: (data) => {
  console.log('[DEBUG] KPIs:', data.kpis);
  console.log('[DEBUG] Analytics:', data.analytics);
  console.log('[DEBUG] Events count:', data.events?.length || 0);
  console.log('[DEBUG] Metrics:', data.metrics);
  console.log('[DEBUG] Comparison:', data.comparison);
  
  this.kpis.set(data.kpis);
  this.analytics.set(data.analytics);
  // ... rest of code
}
```

**If events array has 10,000+ items** → **Need pagination**  
**If analytics data is huge** → **Need data throttling**

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue 1: Effect Still Looping

**Symptoms:**
- Console shows effect triggered 100+ times
- UI completely frozen

**Solution A: Disable Effect Temporarily**

```typescript
constructor() {
  // TEMPORARILY COMMENT OUT THE EFFECT
  /*
  effect(() => {
    ...
  });
  */
}

// Load data manually in ngOnInit instead
ngOnInit(): void {
  this.loadInitialData();
  
  // Load first crop after crops loaded
  setTimeout(() => {
    const crops = this.crops();
    if (crops.length > 0) {
      this.loadCropData(crops[0].crop_id);
    }
  }, 500);
}
```

**Solution B: Use RxJS instead of Effect**

```typescript
private cropSelection$ = toObservable(this.selectedCropId);

ngOnInit(): void {
  this.loadInitialData();
  
  // React to crop changes using RxJS
  this.cropSelection$
    .pipe(
      filter(cropId => !!cropId && this.crops().length > 0),
      distinctUntilChanged(),
      debounceTime(100),
      takeUntil(this.destroy$)
    )
    .subscribe(cropId => {
      if (cropId) {
        this.loadCropData(cropId);
      }
    });
}
```

---

### Issue 2: Backend API Timeout

**Symptoms:**
- Network tab shows API calls pending forever
- Console shows timeout errors after 30s

**Solution:**

```typescript
// Add timeout to API calls
forkJoin({
  kpis: this.dashboardService.getCropKPIs(cropId).pipe(timeout(10000)),
  analytics: this.dashboardService.getCropAnalytics(cropId).pipe(timeout(10000)),
  events: this.dashboardService.getCropEvents(cropId).pipe(timeout(10000)),
  metrics: this.dashboardService.getSustainabilityMetrics(cropId).pipe(timeout(10000)),
  comparison: this.dashboardService.getCropComparison().pipe(timeout(10000))
})
```

---

### Issue 3: Too Much Data Being Rendered

**Symptoms:**
- Initial API calls succeed
- Browser freezes after data arrives
- Charts take forever to render

**Solution A: Limit Data Points**

```typescript
// In crop-dashboard.service.ts
getCropAnalytics(cropId: string): Observable<CropAnalytics> {
  return this.apiService.getSensorReadings(...).pipe(
    map(readings => {
      // Limit to last 50 data points instead of all
      const recent = readings.slice(-50);
      return {
        soilMoisture: this.processData(recent, 'soil'),
        temperature: this.processData(recent, 'temperature'),
        // ...
      };
    })
  );
}
```

**Solution B: Disable Charts Temporarily**

```html
<!-- In crops.component.html -->
<!-- TEMPORARILY COMMENT OUT CHARTS -->
<!--
<app-health-analytics-panel [analytics]="analytics()"></app-health-analytics-panel>
-->
<div>Analytics panel disabled for testing</div>
```

---

### Issue 4: Virtual Scrolling Issue

**Symptoms:**
- Everything loads fine except timeline
- Browser freezes when events load

**Solution: Temporarily Disable Virtual Scroll**

```typescript
// In events-timeline.component.ts template
// Replace virtual scroll with simple div
<div class="timeline-container-simple" style="max-height: 500px; overflow-y: auto;">
  @for (event of events()?.slice(0, 20); track event.id) {
    <!-- Only show first 20 events for testing -->
  }
</div>
```

---

### Issue 5: Material Components Issue

**Symptoms:**
- Console shows Material errors
- Snackbar or Dialog causing issues

**Solution: Check if Angular Material is properly installed**

```bash
npm list @angular/material
npm list @angular/cdk
```

If version mismatch, reinstall:
```bash
npm install @angular/material@20 @angular/cdk@20 --save
```

---

## 🛠️ EMERGENCY: REVERT TO SIMPLE VERSION

If nothing works, use this minimal version:

```typescript
// crops.component.ts - MINIMAL VERSION
@Component({
  selector: 'app-crops',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="container">
      @if (isLoading()) {
        <mat-spinner></mat-spinner>
      } @else {
        <h1>Crops Dashboard</h1>
        <p>Crops loaded: {{ crops().length }}</p>
        <button (click)="testLoad()">Test Load</button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CropsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isLoading = signal(true);
  crops = signal<Crop[]>([]);

  ngOnInit(): void {
    this.dashboardService.loadCrops()
      .pipe(takeUntil(this.destroy$))
      .subscribe(crops => {
        this.crops.set(crops);
        this.isLoading.set(false);
      });
  }

  testLoad(): void {
    console.log('Test button clicked - app is responsive!');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

If this minimal version works, gradually add components back one by one.

---

## 📊 PERFORMANCE TESTING COMMANDS

```bash
# 1. Build in development mode
ng build --configuration=development

# 2. Check bundle size
ng build --stats-json
npx webpack-bundle-analyzer dist/smart-farm-frontend/stats.json

# 3. Run in production mode
ng serve --configuration=production

# 4. Enable source maps for debugging
ng serve --source-map
```

---

## 🔬 DIAGNOSTIC CHECKLIST

- [ ] Console shows effect triggered only 2-3 times
- [ ] Network tab shows 6 API calls total (not 100+)
- [ ] No red errors in console
- [ ] No 500/404 errors in network tab
- [ ] Browser doesn't freeze for more than 2 seconds
- [ ] Memory doesn't grow continuously
- [ ] Can click buttons and interact with UI
- [ ] Crops dropdown works
- [ ] Charts render (even if slowly)

---

## 💡 IF STILL FREEZING...

**Please provide:**

1. **Console Output** (first 50 lines after navigation)
2. **Network Tab Screenshot** (showing API calls)
3. **Performance Profile** (Export from Chrome DevTools)
4. **Browser & Version** (Chrome 120? Firefox?)
5. **Number of Crops** (in database)
6. **Number of Events** (for one crop)

**Possible Root Causes:**
- Backend returning massive JSON (10MB+)
- Database query taking 30+ seconds
- Old browser version incompatible with Angular 20
- Memory exhausted (< 2GB RAM available)
- Antivirus blocking API calls
- CORS issues causing infinite retries

---

## 🎯 NEXT STEPS

1. **Check console output** - Is effect looping?
2. **Check network tab** - Are APIs being called repeatedly?
3. **Try minimal version** - Does simple component work?
4. **Check backend** - Are API responses fast (<1s)?
5. **Check data size** - Are responses >1MB?

**If minimal version works** → Progressive enhance by adding components one by one  
**If minimal version freezes** → Issue is with Angular setup, not our code  
**If API calls loop** → Backend is returning triggers for new calls  
**If no API calls** → Routing or module loading issue

---

**Report back with console output and I'll help debug further!** 🔍

