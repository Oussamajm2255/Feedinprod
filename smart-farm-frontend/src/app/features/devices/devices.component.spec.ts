/**
 * Devices Component Unit Tests
 * Comprehensive test suite for the Devices component
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { DevicesComponent } from './devices.component';
import { ApiService } from '../../core/services/api.service';
import { FarmManagementService } from '../../core/services/farm-management.service';
import { LanguageService } from '../../core/services/language.service';
import { AlertService } from '../../core/services/alert.service';
import { Device, DeviceStatus, Farm } from '../../core/models/farm.model';

describe('DevicesComponent', () => {
  let component: DevicesComponent;
  let fixture: ComponentFixture<DevicesComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let farmManagementSpy: jasmine.SpyObj<FarmManagementService>;
  let languageServiceSpy: jasmine.SpyObj<LanguageService>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;

  const mockFarm: Farm = {
    farm_id: 'farm-1',
    name: 'Test Farm',
    location: 'Test Location',
    owner_id: 'user-1',
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockDevices: Device[] = [
    {
      device_id: 'device-1',
      name: 'Sensor 1',
      location: 'Field A',
      device_type: 'sensor',
      status: DeviceStatus.ONLINE,
      farm_id: 'farm-1',
      created_at: new Date(),
      updated_at: new Date(),
      last_seen: new Date()
    },
    {
      device_id: 'device-2',
      name: 'Controller 1',
      location: 'Field B',
      device_type: 'controller',
      status: DeviceStatus.OFFLINE,
      farm_id: 'farm-1',
      created_at: new Date(),
      updated_at: new Date(),
      last_seen: new Date()
    },
    {
      device_id: 'device-3',
      name: 'Gateway 1',
      location: 'Main Building',
      device_type: 'gateway',
      status: DeviceStatus.MAINTENANCE,
      farm_id: 'farm-1',
      created_at: new Date(),
      updated_at: new Date(),
      last_seen: new Date()
    }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getDevicesByFarm',
      'updateDeviceStatus'
    ]);
    const farmSpy = jasmine.createSpyObj('FarmManagementService', ['getSelectedFarm'], {
      selectedFarm$: of(mockFarm)
    });
    const langSpy = jasmine.createSpyObj('LanguageService', ['t', 'translate']);
    const alertSpy = jasmine.createSpyObj('AlertService', [
      'success',
      'error',
      'info',
      'confirm',
      'custom',
      'prompt'
    ]);

    // Setup default spy returns
    apiSpy.getDevicesByFarm.and.returnValue(of(mockDevices));
    farmSpy.getSelectedFarm.and.returnValue(mockFarm);
    langSpy.t.and.returnValue(() => 'translated');
    langSpy.translate.and.returnValue('translated');
    alertSpy.confirm.and.returnValue(Promise.resolve({ isConfirmed: true, isDismissed: false, value: null }));

    await TestBed.configureTestingModule({
      imports: [DevicesComponent, NoopAnimationsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: FarmManagementService, useValue: farmSpy },
        { provide: LanguageService, useValue: langSpy },
        { provide: AlertService, useValue: alertSpy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    farmManagementSpy = TestBed.inject(FarmManagementService) as jasmine.SpyObj<FarmManagementService>;
    languageServiceSpy = TestBed.inject(LanguageService) as jasmine.SpyObj<LanguageService>;
    alertServiceSpy = TestBed.inject(AlertService) as jasmine.SpyObj<AlertService>;

    fixture = TestBed.createComponent(DevicesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load devices on init', (done) => {
      fixture.detectChanges();
      setTimeout(() => {
        expect(apiServiceSpy.getDevicesByFarm).toHaveBeenCalledWith('farm-1');
        expect(component.devices.length).toBe(3);
        done();
      }, 100);
    });

    it('should not load devices if no farm is selected', () => {
      farmManagementSpy.getSelectedFarm.and.returnValue(null);
      fixture.detectChanges();
      expect(component.devices.length).toBe(0);
    });
  });

  describe('Filtering', () => {
    beforeEach((done) => {
      fixture.detectChanges();
      setTimeout(() => done(), 100);
    });

    it('should filter devices by search term', () => {
      component.searchTerm = 'Sensor';
      component.onSearchChange();
      setTimeout(() => {
        expect(component.filteredDevices.length).toBe(1);
        expect(component.filteredDevices[0].name).toBe('Sensor 1');
      }, 400);
    });

    it('should filter devices by status', () => {
      component.statusFilter = 'online';
      component.onFilterChange();
      expect(component.filteredDevices.length).toBe(1);
      expect(component.filteredDevices[0].status).toBe(DeviceStatus.ONLINE);
    });

    it('should filter devices by type', () => {
      component.deviceTypeFilter = 'sensor';
      component.onFilterChange();
      expect(component.filteredDevices.length).toBe(1);
      expect(component.filteredDevices[0].device_type).toBe('sensor');
    });

    it('should clear all filters', () => {
      component.searchTerm = 'test';
      component.statusFilter = 'online';
      component.deviceTypeFilter = 'sensor';
      component.clearFilters();
      expect(component.searchTerm).toBe('');
      expect(component.statusFilter).toBe('');
      expect(component.deviceTypeFilter).toBe('');
      expect(component.filteredDevices.length).toBe(3);
    });
  });

  describe('Pagination', () => {
    beforeEach((done) => {
      fixture.detectChanges();
      setTimeout(() => done(), 100);
    });

    it('should update pagination when page changes', () => {
      component.onPageChange({ pageIndex: 1, pageSize: 10, length: 100 });
      expect(component.currentPage).toBe(1);
      expect(component.pageSize).toBe(10);
    });

    it('should update paginated devices correctly', () => {
      component.pageSize = 2;
      component.currentPage = 0;
      component['updatePagination']();
      expect(component.paginatedDevices.length).toBe(2);
    });
  });

  describe('Device Actions', () => {
    beforeEach((done) => {
      fixture.detectChanges();
      setTimeout(() => done(), 100);
    });

    it('should toggle device status', async () => {
      const device = component.devices[0];
      apiServiceSpy.updateDeviceStatus.and.returnValue(of({
        ...device,
        status: DeviceStatus.OFFLINE
      }));

      await component.toggleDeviceStatus(device);

      expect(alertServiceSpy.confirm).toHaveBeenCalled();
      expect(apiServiceSpy.updateDeviceStatus).toHaveBeenCalledWith('device-1', 'offline');
    });

    it('should not toggle status if user cancels', async () => {
      alertServiceSpy.confirm.and.returnValue(Promise.resolve({ isConfirmed: false, isDismissed: true, value: null }));
      const device = component.devices[0];

      await component.toggleDeviceStatus(device);

      expect(apiServiceSpy.updateDeviceStatus).not.toHaveBeenCalled();
    });

    it('should handle status toggle error gracefully', async () => {
      const device = component.devices[0];
      const originalStatus = device.status;
      apiServiceSpy.updateDeviceStatus.and.returnValue(throwError(() => new Error('API Error')));

      await component.toggleDeviceStatus(device);

      setTimeout(() => {
        expect(device.status).toBe(originalStatus); // Rollback
        expect(alertServiceSpy.error).toHaveBeenCalled();
      }, 100);
    });
  });

  describe('View Mode', () => {
    it('should toggle between cards and table view', () => {
      expect(component.viewMode).toBe('cards');
      component.toggleViewMode();
      expect(component.viewMode).toBe('table');
      component.toggleViewMode();
      expect(component.viewMode).toBe('cards');
    });
  });

  describe('Data Export', () => {
    beforeEach((done) => {
      fixture.detectChanges();
      setTimeout(() => done(), 100);
    });

    it('should export device data to CSV', async () => {
      alertServiceSpy.prompt.and.returnValue(
        Promise.resolve({ isConfirmed: true, isDismissed: false, value: 'devices.csv' })
      );

      spyOn(document, 'createElement').and.callThrough();
      await component.exportDeviceData();

      expect(alertServiceSpy.prompt).toHaveBeenCalled();
      expect(alertServiceSpy.success).toHaveBeenCalled();
    });

    it('should not export if user cancels', async () => {
      alertServiceSpy.prompt.and.returnValue(
        Promise.resolve({ isConfirmed: false, isDismissed: true, value: undefined })
      );

      await component.exportDeviceData();

      expect(alertServiceSpy.success).not.toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    beforeEach((done) => {
      fixture.detectChanges();
      setTimeout(() => done(), 100);
    });

    it('should calculate device statistics correctly', async () => {
      await component.showDeviceStatistics();

      expect(alertServiceSpy.custom).toHaveBeenCalled();
      const callArgs = alertServiceSpy.custom.calls.mostRecent().args[0];
      expect(callArgs.html).toContain('3'); // Total devices
    });
  });

  describe('Computed Properties', () => {
    it('should correctly compute hasActiveFilters', () => {
      expect(component.hasActiveFilters).toBe(false);
      component.searchTerm = 'test';
      expect(component.hasActiveFilters).toBe(true);
    });

    it('should correctly compute activeFilterCount', () => {
      expect(component.activeFilterCount).toBe(0);
      component.searchTerm = 'test';
      expect(component.activeFilterCount).toBe(1);
      component.statusFilter = 'online';
      expect(component.activeFilterCount).toBe(2);
      component.deviceTypeFilter = 'sensor';
      expect(component.activeFilterCount).toBe(3);
    });
  });

  describe('TrackBy Function', () => {
    it('should return device_id for trackBy', () => {
      const device = mockDevices[0];
      const result = component.trackByDeviceId(0, device);
      expect(result).toBe('device-1');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors when loading devices', (done) => {
      apiServiceSpy.getDevicesByFarm.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.loadDevices();

      setTimeout(() => {
        expect(alertServiceSpy.error).toHaveBeenCalled();
        expect(component.devices.length).toBe(0);
        done();
      }, 100);
    });
  });

  describe('Cleanup', () => {
    it('should complete destroy$ subject on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});
