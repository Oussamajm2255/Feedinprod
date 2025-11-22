import { Component, OnInit, OnDestroy, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject, catchError, of, retry, timeout, finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ApiService } from '../../core/services/api.service';
import { FarmManagementService } from '../../core/services/farm-management.service';
import { Device, DeviceStatus } from '../../core/models/farm.model';
import { LanguageService } from '../../core/services/language.service';
import { AlertService } from '../../core/services/alert.service';
import { TooltipDirective } from '../../shared/directives/tooltip.directive';
import { DeviceDetailsDialogComponent, DeviceDetailsDialogData } from './components/device-details-dialog/device-details-dialog.component';
import * as DeviceUtils from './device.utils';
import { DEVICES_CONFIG, DEVICE_TABLE_COLUMNS } from './devices.constants';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSortModule,
    MatPaginatorModule,
    MatTooltipModule,
    TooltipDirective
  ],
  templateUrl: './devices.component.html',
  styleUrls: [
    './_devices-shared.scss',
    './_devices-header.scss',
    './_devices-filters.scss',
    './_devices-cards.scss',
    './_devices-table.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DevicesComponent implements OnInit, OnDestroy {
  // Services
  private readonly apiService = inject(ApiService);
  private readonly farmManagement = inject(FarmManagementService);
  public readonly languageService = inject(LanguageService);
  private readonly alertService = inject(AlertService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  // Component State
  devices: Device[] = [];
  filteredDevices: Device[] = [];
  paginatedDevices: Device[] = [];
  isLoading = false;
  viewMode: 'cards' | 'table' = 'cards';
  isTogglingStatus: Record<string, boolean> = {};
  selectedDevices: Set<string> = new Set();

  // Filtering and Search
  searchTerm = '';
  statusFilter = '';
  deviceTypeFilter = '';
  private readonly searchSubject = new Subject<string>();

  // Pagination
  pageSize: number = DEVICES_CONFIG.DEFAULT_PAGE_SIZE;
  pageSizeOptions: readonly number[] = DEVICES_CONFIG.PAGE_SIZE_OPTIONS;
  currentPage = 0;
  totalDevices = 0;

  // Table
  dataSource = new MatTableDataSource<Device>();
  displayedColumns = [...DEVICE_TABLE_COLUMNS];
  sort?: MatSort;

  // Available Options
  availableStatuses = [...DEVICES_CONFIG.DEVICE_STATUSES];
  availableDeviceTypes: string[] = [...DEVICES_CONFIG.DEVICE_TYPES];
  typeOptionsAreFarmScoped = false;
  private readonly defaultDeviceTypes = [...DEVICES_CONFIG.DEVICE_TYPES];

  // Computed Properties
  get hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.statusFilter || this.deviceTypeFilter);
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.searchTerm) count++;
    if (this.statusFilter) count++;
    if (this.deviceTypeFilter) count++;
    return count;
  }

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadDevices();
    this.subscribeFarmChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup debounced search to prevent excessive filtering
   */
  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(DEVICES_CONFIG.SEARCH_DEBOUNCE_MS),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.applyFilters();
        this.cdr.markForCheck();
      });
  }

  /**
   * Subscribe to farm selection changes and reload devices
   */
  private subscribeFarmChanges(): void {
    this.farmManagement.selectedFarm$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(selectedFarm => {
        if (selectedFarm) {
          this.loadDevices();
        }
      });
  }

  /**
   * Load devices from API with proper error handling
   */
  async loadDevices(): Promise<void> {
    const selectedFarm = this.farmManagement.getSelectedFarm();
    if (!selectedFarm) {
      this.devices = [];
      this.updateAvailableDeviceTypes();
      this.applyFilters();
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.apiService.getDevicesByFarm(selectedFarm.farm_id)
      .pipe(
        timeout(environment.apiTimeout),
        retry({ count: DEVICES_CONFIG.MAX_RETRY_ATTEMPTS, delay: DEVICES_CONFIG.RETRY_DELAY_MS }),
        catchError(error => {
          console.error('Error loading devices:', error);

          // Enhanced error handling
          if (error.status === 404) {
            this.alertService.error('devices.deviceNotFound', 'devices.loadErrorDescription');
          } else if (error.status === 403) {
            this.alertService.error('devices.noPermission', 'devices.loadErrorDescription');
          } else if (error.status === 409) {
            this.alertService.error('devices.deviceAlreadyExists', 'devices.loadErrorDescription');
          } else {
            this.alertService.error('devices.loadError', 'devices.loadErrorDescription');
          }

          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(devices => {
        this.devices = devices || [];
        this.updateAvailableDeviceTypes();
        this.applyFilters();
        this.cdr.markForCheck();
      });
  }

  /**
   * Refresh devices with user feedback
   */
  async refreshDevices(): Promise<void> {
    await this.loadDevices();

    if (!this.isLoading) {
      this.alertService.success(
        'devices.refreshed',
        'devices.devicesRefreshedSuccessfully'
      );
    }
  }

  /**
   * Toggle between card and table view modes
   */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'cards' ? 'table' : 'cards';
    this.cdr.markForCheck();
  }

  /**
   * Handle search input changes
   */
  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  /**
   * Handle filter changes
   */
  onFilterChange(): void {
    this.currentPage = 0;
    this.applyFilters();
    this.cdr.markForCheck();
  }

  /**
   * Apply all active filters to device list
   */
  private applyFilters(): void {
    let filtered = [...this.devices];

    // Search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(device =>
        device.name.toLowerCase().includes(searchLower) ||
        device.location.toLowerCase().includes(searchLower) ||
        (device.device_type && device.device_type.toLowerCase().includes(searchLower)) ||
        (device.description && device.description.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (this.statusFilter) {
      filtered = filtered.filter(device => device.status === this.statusFilter);
    }

    // Type filter
    if (this.deviceTypeFilter) {
      filtered = filtered.filter(device => device.device_type === this.deviceTypeFilter);
    }

    this.filteredDevices = filtered;
    this.totalDevices = filtered.length;
    this.updatePagination();
    this.updateDataSource();
  }

  /**
   * Build device type options based on current farm devices
   */
  private updateAvailableDeviceTypes(): void {
    const normalizedTypes = new Map<string, string>();

    this.devices.forEach(device => {
      const type = device.device_type?.trim();
      if (!type) {
        return;
      }
      const key = type.toLowerCase();
      if (!normalizedTypes.has(key)) {
        normalizedTypes.set(key, type);
      }
    });

    if (normalizedTypes.size) {
      this.availableDeviceTypes = Array.from(normalizedTypes.values()).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      );
      this.typeOptionsAreFarmScoped = true;
      return;
    }

    this.availableDeviceTypes = [...this.defaultDeviceTypes];
    this.typeOptionsAreFarmScoped = false;
  }

  /**
   * Update paginated device list
   */
  private updatePagination(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedDevices = this.filteredDevices.slice(startIndex, endIndex);
  }

  /**
   * Update Material table data source
   */
  private updateDataSource(): void {
    // Let MatPaginator handle pagination automatically
    this.dataSource.data = this.filteredDevices;
  }

  /**
   * Handle pagination changes
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagination();
    this.updateDataSource();
    this.cdr.markForCheck();
  }

  /**
   * Handle table sorting changes
   */
  onSortChange(sort: Sort): void {
    const data = [...this.filteredDevices];

    if (!sort.active || sort.direction === '') {
      this.filteredDevices = data;
      this.updatePagination();
      this.updateDataSource();
      this.cdr.markForCheck();
      return;
    }

    this.filteredDevices = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name': return this.compare(a.name, b.name, isAsc);
        case 'type': return this.compare(a.device_type || '', b.device_type || '', isAsc);
        case 'location': return this.compare(a.location, b.location, isAsc);
        case 'status': return this.compare(a.status, b.status, isAsc);
        case 'lastSeen': return this.compare(a.last_seen?.toString() || '', b.last_seen?.toString() || '', isAsc);
        default: return 0;
      }
    });

    this.updatePagination();
    this.updateDataSource();
    this.cdr.markForCheck();
  }

  /**
   * Compare function for sorting
   */
  private compare(a: string | number, b: string | number, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  /**
   * Clear all filters and reset search
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.deviceTypeFilter = '';
this.currentPage = 0;
    this.applyFilters();
    this.cdr.markForCheck();

    this.alertService.info(
      'devices.filtersCleared',
      'devices.allFiltersClearedSuccessfully'
    );
  }

  /**
   * View device details (opens details dialog)
   */
  async viewDeviceDetails(device: Device): Promise<void> {
    const dialogRef = this.dialog.open(DeviceDetailsDialogComponent, {
      width: 'min(900px, 95vw)',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { device } as DeviceDetailsDialogData,
      panelClass: 'device-details-dialog-container',
      backdropClass: 'device-details-dialog-backdrop'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'edit') {
        // Handle edit action if needed
      } else if (result?.action === 'delete') {
        // Handle delete action if needed
        this.loadDevices();
      }
    });
  }

  /**
   * Toggle device online/offline status
   */
  async toggleDeviceStatus(device: Device): Promise<void> {
    if (device.status === 'maintenance') {
      return;
    }

    const newStatus = device.status === 'online' ? 'offline' : 'online';
    const actionKey = newStatus === 'online' ? 'devices.activate' : 'devices.deactivate';

    const result = await this.alertService.confirm(
      'devices.changeStatus',
      'devices.changeStatusConfirmation',
      actionKey,
      'common.cancel'
    );

    if (!result.isConfirmed) {
      return;
    }

    // Set loading state for this specific device
    this.isTogglingStatus[device.device_id] = true;
    this.cdr.markForCheck();

    // Store previous status for rollback on error
    const previousStatus = device.status;

    // Optimistic update
    device.status = newStatus as DeviceStatus;
    this.cdr.markForCheck();

    this.apiService.updateDeviceStatus(device.device_id, newStatus)
      .pipe(
        timeout(environment.apiTimeout),
        retry({ count: 2, delay: 1000 }),
        catchError(error => {
          console.error('Error updating device status:', error);
// Rollback on error
          device.status = previousStatus;
          this.cdr.markForCheck();

          this.alertService.error(
            'devices.updateError',
            'devices.updateErrorDescription'
          );
          return of(null);
        }),
        finalize(() => {
          this.isTogglingStatus[device.device_id] = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(updatedDevice => {
        if (updatedDevice) {
// Update with server response
          Object.assign(device, updatedDevice);
          this.cdr.markForCheck();

          this.alertService.success(
            'devices.statusUpdated',
            `devices.deviceNow${newStatus === 'online' ? 'Online' : 'Offline'}`
          );
        }
      });
  }

  /**
   * Export device data to CSV
   */
  async exportDeviceData(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const defaultFilename = `${DEVICES_CONFIG.EXPORT_FILENAME_PREFIX}${timestamp}.csv`;

    const result = await this.alertService.prompt(
      'devices.exportData',
      'devices.exportDataDescription',
      'text',
      defaultFilename,
      'devices.fileName'
    );

    if (!result.isConfirmed || !result.value) {
      return;
    }

    try {
      const translate = this.languageService.t();
      const headers = [
        translate('devices.exportHeaders.name'),
        translate('devices.exportHeaders.type'),
        translate('devices.exportHeaders.location'),
        translate('devices.exportHeaders.status'),
        translate('devices.exportHeaders.lastSeen'),
        translate('devices.exportHeaders.description')
      ];
      const csvRows = [headers.join(',')];

      this.filteredDevices.forEach(device => {
        const row = [
          `"${device.name}"`,
          `"${this.getDeviceTypeTranslation(device.device_type || 'unknown')}"`,
          `"${device.location}"`,
          `"${this.getStatusTranslation(device.status)}"`,
          `"${device.last_seen || ''}"`,
          `"${device.description || ''}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', result.value);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.alertService.success(
        'devices.exportComplete',
        'devices.dataExportedSuccessfully'
      );
    } catch (error) {
      console.error('Error exporting device data:', error);
      this.alertService.error(
        'devices.exportError',
        'devices.exportErrorDescription'
      );
    }
  }

  /**
   * Show device statistics
   */
  async showDeviceStatistics(): Promise<void> {
    const stats = this.calculateDeviceStatistics();

    this.alertService.custom({
      title: 'devices.statistics',
      html: `
        <div style="text-align: left;">
          <p><strong>${this.languageService.translate('devices.totalDevices')}:</strong> ${stats.total}</p>
          <p><strong>${this.languageService.translate('dashboard.deviceStatus.online')}:</strong> ${stats.online} (${stats.onlinePercentage}%)</p>
          <p><strong>${this.languageService.translate('dashboard.deviceStatus.offline')}:</strong> ${stats.offline} (${stats.offlinePercentage}%)</p>
          <p><strong>${this.languageService.translate('dashboard.deviceStatus.maintenance')}:</strong> ${stats.maintenance} (${stats.maintenancePercentage}%)</p>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'common.close',
      showCancelButton: false
    });
  }

  // ===== Utility Methods =====

  /**
   * TrackBy function for ngFor optimization
   */
  trackByDeviceId(index: number, device: Device): string {
    return device.device_id;
  }

  /**
   * Get Material icon for device type
   */
  getDeviceIcon(type: string): string {
    return DeviceUtils.getDeviceTypeIcon(type);
  }

  /**
   * Get icon color for device type
   */
  getDeviceIconColor(type: string | undefined): string {
    if (!type) return '#6b7280';

    const colors: Record<string, string> = {
      sensor: '#10b981',
      controller: '#3b82f6',
      gateway: '#8b5cf6',
      camera: '#f59e0b',
      actuator: '#ef4444',
      monitor: '#06b6d4'
    };

    return colors[type.toLowerCase()] || '#6b7280';
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: string): string {
    return DeviceUtils.getStatusIcon(status);
  }

  /**
   * Get gradient background for device type
   */
  getDeviceTypeGradient(type: string): string {
    return DeviceUtils.getDeviceTypeGradient(type);
  }

  /**
   * Get translated status text
   */
  getStatusTranslation(status: string): string {
    return DeviceUtils.getStatusTranslation(status, this.languageService.t());
  }

  /**
   * Get translated status description
   */
  getStatusDescription(status: string): string {
    return this.languageService.translate(`devices.statusDescription.${status}`);
  }

  /**
   * Get translated device type
   */
  getDeviceTypeTranslation(type: string): string {
    return DeviceUtils.getDeviceTypeTranslation(type, this.languageService.t());
  }

  /**
   * Get toggle action text
   */
  getToggleActionText(device: Device): string {
    return device.status === 'online'
      ? this.languageService.translate('devices.deactivate')
      : this.languageService.translate('devices.activate');
  }

  /**
   * Get toggle action icon
   */
  getToggleActionIcon(device: Device): string {
    return device.status === 'online' ? 'power_off' : 'power';
  }

  /**
   * Get toggle action tooltip
   */
  getToggleActionTooltip(device: Device): string {
    return device.status === 'online'
      ? this.languageService.translate('devices.deactivateTooltip')
      : this.languageService.translate('devices.activateTooltip');
  }

  /**
   * Format last seen time (relative)
   */
  formatLastSeen(lastSeen: Date | string | undefined): string {
    return DeviceUtils.formatTimeAgo(lastSeen as any, this.languageService.t());
  }

  /**
   * Format last seen time (detailed)
   */
  formatLastSeenDetailed(lastSeen: Date | string | undefined): string {
    if (!lastSeen) return this.languageService.translate('common.never');
    const date = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
    return date.toLocaleString();
  }

  /**
   * Calculate device statistics
   */
  private calculateDeviceStatistics(): {
    total: number;
    online: number;
    offline: number;
    maintenance: number;
    onlinePercentage: number;
    offlinePercentage: number;
    maintenancePercentage: number;
  } {
    const total = this.devices.length;
    const online = this.devices.filter(d => d.status === 'online').length;
    const offline = this.devices.filter(d => d.status === 'offline').length;
    const maintenance = this.devices.filter(d => d.status === 'maintenance').length;

    return {
      total,
      online,
      offline,
      maintenance,
      onlinePercentage: total > 0 ? Math.round((online / total) * 100) : 0,
      offlinePercentage: total > 0 ? Math.round((offline / total) * 100) : 0,
      maintenancePercentage: total > 0 ? Math.round((maintenance / total) * 100) : 0
    };
  }

  // ===== Bulk Operations =====

  /**
   * Toggle device selection for bulk operations
   */
  toggleSelection(deviceId: string): void {
    if (this.selectedDevices.has(deviceId)) {
      this.selectedDevices.delete(deviceId);
    } else {
      this.selectedDevices.add(deviceId);
    }
    this.cdr.markForCheck();
  }

  /**
   * Select all visible devices
   */
  selectAll(): void {
    this.paginatedDevices.forEach(device => {
      this.selectedDevices.add(device.device_id);
    });
    this.cdr.markForCheck();
  }

  /**
   * Deselect all devices
   */
  deselectAll(): void {
    this.selectedDevices.clear();
    this.cdr.markForCheck();
  }

  /**
   * Check if device is selected
   */
  isSelected(deviceId: string): boolean {
    return this.selectedDevices.has(deviceId);
  }

  /**
   * Get selected devices count
   */
  get selectedCount(): number {
    return this.selectedDevices.size;
  }

  /**
   * Delete multiple selected devices
   */
  async bulkDelete(): Promise<void> {
    if (this.selectedDevices.size === 0) {
      return;
    }

    const selectedDevicesList = this.devices.filter(d => this.selectedDevices.has(d.device_id));
    const deviceNames = selectedDevicesList.map(d => d.name).join(', ');

    const confirmMessage = this.languageService.translate('devices.confirmBulkDelete', {
      count: this.selectedDevices.size,
      names: deviceNames
    });

    const result = await this.alertService.confirm(
      'devices.deleteDevice',
      confirmMessage,
      'common.delete',
      'common.cancel'
    );

    if (!result.isConfirmed) {
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    // TODO: Implement bulk delete API endpoint
    // For now, delete one by one
    const deletePromises = Array.from(this.selectedDevices).map(deviceId =>
      this.apiService.deleteDevice(deviceId).toPromise()
    );

    try {
      await Promise.all(deletePromises);

      // Remove deleted devices from local state
this.devices = this.devices.filter(d => !this.selectedDevices.has(d.device_id));
      this.selectedDevices.clear();
      this.applyFilters();

      this.alertService.success(
        'devices.devicesDeleted',
        this.languageService.translate('devices.devicesDeletedSuccess', {
          count: selectedDevicesList.length
        })
      );
    } catch (error) {
      console.error('Error deleting devices:', error);
      this.alertService.error(
        'errors.bulkDeleteError',
        'devices.updateErrorDescription'
      );
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Change status of multiple selected devices
   */
  async bulkStatusChange(newStatus: DeviceStatus): Promise<void> {
    if (this.selectedDevices.size === 0) {
      return;
    }

    const confirmMessage = this.languageService.translate('devices.confirmBulkStatusChange', {
      count: this.selectedDevices.size,
      status: this.getStatusTranslation(newStatus)
    });

    const result = await this.alertService.confirm(
      'devices.changeStatus',
      confirmMessage,
      'common.confirm',
      'common.cancel'
    );

    if (!result.isConfirmed) {
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    const statusPromises = Array.from(this.selectedDevices).map(deviceId =>
      this.apiService.updateDeviceStatus(deviceId, newStatus).toPromise()
    );

    try {
      await Promise.all(statusPromises);

      // Update local state
      this.devices.forEach(device => {
        if (this.selectedDevices.has(device.device_id)) {
    device.status = newStatus;
        }
      });

      this.selectedDevices.clear();
      this.applyFilters();

      this.alertService.success(
        'devices.statusUpdated',
        this.languageService.translate('devices.bulkStatusUpdated', {
          count: statusPromises.length,
          status: this.getStatusTranslation(newStatus)
        })
      );
    } catch (error) {
      console.error('Error updating device status:', error);
      this.alertService.error(
        'devices.updateError',
        'devices.updateErrorDescription'
      );
    } finally {
      this.isLoading = false;

     this.cdr.markForCheck();
    }
  }
  getDeviceCardAriaLabel(device: Device): string {
    return this.languageService.translate('devices.card.ariaLabel', { name: device.name });
  }

  getDeviceCardStatusLabel(device: Device): string {
    return this.languageService.translate('devices.card.statusLabel', {
      status: this.getStatusTranslation(device.status),
      lastSeen: this.formatLastSeen(device.last_seen)
    });
  }

  getDeviceLocationLabel(device: Device): string {
    return this.languageService.translate('devices.card.locationLabel', {
      location: device.location
    });
  }

  getDeviceToggleAriaLabel(device: Device): string {
    const action = device.status === 'online' ? 'deactivate' : 'activate';
    return this.languageService.translate(`devices.card.${action}ActionAria`, {
      name: device.name
    });
  }
}
