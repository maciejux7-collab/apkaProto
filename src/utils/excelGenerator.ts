import * as XLSX from 'xlsx';
import { MaintenanceProtocol } from '../types';

function formatMonthYear(dateStr: string): string {
  if (!dateStr) return '---';
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    const [year, month] = dateStr.split('-');
    return `${month}.${year}`;
  }
  return dateStr;
}

function buildWorkbook(protocol: MaintenanceProtocol) {
  const wb = XLSX.utils.book_new();

  // 1. General Data Sheet
  const generalData = [
    ['PROTOKÓŁ KONSERWACJI SYSTEMÓW BEZPIECZEŃSTWA'],
    [],
    ['1. DANE SERWISANTA'],
    ['Firma', protocol.serviceman.company || 'Nie wybrano'],
    ['Imię i nazwisko', `${protocol.serviceman.firstName} ${protocol.serviceman.lastName}`],
    ['Telefon', protocol.serviceman.phone || 'Nie podano'],
    [],
    ['2. DANE ODDZIAŁU BANKU'],
    ['Numer oddziału', protocol.branch.branchNumber],
    ['Miejscowość', protocol.branch.city],
    ['Ulica', protocol.branch.street],
    [],
    ['3. CZAS PRACY'],
    ['Rozpoczęcie', protocol.startTime ? new Date(protocol.startTime).toLocaleString('pl-PL') : '---'],
    ['Zakończenie', protocol.endTime ? new Date(protocol.endTime).toLocaleString('pl-PL') : '---'],
    ['Wygenerowano', new Date(protocol.createdAt).toLocaleString('pl-PL')],
  ];

  const wsGeneral = XLSX.utils.aoa_to_sheet(generalData);
  XLSX.utils.book_append_sheet(wb, wsGeneral, 'Dane ogólne');

  // 2. CCTV Sheet
  const cctvRows = [
    ['MODEL REJESTRATORA', 'NUMER SERYJNY', 'NUMER INWENTARZOWY', 'KAMERY ANALOGOWE', 'KAMERY CYFROWE (IP)']
  ];
  protocol.cctv.rows.forEach(r => {
    cctvRows.push([
      r.model || '---',
      r.serialNumber || '---',
      r.inventoryNumber || '---',
      r.analogCount.toString(),
      r.digitalCount.toString()
    ]);
  });
  cctvRows.push([]);
  cctvRows.push(['Szafa rack/serwerowa', protocol.cctv.inRack ? 'TAK' : 'NIE']);
  cctvRows.push(['Uwagi / Komentarz', protocol.cctv.comment || 'Brak uwag.']);

  const wsCctv = XLSX.utils.aoa_to_sheet(cctvRows);
  XLSX.utils.book_append_sheet(wb, wsCctv, 'CCTV');

  const isIsland = protocol.branch.branchType === 'wyspa';

  // 3. SKD Sheet
  if (!isIsland) {
    const skdRows = [
      ['NAZWA DRZWI', 'WEJŚCIE ZA POMOCĄ', 'TYP OKUCIA', 'ŚLUZOWANIE', 'TYP RYGLOWANIA']
    ];
    protocol.skdDoors.forEach(d => {
      skdRows.push([
        d.name || '---',
        d.authType === 'czytnik' ? 'Czytnik' : d.authType === 'klawiatura' ? 'Klawiatura' : 'Nie wybrano',
        d.handleType === 'gałka' ? 'Gałka' : d.handleType === 'pochwyt' ? 'Pochwyt' : d.handleType === 'klamka' ? 'Klamka' : 'Nie wybrano',
        d.lockOnArmed === true ? 'TAK' : d.lockOnArmed === false ? 'NIE' : 'Nie wybrano',
        d.lockMethod === 'elektrozaczep' ? 'Elektrozaczep' : d.lockMethod === 'zwora' ? 'Zwora' : d.lockMethod === 'abloy' ? 'Zamek Abloy' : 'Nie wybrano'
      ]);
    });
    skdRows.push([]);
    skdRows.push(['Uwagi SKD', protocol.skdComment || 'Brak uwag.']);
    skdRows.push([]);
    skdRows.push([
      'Blokada przedsionka bankomatowego',
      protocol.atmVestibule.hasLock === 'no_vestibule' ? 'NIE (nie ma przedsionka)' :
      protocol.atmVestibule.hasLock === true ? 'TAK (jest blokada)' : 'NIE (brak blokady)'
    ]);
    if (protocol.atmVestibule.hasLock === true) {
      skdRows.push([
        'Typ blokady przedsionka',
        protocol.atmVestibule.lockType === 'sterownik_bez_czytnika' ? 'sterownik bez czytnika' :
        protocol.atmVestibule.lockType === 'sterownik_z_czytnikiem' ? 'sterownik z czytnikiem' :
        protocol.atmVestibule.lockType === 'ca_czytnik' ? 'na CA z czytnikiem' :
        protocol.atmVestibule.lockType === 'ca_czytnik_dahua' ? 'na CA z czytnikiem i kamerą Dahua' :
        protocol.atmVestibule.lockType === 'ca_czytnik_dahua_glosnik' ? 'na CA z czytnikiem, kamerą Dahua i głośnikiem' : 'Nie określono'
      ]);
    }

    const wsSkd = XLSX.utils.aoa_to_sheet(skdRows);
    XLSX.utils.book_append_sheet(wb, wsSkd, 'SKD');
  }

  // 4. Monitoring Sheet
  const monitoringHeaders = isIsland ? ['SYGNAŁ', 'PO NADAJNIKU'] : ['SYGNAŁ', 'PO NADAJNIKU', 'DRUGI TOR MONITOROWANIA'];
  const monitoringRows = [monitoringHeaders];

  if (protocol.monitoring && protocol.monitoring.rows) {
    protocol.monitoring.rows.forEach(m => {
      const row = [
        m.signalName,
        m.transmitter === true ? 'TAK' : m.transmitter === false ? 'NIE' : 'brak'
      ];
      if (!isIsland) {
        row.push(m.secondPath === true ? 'TAK' : m.secondPath === false ? 'NIE' : 'brak');
      }
      monitoringRows.push(row);
    });
  }
  monitoringRows.push([]);

  if (!isIsland) {
    let pathTypeStr = 'Nie wybrano';
    if (protocol.monitoring) {
      const t = protocol.monitoring.secondPathType;
      if (t === 'linia_telefoniczna') pathTypeStr = 'Linia telefoniczna';
      else if (t === 'epx400') pathTypeStr = 'Nadajnik EPX400';
      else if (t === 'drugi_gsm') pathTypeStr = 'Drugi nadajnik GSM';
      else if (t === 'inne') pathTypeStr = `Inne: ${protocol.monitoring.secondPathOtherText || ''}`;
    }
    monitoringRows.push(['Drugim torem monitorowania oddziału jest', pathTypeStr]);
  }

  if (protocol.monitoring?.gsmTransmitterNumber) {
    monitoringRows.push(['Numer nadajnika GSM na stacji SMA', protocol.monitoring.gsmTransmitterNumber]);
  }
  if (!isIsland && protocol.monitoring?.secondPathTransmitterNumber) {
    monitoringRows.push(['Numer nadajnika 2go toru na stacji SMA', protocol.monitoring.secondPathTransmitterNumber]);
  }

  const wsMonitoring = XLSX.utils.aoa_to_sheet(monitoringRows);
  XLSX.utils.book_append_sheet(wb, wsMonitoring, 'Monitoring');

  // 5. Batteries Sheet
  const batteryRows = [
    ['AKUMULATORY CENTRALA I EKSPANDERY'],
    ['Urządzenie', 'Pojemność (Ah)', 'Sprawność (%)', 'Data montażu']
  ];
  protocol.batteries.leftTable.forEach(b => {
    batteryRows.push([
      b.name,
      b.capacity === 'brak_aku' ? 'brak aku' : b.capacity,
      b.efficiency !== undefined ? `${b.efficiency}%` : 'nie podano',
      b.installationDate ? formatMonthYear(b.installationDate) : 'nie podano'
    ]);
  });

  if (!isIsland) {
    batteryRows.push([]);
    batteryRows.push(['ZASILACZE SSWIN / SKD']);
    batteryRows.push(['Urządzenie', 'Pojemność (Ah)', 'Sprawność (%)', 'Data montażu']);
    protocol.batteries.rightTable.forEach(b => {
      batteryRows.push([
        b.name,
        b.capacity === 'brak_aku' ? 'brak aku' : b.capacity,
        b.efficiency !== undefined ? `${b.efficiency}%` : 'nie podano',
        b.installationDate ? formatMonthYear(b.installationDate) : 'nie podano'
      ]);
    });

    batteryRows.push([]);
    batteryRows.push(['Dedykowany bezpiecznik w rozdzielni pod alarm', protocol.batteries.fuseType || 'nie podano']);
  }

  const wsBatteries = XLSX.utils.aoa_to_sheet(batteryRows);
  XLSX.utils.book_append_sheet(wb, wsBatteries, 'Akumulatory');

  // 6. Additional Tasks Sheet
  if (protocol.additionalTasks && protocol.additionalTasks.length > 0) {
    const taskRows = [
      ['ZADANIE DODATKOWE', 'PRZYPISANY ODDZIAŁ', 'STATUS', 'KOMENTARZ / UWAGI TECHNIKA']
    ];
    protocol.additionalTasks.forEach(t => {
      taskRows.push([
        t.title,
        t.branchFilter,
        t.isCompleted ? 'WYKONANO' : 'NIE WYKONANO',
        t.comment || '---'
      ]);
    });
    const wsTasks = XLSX.utils.aoa_to_sheet(taskRows);
    XLSX.utils.book_append_sheet(wb, wsTasks, 'Zadania dodatkowe');
  }

  // 7. DATA FOR MACRO SHEET (The "Flat" data dump)
  const macroRows = [
    ['BRANCH_ID', 'DATE', 'DEVICE_LOGICAL_ID', 'CATEGORY', 'DEVICE_TYPE', 'NAME_MODEL', 'SERIAL_NUMBER', 'INVENTORY_NUMBER', 'EFFICIENCY_OR_STATUS', 'CAPACITY_AH', 'INSTALL_DATE', 'COMMENT']
  ];

  const branchId = protocol.branch.branchNumber;
  const protocolDate = new Date(protocol.createdAt).toISOString().split('T')[0];

  // Recorders
  protocol.cctv.rows.forEach((r, idx) => {
    macroRows.push([
      branchId, protocolDate, `${branchId}-REC-${idx + 1}`, 'CCTV', 'REJESTRATOR',
      r.model || '', r.serialNumber || '', r.inventoryNumber || '', 'OK', '', '', ''
    ]);
  });

  // Batteries Central Table
  protocol.batteries.leftTable.forEach((b, idx) => {
    macroRows.push([
      branchId, protocolDate, `${branchId}-BAT-PANEL-${idx + 1}`, 'ZASILANIE', 'AKU_CENTRALA',
      b.name || '', '', '', b.efficiency !== undefined ? `${b.efficiency}%` : '', b.capacity || '', b.installationDate || '', ''
    ]);
  });

  // Batteries PSU Table
  protocol.batteries.rightTable.forEach((b, idx) => {
    macroRows.push([
      branchId, protocolDate, `${branchId}-BAT-PSU-${idx + 1}`, 'ZASILANIE', 'AKU_ZASILACZ',
      b.name || '', '', '', b.efficiency !== undefined ? `${b.efficiency}%` : '', b.capacity || '', b.installationDate || '', ''
    ]);
  });

  // Doors
  protocol.skdDoors.forEach((d, idx) => {
    macroRows.push([
      branchId, protocolDate, `${branchId}-DOOR-${idx + 1}`, 'SKD', 'DRZWI',
      d.name || '', '', '', 'OK', '', '', `Metoda: ${d.lockMethod}`
    ]);
  });

  const wsMacro = XLSX.utils.aoa_to_sheet(macroRows);
  XLSX.utils.book_append_sheet(wb, wsMacro, 'DANE_DLA_MAKRA');

  return wb;
}

export function downloadExcelProtocol(protocol: MaintenanceProtocol) {
  const wb = buildWorkbook(protocol);
  const dateStr = new Date(protocol.createdAt).toISOString().split('T')[0];
  XLSX.writeFile(wb, `protokol_konserwacji_${protocol.branch.branchNumber}_${dateStr}.xlsx`);
}

export function getExcelBase64(protocol: MaintenanceProtocol): string {
  const wb = buildWorkbook(protocol);
  return XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
}
