export interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  active: boolean;
}

export interface Branch {
  id: string;
  branchNumber: string;
  city: string;
  address: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceIntervalMonths: number;
}

export interface AccessToken {
  id: string;
  branchId: string;
  technicianId: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface MaintenanceSchedule {
  branchId: string;
  branchNumber: string;
  city: string;
  lastDate?: string;
  nextDate: string;
  daysRemaining: number;
  status: 'ok' | 'warning' | 'urgent';
}
