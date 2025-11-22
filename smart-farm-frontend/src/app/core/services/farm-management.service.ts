import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Farm } from '../models/farm.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class FarmManagementService {
  private readonly STORAGE_KEY = 'selectedFarmId';
  
  // Signals for reactive state management
  private _farms = signal<Farm[]>([]);
  private _selectedFarm = signal<Farm | null>(null);
  private _isLoading = signal<boolean>(false);
  
  // Public readonly signals
  readonly farms = this._farms.asReadonly();
  readonly selectedFarm = this._selectedFarm.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  
  // Computed signals
  readonly hasMultipleFarms = computed(() => this._farms().length > 1);
  readonly selectedFarmId = computed(() => this._selectedFarm()?.farm_id || null);
  
  // BehaviorSubject for components that need observables
  private selectedFarmSubject = new BehaviorSubject<Farm | null>(null);
  public selectedFarm$ = this.selectedFarmSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.initializeFarmSelection();
  }

  /**
   * Initialize farm selection on service creation
   */
  private async initializeFarmSelection(): Promise<void> {
    try {
      this._isLoading.set(true);
      
      // Load farms from API
      const farms = await this.apiService.getFarms().toPromise();
      this._farms.set(farms || []);
      
      // Try to restore previously selected farm
      const savedFarmId = localStorage.getItem(this.STORAGE_KEY);
      let farmToSelect: Farm | null = null;
      
      if (savedFarmId && farms) {
        farmToSelect = farms.find(farm => farm.farm_id === savedFarmId) || null;
      }
      
      // If no saved farm or saved farm not found, select first farm
      if (!farmToSelect && farms && farms.length > 0) {
        farmToSelect = farms[0];
      }
      
      // Set selected farm
      if (farmToSelect) {
        this.selectFarm(farmToSelect);
      }
      
    } catch (error) {
      console.error('Error initializing farm selection:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Select a farm and update global state
   */
  selectFarm(farm: Farm): void {
    this._selectedFarm.set(farm);
    this.selectedFarmSubject.next(farm);
    
    // Save to localStorage for persistence
    localStorage.setItem(this.STORAGE_KEY, farm.farm_id);
    
    console.log(`🏡 Farm selected: ${farm.name} (${farm.farm_id})`);
  }

  /**
   * Get the currently selected farm
   */
  getSelectedFarm(): Farm | null {
    return this._selectedFarm();
  }

  /**
   * Get farms list
   */
  getFarms(): Farm[] {
    return this._farms();
  }

  /**
   * Refresh farms list from API
   */
  async refreshFarms(): Promise<void> {
    try {
      this._isLoading.set(true);
      const farms = await this.apiService.getFarms().toPromise();
      this._farms.set(farms || []);
      
      // Check if current selected farm still exists
      const currentFarm = this._selectedFarm();
      if (currentFarm && farms) {
        const farmStillExists = farms.some(farm => farm.farm_id === currentFarm.farm_id);
        if (!farmStillExists && farms.length > 0) {
          // Current farm no longer exists, select first available farm
          this.selectFarm(farms[0]);
        }
      }
      
    } catch (error) {
      console.error('Error refreshing farms:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Clear farm selection (useful for logout)
   */
  clearSelection(): void {
    this._selectedFarm.set(null);
    this.selectedFarmSubject.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get farm display name for UI
   */
  getFarmDisplayName(): string {
    const farm = this._selectedFarm();
    if (farm) {
      return farm.name;
    }
    return this._farms().length === 1 ? this._farms()[0].name : 'Select Farm';
  }

  /**
   * Get farm location for UI
   */
  getFarmLocation(): string {
    const farm = this._selectedFarm();
    if (farm) {
      return farm.location || 'Location not specified';
    }
    return this._farms().length === 1 ? (this._farms()[0].location || 'Location not specified') : '';
  }

  /**
   * Check if a specific farm is selected
   */
  isFarmSelected(farmId: string): boolean {
    return this._selectedFarm()?.farm_id === farmId;
  }
}
