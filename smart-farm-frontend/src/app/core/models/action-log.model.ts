export interface ActionLog {
  id: string;
  created_at: string;
  updated_at: string;
  trigger_source: 'auto' | 'manual';
  device_id: string;
  sensor_id?: string | null;
  sensor_type?: string | null;
  value?: number | null;
  unit?: string | null;
  violation_type?: string | null;
  action_uri: string;
  status: 'queued' | 'sent' | 'ack' | 'error' | 'timeout' | 'failed';
  topic?: string | null;
  error_message?: string | null;
  payload?: any | null;
  // Production-ready fields
  action_id?: string | null;
  action_type?: 'critical' | 'important' | 'normal' | null;
  qos_level?: number | null;
  retain_flag?: boolean | null;
  sent_at?: string | null;
  ack_at?: string | null;
  timeout_at?: string | null;
  failed_at?: string | null;
  retry_count?: number;
  max_retries?: number;
}

export interface ListActionsResponse {
  items: ActionLog[];
  total: number;
}

export interface ExecuteActionRequest {
  deviceId: string;
  action: string;
  actionId?: string; // Frontend-generated action ID for tracking
  actionType?: 'critical' | 'important' | 'normal';
  payload?: any;
  context?: {
    sensorId?: string;
    sensorType?: string;
    value?: number;
    unit?: string;
    violationType?: string;
  };
}

