export interface ServicemanData {
  company?: 'Solid' | 'Garda' | '';
  firstName: string;
  lastName: string;
  phone: string;
}

export interface BranchData {
  branchNumber: string;
  city: string;
  street: string;
  branchType?: 'wyspa' | 'korporacje' | 'detal' | '';
}

export interface CctvRow {
  model: string;
  customModel?: string;
  serialNumber: string;
  inventoryNumber: string;
  analogCount: number | '';
  digitalCount: number | '';
}

export interface CctvData {
  rows: CctvRow[]; // exactly 3 rows required as per user's prompt
  inRack: boolean | null; // null, true (tak), false (nie)
  comment: string;
}

export type AuthType = 'czytnik' | 'klawiatura' | '';
export type HandleType = 'gałka' | 'pochwyt' | 'klamka' | '';
export type LockMethod = 'elektrozaczep' | 'zwora' | 'abloy' | '';

export interface DoorRow {
  id: string;
  name: string;
  authType: AuthType;
  handleType: HandleType;
  lockOnArmed: boolean | null;
  lockMethod: LockMethod;
}

export type AtmLockType = 'sterownik_bez_czytnika' | 'sterownik_z_czytnikiem' | 'ca_czytnik' | 'ca_czytnik_dahua' | 'ca_czytnik_dahua_glosnik' | '';

export interface AtmVestibule {
  hasLock: boolean | 'no_vestibule' | null;
  lockType: AtmLockType; // 'czytnik' (czytnikiem), 'analityka' (kamerą z analityką), 'glosnik' (kamera+głośnik)
}

export type BatteryCapacity = 'brak_aku' | '7' | '17' | '42' | '65';

export interface BatteryRow {
  id: string;
  name: string; // Left table: 'Centrala alarmowa', 'Ekspander 1', 'Ekspander 2', etc. Right table: 'Zasilacz SSWiN', 'Zasilacz SKD', etc.
  capacity: BatteryCapacity;
  efficiency?: number; // in % (0 - 100)
  installationDate?: string; // YYYY-MM-DD
}

export interface BatteryData {
  leftTable: BatteryRow[]; // SSWiN/Alarm panels
  rightTable: BatteryRow[]; // Power supplies (Zasilacz SSWiN / Zasilacz SKD)
  fuseType?: string;
}

export interface MonitoringRow {
  signalName: string; // e.g. "Włamanie - transmisja do SMA"
  transmitter: boolean | null; // "Po nadajniku" (tak/nie/null)
  secondPath: boolean | null; // "Drugi tor monitorowania" (tak/nie/null)
}

export interface MonitoringData {
  rows: MonitoringRow[];
  secondPathType: 'linia_telefoniczna' | 'epx400' | 'drugi_gsm' | 'inne' | '';
  secondPathOtherText?: string;
  gsmTransmitterNumber?: string;
  secondPathTransmitterNumber?: string;
}

export interface AdditionalTask {
  id: string;
  title: string;
  description?: string;
  branchFilter: string; // 'Wszystkie' or specific branch number
  createdAt: string;
}

export interface ProtocolTask {
  taskId: string;
  title: string;
  description?: string;
  branchFilter: string;
  isCompleted: boolean;
  comment?: string;
}

export interface MaintenanceProtocol {
  id: string;
  serviceman: ServicemanData;
  branch: BranchData;
  cctv: CctvData;
  skdDoors: DoorRow[];
  skdComment?: string;
  atmVestibule: AtmVestibule;
  batteries: BatteryData;
  monitoring: MonitoringData;
  startTime: string; // YYYY-MM-DDTHH:mm
  endTime: string; // YYYY-MM-DDTHH:mm
  createdAt: string;
  isTemplate: boolean;
  photoVerification?: string;
  additionalTasks?: ProtocolTask[];
}
