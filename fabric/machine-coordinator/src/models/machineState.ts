export interface MachineState {
  machineId: string;
  name: string;
  type: string; // 'motor', 'sensor', 'conveyor', 'robot', etc.
  location: string;
  status: MachineStatus; // 'stopped', 'running', 'paused', 'maintenance', 'error'
  currentMode: MachineMode; // 'manual', 'automatic', 'emergency'
  operator: string;
  lastStateChange: number;
  totalOperatingHours: number;
  lastMaintenance: number;
  nextMaintenanceDue: number;
  slaCompliance: SLAMetrics;
  performanceMetrics: PerformanceMetrics;
}

export type MachineStatus = 'stopped' | 'running' | 'paused' | 'maintenance' | 'error';
export type MachineMode = 'manual' | 'automatic' | 'emergency';

export interface SLAMetrics {
  uptimeTarget: number; // Porcentaje objetivo (ej: 95)
  currentUptime: number; // Porcentaje actual
  responseTimeTarget: number; // Milisegundos objetivo
  currentResponseTime: number; // Milisegundos actual
  lastSLAUpdate: number;
  slaViolations: number;
  lastViolation: number;
}

export interface PerformanceMetrics {
  temperature: number;
  pressure: number;
  vibration: number;
  efficiency: number; // Porcentaje
  powerConsumption: number; // kWh
  throughput: number; // Unidades por hora
  lastMetricsUpdate: number;
}

export interface StateTransition {
  transitionId: string;
  machineId: string;
  fromStatus: MachineStatus;
  toStatus: MachineStatus;
  fromMode: MachineMode;
  toMode: MachineMode;
  operator: string;
  timestamp: number;
  reason?: string;
  slaImpact?: boolean; // Si la transición afecta el SLA
}

export interface MaintenanceSchedule {
  machineId: string;
  maintenanceType: 'preventive' | 'corrective' | 'emergency';
  scheduledDate: number;
  estimatedDuration: number; // Minutos
  assignedTechnician: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  description: string;
  createdAt: number;
  updatedAt: number;
} 