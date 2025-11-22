import { Injectable, inject } from '@angular/core';
import { interval, firstValueFrom } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';
import { ActionLog } from '../models/action-log.model';

@Injectable({ providedIn: 'root' })
export class ActionEventsService {
  private api = inject(ApiService);
  private notifications = inject(NotificationService);

  private lastSeenActionIds = new Set<string>();
  private started = false;

  start() {
    if (this.started) return;
    this.started = true;

    interval(15000).pipe(startWith(0)).subscribe(async () => {
      try {
        const res = await firstValueFrom(this.api.getActions({ limit: 20 }));
        const items = res?.items ?? [];
        for (const a of items) {
          if (this.lastSeenActionIds.has(a.id)) continue;
          this.lastSeenActionIds.add(a.id);
          const key = `action-global:${a.device_id}:${a.status}:${a.action_uri}`;
          if (a.status === 'error') {
            if (this.notifications.shouldNotify(key, 'critical')) {
              this.notifications.notify('critical', 'Action failed', `${a.device_id} • ${a.action_uri}`, { source: 'action', context: a });
            }
          } else if (a.status === 'sent' || a.status === 'ack') {
            if (this.notifications.shouldNotify(key, 'success')) {
              this.notifications.notify('success', 'Action executed', `${a.device_id} • ${a.action_uri}`, { source: 'action', context: a });
            }
          }
        }
        // prevent unbounded growth
        if (this.lastSeenActionIds.size > 500) {
          this.lastSeenActionIds = new Set(Array.from(this.lastSeenActionIds).slice(-200));
        }
      } catch {
        // ignore
      }
    });
  }
}
