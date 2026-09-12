import { MaintenanceProtocol } from '../types';

export function generateTextProtocol(protocol: MaintenanceProtocol): string {
  const s = protocol.serviceman;
  const b = protocol.branch;
  const c = protocol.cctv;
  const doors = protocol.skdDoors;
  const atm = protocol.atmVestibule;
  const bat = protocol.batteries;
  const isIsland = b.branchType === 'wyspa';

  let text = `==================================================
PROTOKÓŁ KONSERWACJI SYSTEMÓW BEZPIECZEŃSTWA
==================================================
Wygenerowano: ${new Date(protocol.createdAt).toLocaleString('pl-PL')}

1. DANE SERWISANTA
--------------------------------------------------
Firma: ${s.company || 'Nie wybrano'}
Imię i Nazwisko: ${s.firstName} ${s.lastName}
Telefon kontaktowy: ${s.phone || 'Nie podano'}

2. DANE ODDZIAŁU
--------------------------------------------------
Numer oddziału: ${b.branchNumber}
Miejscowość: ${b.city}
Adres: ${b.street}
Typ oddziału: ${b.branchType || '---'}

3. SYSTEM TELEWIZJI DOZOROWEJ (CCTV)
--------------------------------------------------
Rejestratory (${c.rows.length} urządzeń/urządzenia):
${c.rows.map((row, i) => `  Urządzenie #${i + 1}:
  - Model rejestratora: ${row.model === 'inne' ? row.customModel || 'inne' : row.model || '---'}
  - Numer seryjny: ${row.serialNumber || '---'}
  - Numer inwentarzowy: ${row.inventoryNumber || '---'}
  - Ilość kamer analogowych: ${row.analogCount}
  - Ilość kamer cyfrowych (IP): ${row.digitalCount}`).join('\n\n')}

Czy rejestrator jest w szafie serwerowej: ${c.inRack === true ? 'TAK' : c.inRack === false ? 'NIE' : 'NIE OKREŚLONO'}
Komentarz: ${c.comment || 'Brak uwag/komentarzy.'}
`;

  if (!isIsland) {
    text += `
4. SYSTEM KONTROLI DOSTĘPU (SKD)
--------------------------------------------------
Drzwi objęte kontrolą dostępu:
${doors.length === 0 ? '  Brak zdefiniowanych drzwi.' : doors.map((d, i) => `  Drzwi #${i + 1}: ${d.name || 'Bez nazwy'}
  - Wejście za pomocą: ${d.authType === 'czytnik' ? 'Czytnik' : d.authType === 'klawiatura' ? 'Klawiatura' : 'Nie wybrano'}
  - Typ okucia: ${d.handleType === 'gałka' ? 'Gałka' : d.handleType === 'pochwyt' ? 'Pochwyt' : d.handleType === 'klamka' ? 'Klamka' : 'Nie wybrano'}
  - Śluzowanie: ${d.lockOnArmed === true ? 'TAK' : d.lockOnArmed === false ? 'NIE' : 'Nie wybrano'}
  - Typ ryglowania: ${d.lockMethod === 'elektrozaczep' ? 'Elektrozaczep' : d.lockMethod === 'zwora' ? 'Zwora' : d.lockMethod === 'abloy' ? 'Zamek Abloy' : 'Nie wybrano'}`).join('\n\n')}

Uwagi do drzwi SKD: ${protocol.skdComment || 'Brak uwag.'}

Blokada przedsionka bankomatowego: ${
  atm.hasLock === 'no_vestibule' ? 'NIE (nie ma przedsionka)' :
  atm.hasLock === true ? `TAK (jest blokada), ${
    atm.lockType === 'sterownik_bez_czytnika' ? 'sterownik bez czytnika' :
    atm.lockType === 'sterownik_z_czytnikiem' ? 'sterownik z czytnikiem' :
    atm.lockType === 'ca_czytnik' ? 'na CA z czytnikiem' :
    atm.lockType === 'ca_czytnik_dahua' ? 'na CA z czytnikiem i kamerą Dahua' :
    atm.lockType === 'ca_czytnik_dahua_glosnik' ? 'na CA z czytnikiem, kamerą Dahua i głośnikiem' : 'Nie określono'
  }` : 'NIE (brak blokady)'
}
`;
  }

  text += `
${isIsland ? '4' : '5'}. MONITORING I TRANSMISJA SMA
--------------------------------------------------
Transmisja sygnałów do SMA:
${!protocol.monitoring?.rows ? '  Brak danych.' : protocol.monitoring.rows.map(r => {
  const transStr = r.transmitter === true ? 'TAK' : r.transmitter === false ? 'NIE' : 'brak';
  const pathStr = r.secondPath === true ? 'TAK' : r.secondPath === false ? 'NIE' : 'brak';
  return isIsland 
    ? `  - ${r.signalName}: Po nadajniku: ${transStr}`
    : `  - ${r.signalName}: Po nadajniku: ${transStr} | Drugi tor: ${pathStr}`;
}).join('\n')}
`;

  if (!isIsland) {
    text += `
Drugim torem monitorowania oddziału jest: ${
  !protocol.monitoring ? 'brak' :
  protocol.monitoring.secondPathType === 'linia_telefoniczna' ? 'Linia telefoniczna' :
  protocol.monitoring.secondPathType === 'epx400' ? 'Nadajnik EPX400' :
  protocol.monitoring.secondPathType === 'drugi_gsm' ? 'Drugi nadajnik GSM' :
  protocol.monitoring.secondPathType === 'inne' ? `Inne: ${protocol.monitoring.secondPathOtherText || ''}` : 'Nie wybrano'
}
`;
  }

  text += `${protocol.monitoring?.gsmTransmitterNumber ? `Numer nadajnika GSM na stacji SMA: ${protocol.monitoring.gsmTransmitterNumber}\n` : ''}${(!isIsland && protocol.monitoring?.secondPathTransmitterNumber) ? `Numer nadajnika 2go toru na stacji SMA: ${protocol.monitoring.secondPathTransmitterNumber}\n` : ''}`;

  text += `
${isIsland ? '5' : '6'}. AKUMULATORY (SSWiN / SKD)
--------------------------------------------------
Centrala i ekspandery:
${bat.leftTable.length === 0 ? '  Brak urządzeń.' : bat.leftTable.map(r => {
  const formattedDate = r.installationDate && /^\d{4}-\d{2}$/.test(r.installationDate)
    ? `${r.installationDate.split('-')[1]}.${r.installationDate.split('-')[0]}`
    : r.installationDate || '---';
  const capacityStr = r.capacity === 'brak_aku' ? 'brak aku' : `${r.capacity}Ah`;
  return `  - ${r.name}: Pojemność ${capacityStr} | Sprawność ${r.efficiency !== undefined ? `${r.efficiency}%` : 'nie podano'} | Data montażu: ${formattedDate}`;
}).join('\n')}
`;

  if (!isIsland) {
    text += `
Zasilacz SSWiN / SKD:
${bat.rightTable.length === 0 ? '  Brak urządzeń.' : bat.rightTable.map(r => {
  const formattedDate = r.installationDate && /^\d{4}-\d{2}$/.test(r.installationDate)
    ? `${r.installationDate.split('-')[1]}.${r.installationDate.split('-')[0]}`
    : r.installationDate || '---';
  const capacityStr = r.capacity === 'brak_aku' ? 'brak aku' : `${r.capacity}Ah`;
  return `  - ${r.name}: Pojemność ${capacityStr} | Sprawność ${r.efficiency !== undefined ? `${r.efficiency}%` : 'nie podano'} | Data montażu: ${formattedDate}`;
}).join('\n')}

Dedykowany bezpiecznik w rozdzielni: ${bat.fuseType || 'nie podano'}
`;
  }

  text += `
${isIsland ? '6' : '7'}. CZAS PRACY I PODSUMOWANIE
--------------------------------------------------
Rozpoczęcie konserwacji: ${protocol.startTime ? new Date(protocol.startTime).toLocaleString('pl-PL') : '---'}
Zakończenie konserwacji: ${protocol.endTime ? new Date(protocol.endTime).toLocaleString('pl-PL') : '---'}
`;

  if (protocol.additionalTasks && protocol.additionalTasks.length > 0) {
    text += `
ZADANIA DODATKOWE I WYTYCZNE:
--------------------------------------------------
${protocol.additionalTasks.map((t, i) => `  - [${t.isCompleted ? 'X' : ' '}] ${t.title}
    Status: ${t.isCompleted ? 'WYKONANO' : 'NIE WYKONANO'}
    Uwagi: ${t.comment || 'Brak'}`).join('\n\n')}
`;
  }

  text += `
Status konserwacji: ZAKOŃCZONO POMYŚLNIE

Fotoweryfikacja odbioru: ${protocol.photoVerification ? 'TAK (Zdjęcie dołączone do dokumentu PDF)' : 'NIE (Brak załączonego zdjęcia)'}

Podpis serwisanta: .......................................
==================================================`;

  return text;
}

export function generateMailtoUrl(protocol: MaintenanceProtocol): string {
  const recipient = 'artur236@poczta.onet.pl,adrozdz94@gmail.com';
  const branchInfo = `${protocol.branch.branchNumber} - ${protocol.branch.city}`;
  const subject = encodeURIComponent(`Protokół konserwacji SSWiN/SKD - Oddział ${branchInfo}`);
  const body = encodeURIComponent(generateTextProtocol(protocol));
  return `mailto:${recipient}?subject=${subject}&body=${body}`;
}

export function downloadTextFile(protocol: MaintenanceProtocol) {
  const text = generateTextProtocol(protocol);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const dateStr = new Date(protocol.createdAt).toISOString().split('T')[0];
  const branchNum = protocol.branch.branchNumber || 'oddzial';
  link.download = `protokol_konserwacji_${branchNum}_${dateStr}.txt`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
