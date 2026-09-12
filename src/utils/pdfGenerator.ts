import { jsPDF } from 'jspdf';
import { MaintenanceProtocol } from '../types';

// Helper to sanitize Polish diacritics for built-in Helvetica font to prevent glyph rendering issues
export function sanitizeText(str: string): string {
  if (!str) return '';
  const charsMap: { [key: string]: string } = {
    'ą': 'a', 'Ą': 'A',
    'ć': 'c', 'Ć': 'C',
    'ę': 'e', 'Ę': 'E',
    'ł': 'l', 'Ł': 'L',
    'ń': 'n', 'Ń': 'N',
    'ó': 'o', 'Ó': 'O',
    'ś': 's', 'Ś': 'S',
    'ź': 'z', 'Ź': 'Z',
    'ż': 'z', 'Ż': 'Z'
  };
  return str.split('').map(char => charsMap[char] || char).join('');
}

export function generatePdfDocument(protocol: MaintenanceProtocol): jsPDF {
  // Create jsPDF instance (A4 size, portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  let currentY = 16;
  const isIsland = protocol.branch.branchType === 'wyspa';

  // Primary colors
  const primaryColor = [30, 41, 59]; // Slate 800 (#1e293b)
  const accentColor = [79, 70, 229]; // Indigo 600 (#4f46e5)
  const lightBgColor = [248, 250, 252]; // Slate 50 (#f8fafc)
  const borderColor = [226, 232, 240]; // Slate 200 (#e2e8f0)
  const grayTextColor = [100, 116, 139]; // Slate 500 (#64748b)

  // Helper functions
  const drawHeader = (title: string) => {
    // Top colored banner
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Accent line
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(0, 28, pageWidth, 2, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(sanitizeText(title), marginX, 13);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(199, 210, 254); // Indigo 200
    doc.text(`PROTOKOL KONSERWACJI SYSTEMOW SSWiN / CCTV / SKD`, marginX, 20);

    // Date
    const todayStr = new Date(protocol.createdAt).toLocaleDateString('pl-PL');
    doc.text(`Data sporzadzenia: ${todayStr}`, pageWidth - marginX - 50, 15);

    currentY = 38;
  };

  const drawFooter = (pageNumber: number) => {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(grayTextColor[0], grayTextColor[1], grayTextColor[2]);
    doc.text(
      sanitizeText('Wygenerowano z aplikacji mobilnej Protokol Konserwacji Bankowej.'),
      marginX,
      pageHeight - 10
    );
    doc.text(`Strona ${pageNumber}`, pageWidth - marginX - 15, pageHeight - 10);
  };

  const checkPageBreak = (spaceNeeded: number) => {
    if (currentY + spaceNeeded > pageHeight - 20) {
      doc.addPage();
      drawHeader('PROTOKOL KONSERWACJI - C.D.');
      drawFooter(2);
      currentY = 40;
      return true;
    }
    return false;
  };

  // --- START PDF ---
  drawHeader('PROTOKOL KONSERWACJI');
  drawFooter(1);

  // SECTION 1: Dane Ogólne (Serwisant & Oddział)
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 34, 'F');
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 34, 'S');

  // Left side: Serwisant
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DANE SERWISANTA:', marginX + 4, currentY + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Firma: ${sanitizeText(protocol.serviceman.company || '---')}`, marginX + 4, currentY + 11);
  doc.text(`Imie i nazwisko: ${sanitizeText(protocol.serviceman.firstName)} ${sanitizeText(protocol.serviceman.lastName)}`, marginX + 4, currentY + 17);
  doc.text(`Telefon: ${sanitizeText(protocol.serviceman.phone || '---')}`, marginX + 4, currentY + 23);

  // Right side: Oddział
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DANE ODDZIALU:', marginX + 90, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Numer oddzialu: ${sanitizeText(protocol.branch.branchNumber)}`, marginX + 90, currentY + 11);
  doc.text(`Miejscowosc: ${sanitizeText(protocol.branch.city)}`, marginX + 90, currentY + 16);
  doc.text(`Ulica: ${sanitizeText(protocol.branch.street)}`, marginX + 90, currentY + 21);
  doc.text(`Typ oddzialu: ${sanitizeText(protocol.branch.branchType || '---')}`, marginX + 90, currentY + 26);

  // Start & End Time
  const sTimeStr = protocol.startTime ? new Date(protocol.startTime).toLocaleString('pl-PL') : '---';
  const eTimeStr = protocol.endTime ? new Date(protocol.endTime).toLocaleString('pl-PL') : '---';
  doc.text(`Czas konserwacji: od ${sanitizeText(sTimeStr)} do ${sanitizeText(eTimeStr)}`, marginX + 4, currentY + 31);

  currentY += 42;

  // SECTION 2: CCTV (System telewizji dozorowej)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text('1. TELEWIZJA DOZOROWA (CCTV)', marginX, currentY);
  currentY += 4;

  // CCTV Table Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Lp.', marginX + 2, currentY + 5);
  doc.text('Model rejestratora', marginX + 10, currentY + 5);
  doc.text('Numer seryjny (S/N)', marginX + 52, currentY + 5);
  doc.text('Numer inwentarzowy', marginX + 94, currentY + 5);
  doc.text('Kam. analog.', marginX + 135, currentY + 5);
  doc.text('Kam. cyfr. (IP)', marginX + 158, currentY + 5);

  currentY += 7;

  // CCTV Rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  protocol.cctv.rows.forEach((row, idx) => {
    // Alternate backgrounds
    if (idx % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
    }
    doc.rect(marginX, currentY, pageWidth - (marginX * 2), 8, 'F');
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.rect(marginX, currentY, pageWidth - (marginX * 2), 8, 'S');

    doc.text(`${idx + 1}.`, marginX + 2, currentY + 5.5);
    const displayModel = row.model === 'inne' ? (row.customModel || 'inne') : (row.model || '---');
    doc.text(sanitizeText(displayModel), marginX + 10, currentY + 5.5);
    doc.text(sanitizeText(row.serialNumber || '---'), marginX + 52, currentY + 5.5);
    doc.text(sanitizeText(row.inventoryNumber || '---'), marginX + 94, currentY + 5.5);
    doc.text(`${row.analogCount}`, marginX + 144, currentY + 5.5, { align: 'center' });
    doc.text(`${row.digitalCount}`, marginX + 168, currentY + 5.5, { align: 'center' });

    currentY += 8;
  });

  currentY += 4;
  doc.setFont('helvetica', 'semibold');
  doc.setFontSize(9);
  const inRackText = protocol.cctv.inRack === true ? 'TAK' : protocol.cctv.inRack === false ? 'NIE' : 'NIE OKRESLONO';
  doc.text(`Czy rejestrator znajduje sie w szafie serwerowej: ${inRackText}`, marginX, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.text(`Komentarz: ${sanitizeText(protocol.cctv.comment || 'Brak uwag/komentarzy.')}`, marginX, currentY);

  currentY += 12;

  if (!isIsland) {
    // SECTION 3: SKD (System kontroli dostępu)
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text('2. SYSTEM KONTROLI DOSTEPU (SKD)', marginX, currentY);
    currentY += 4;

    // SKD Table Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(marginX, currentY, pageWidth - (marginX * 2), 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Nazwa drzwi', marginX + 3, currentY + 5);
    doc.text('Wejscie za pomoca', marginX + 55, currentY + 5);
    doc.text('Typ okucia', marginX + 90, currentY + 5);
    doc.text('Sluzowanie', marginX + 125, currentY + 5);
    doc.text('Typ ryglowania', marginX + 155, currentY + 5);

    currentY += 7;

    // SKD Rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    
    if (protocol.skdDoors.length === 0) {
      doc.setFillColor(255, 255, 255);
      doc.rect(marginX, currentY, pageWidth - (marginX * 2), 8, 'F');
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.rect(marginX, currentY, pageWidth - (marginX * 2), 8, 'S');
      doc.text('Brak zdefiniowanych drzwi SKD', marginX + 3, currentY + 5.5);
      currentY += 8;
    } else {
      protocol.skdDoors.forEach((door, idx) => {
        checkPageBreak(12);
        if (idx % 2 === 0) {
          doc.setFillColor(255, 255, 255);
        } else {
          doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
        }
        doc.rect(marginX, currentY, pageWidth - (marginX * 2), 8, 'F');
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.rect(marginX, currentY, pageWidth - (marginX * 2), 8, 'S');

        doc.text(sanitizeText(door.name || `Drzwi bez nazwy #${idx + 1}`), marginX + 3, currentY + 5.5);
        doc.text(sanitizeText(door.authType === 'czytnik' ? 'Czytnik' : door.authType === 'klawiatura' ? 'Klawiatura' : 'Nie wybrano'), marginX + 55, currentY + 5.5);
        doc.text(sanitizeText(door.handleType || 'Nie wybrano'), marginX + 90, currentY + 5.5);
        doc.text(door.lockOnArmed === true ? 'TAK' : door.lockOnArmed === false ? 'NIE' : 'Nie wybrano', marginX + 125, currentY + 5.5);
        const lockMethodText = door.lockMethod === 'elektrozaczep' ? 'Elektrozaczep' : door.lockMethod === 'zwora' ? 'Zwora' : door.lockMethod === 'abloy' ? 'Zamek Abloy' : 'Nie wybrano';
        doc.text(sanitizeText(lockMethodText), marginX + 155, currentY + 5.5);

        currentY += 8;
      });
    }

    if (protocol.skdComment) {
      currentY += 2;
      checkPageBreak(12);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Uwagi do drzwi: ${sanitizeText(protocol.skdComment)}`, marginX, currentY + 4);
      currentY += 8;
    }

    // ATM Vestibule info
    currentY += 4;
    checkPageBreak(15);
    doc.setFont('helvetica', 'semibold');
    doc.setFontSize(9);
    
    let hasAtmLockStr = 'NIE (brak blokady)';
    if (protocol.atmVestibule.hasLock === 'no_vestibule') {
      hasAtmLockStr = 'NIE (nie ma przedsionka)';
    } else if (protocol.atmVestibule.hasLock === true) {
      let typeStr = 'Nie okreslono';
      if (protocol.atmVestibule.lockType === 'sterownik_bez_czytnika') typeStr = 'sterownik bez czytnika';
      else if (protocol.atmVestibule.lockType === 'sterownik_z_czytnikiem') typeStr = 'sterownik z czytnikiem';
      else if (protocol.atmVestibule.lockType === 'ca_czytnik') typeStr = 'na CA z czytnikiem';
      else if (protocol.atmVestibule.lockType === 'ca_czytnik_dahua') typeStr = 'na CA z czytnikiem i kamera Dahua';
      else if (protocol.atmVestibule.lockType === 'ca_czytnik_dahua_glosnik') typeStr = 'na CA z czytnikiem, kamera Dahua i glosnikiem';
      hasAtmLockStr = `TAK (jest blokada), ${typeStr}`;
    }
    
    doc.text(`Blokada przedsionka bankomatowego: ${sanitizeText(hasAtmLockStr)}`, marginX, currentY);

    currentY += 12;
  }

  // SECTION 3: Monitoring i Transmisja SMA
  checkPageBreak(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(`${isIsland ? '2' : '3'}. TRANSMISJA SYGNALOW DO SMA`, marginX, currentY);
  currentY += 4;

  // Monitoring Table Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Sygnal', marginX + 3, currentY + 5);
  doc.text('Po nadajniku', marginX + (isIsland ? 150 : 110), currentY + 5);
  if (!isIsland) {
    doc.text('Drugi tor monitorowania', marginX + 150, currentY + 5);
  }

  currentY += 7;

  // Monitoring Rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  const monitoringRows = protocol.monitoring?.rows || [];
  monitoringRows.forEach((row, idx) => {
    checkPageBreak(12);
    if (idx % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
    }
    doc.rect(marginX, currentY, pageWidth - (marginX * 2), 8, 'F');
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.rect(marginX, currentY, pageWidth - (marginX * 2), 8, 'S');

    doc.text(sanitizeText(row.signalName), marginX + 3, currentY + 5.5);
    const transStr = row.transmitter === true ? 'TAK' : row.transmitter === false ? 'NIE' : 'brak';
    doc.text(transStr, marginX + (isIsland ? 150 : 110), currentY + 5.5);
    if (!isIsland) {
      const pathStr = row.secondPath === true ? 'TAK' : row.secondPath === false ? 'NIE' : 'brak';
      doc.text(pathStr, marginX + 150, currentY + 5.5);
    }

    currentY += 8;
  });

  // Second path type
  if (!isIsland) {
    currentY += 4;
    checkPageBreak(12);
    doc.setFont('helvetica', 'semibold');
    doc.setFontSize(9);
    let pathTypeStr = 'Nie wybrano';
    if (protocol.monitoring) {
      const t = protocol.monitoring.secondPathType;
      if (t === 'linia_telefoniczna') pathTypeStr = 'Linia telefoniczna';
      else if (t === 'epx400') pathTypeStr = 'Nadajnik EPX400';
      else if (t === 'drugi_gsm') pathTypeStr = 'Drugi nadajnik GSM';
      else if (t === 'inne') pathTypeStr = `Inne: ${protocol.monitoring.secondPathOtherText || ''}`;
    }
    doc.text(`Drugim torem monitorowania oddzialu jest: ${sanitizeText(pathTypeStr)}`, marginX, currentY);
    currentY += 5;
  } else {
    currentY += 4;
  }

  if (protocol.monitoring?.gsmTransmitterNumber) {
    checkPageBreak(12);
    doc.setFont('helvetica', 'semibold');
    doc.setFontSize(9);
    doc.text(`Numer nadajnika GSM na stacji SMA: ${sanitizeText(protocol.monitoring.gsmTransmitterNumber)}`, marginX, currentY);
    currentY += 5;
  }

  if (!isIsland && protocol.monitoring?.secondPathTransmitterNumber) {
    checkPageBreak(12);
    doc.setFont('helvetica', 'semibold');
    doc.setFontSize(9);
    doc.text(`Numer nadajnika 2go toru na stacji SMA: ${sanitizeText(protocol.monitoring.secondPathTransmitterNumber)}`, marginX, currentY);
    currentY += 5;
  }

  currentY += 7;

  // SECTION 4: Akumulatory
  checkPageBreak(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(`${isIsland ? '3' : '4'}. POMIARY PRACY AKUMULATOROW`, marginX, currentY);
  currentY += 4;

  // Split into left (SSWiN) & right (Zasilacze) columns
  const colW = isIsland ? (pageWidth - (marginX * 2)) : ((pageWidth - (marginX * 2) - 6) / 2); // ~88mm each column or full width if island
  
  // Left Battery Box
  const leftX = marginX;
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(leftX, currentY, colW, 7, 'F');
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.rect(leftX, currentY, colW, 7, 'S');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Centrala i ekspandery', leftX + 3, currentY + 5);

  if (!isIsland) {
    // Right Battery Box
    const rightX = marginX + colW + 6;
    doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
    doc.rect(rightX, currentY, colW, 7, 'F');
    doc.rect(rightX, currentY, colW, 7, 'S');
    doc.text('Zasilacz SSWiN / SKD', rightX + 3, currentY + 5);
  }

  currentY += 7;

  // Find max length of left or right battery rows to iterate safely
  const maxBatteryRows = isIsland ? protocol.batteries.leftTable.length : Math.max(protocol.batteries.leftTable.length, protocol.batteries.rightTable.length);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (let idx = 0; idx < maxBatteryRows; idx++) {
    checkPageBreak(14);
    const leftRow = protocol.batteries.leftTable[idx];
    const rightRow = isIsland ? undefined : protocol.batteries.rightTable[idx];

    const formatMonthYear = (dateStr: string): string => {
      if (!dateStr) return '---';
      if (/^\d{4}-\d{2}$/.test(dateStr)) {
        const [year, month] = dateStr.split('-');
        return `${month}.${year}`;
      }
      return dateStr;
    };

    // Draw Left Box row
    if (leftRow) {
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.rect(leftX, currentY, colW, 11, 'S');
      doc.setFont('helvetica', 'semibold');
      doc.text(sanitizeText(leftRow.name), leftX + 2, currentY + 4);
      doc.setFont('helvetica', 'normal');
      const leftCapStr = leftRow.capacity === 'brak_aku' ? 'brak aku' : `${leftRow.capacity}Ah`;
      doc.text(`Pojemnoscz: ${leftCapStr}`, leftX + 2, currentY + 8);
      const effStr = leftRow.efficiency !== undefined ? `${leftRow.efficiency}%` : '---';
      doc.text(`Sprawnosc: ${effStr}`, leftX + (isIsland ? 60 : 28), currentY + 8);
      const mDate = leftRow.installationDate ? formatMonthYear(leftRow.installationDate) : '---';
      doc.text(`Montaz: ${mDate}`, leftX + (isIsland ? 120 : 54), currentY + 8);
    } else {
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.rect(leftX, currentY, colW, 11, 'S');
    }

    // Draw Right Box row
    if (!isIsland) {
      const rightX = marginX + colW + 6;
      if (rightRow) {
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.rect(rightX, currentY, colW, 11, 'S');
        doc.setFont('helvetica', 'semibold');
        doc.text(sanitizeText(rightRow.name), rightX + 2, currentY + 4);
        doc.setFont('helvetica', 'normal');
        const rightCapStr = rightRow.capacity === 'brak_aku' ? 'brak aku' : `${rightRow.capacity}Ah`;
        doc.text(`Pojemnoscz: ${rightCapStr}`, rightX + 2, currentY + 8);
        const effStr = rightRow.efficiency !== undefined ? `${rightRow.efficiency}%` : '---';
        doc.text(`Sprawnosc: ${effStr}`, rightX + 28, currentY + 8);
        const mDate = rightRow.installationDate ? formatMonthYear(rightRow.installationDate) : '---';
        doc.text(`Montaz: ${mDate}`, rightX + 54, currentY + 8);
      } else {
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.rect(rightX, currentY, colW, 11, 'S');
      }
    }

    currentY += 11;
  }

  // Dedicated Fuse Type
  if (!isIsland) {
    checkPageBreak(12);
    doc.setFont('helvetica', 'semibold');
    doc.text('Dedykowany bezpiecznik w rozdzielni pod alarm: ', leftX, currentY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(sanitizeText(protocol.batteries.fuseType || 'nie podano'), leftX + 70, currentY + 4);
    currentY += 8;
  }

  // SECTION: Zadania Dodatkowe i Wytyczne
  if (protocol.additionalTasks && protocol.additionalTasks.length > 0) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text('5. ZADANIA DODATKOWE I WYTYCZNE', marginX, currentY);
    currentY += 4;

    // Header of Table
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(marginX, currentY, pageWidth - (marginX * 2), 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Zadanie', marginX + 3, currentY + 4.5);
    doc.text('Status', marginX + 110, currentY + 4.5);
    doc.text('Uwagi / komentarz serwisu', marginX + 135, currentY + 4.5);
    currentY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

    protocol.additionalTasks.forEach((t, idx) => {
      checkPageBreak(12);
      // Background row color alternating
      if (idx % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
      }
      doc.rect(marginX, currentY, pageWidth - (marginX * 2), 9, 'F');
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.rect(marginX, currentY, pageWidth - (marginX * 2), 9, 'S');

      // Title/Description
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const titleClean = sanitizeText(t.title);
      const titleSlices = doc.splitTextToSize(titleClean, 102);
      doc.text(titleSlices[0] || '', marginX + 3, currentY + 3.5);
      if (titleSlices[1]) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.text(titleSlices[1], marginX + 3, currentY + 7);
      } else if (t.description) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(grayTextColor[0], grayTextColor[1], grayTextColor[2]);
        doc.text(sanitizeText(t.description).slice(0, 75), marginX + 3, currentY + 7);
      }

      // Status
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      if (t.isCompleted) {
        doc.setTextColor(16, 185, 129); // green-500
        doc.text('WYKONANO', marginX + 110, currentY + 5.5);
      } else {
        doc.setTextColor(239, 68, 68); // red-500
        doc.text('NIE WYKONANO', marginX + 110, currentY + 5.5);
      }

      // Comments
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const commentClean = t.comment ? sanitizeText(t.comment) : '---';
      const commentSlices = doc.splitTextToSize(commentClean, 54);
      doc.text(commentSlices[0] || '', marginX + 135, currentY + 5.5);

      currentY += 9;
    });

    currentY += 6;
  }

  // SIGNATURES & CONCLUSION
  currentY += 8;
  const hasPhoto = !!protocol.photoVerification;

  if (hasPhoto) {
    // If there is a photo, we draw it below.
    // It needs 20mm top margin, 30mm image height, 20mm bottom margin, which is 70mm total!
    // Plus labels (around 10mm). So total 80mm space needed.
    checkPageBreak(80);

    // 20mm margin is maintained from the text/content above (currentY)
    currentY += 20; // This is the 2cm margin above the signature!

    // Photo Title and label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('OSWIADCZENIE Z FOTOWERYFIKACJA ODBIORU', marginX + 5, currentY - 12);



    // Embed base64 image (30mm height, 150mm width)
    const imgWidth = 150;
    const imgHeight = 30;
    const imgX = (pageWidth - imgWidth) / 2; // centered -> (210 - 150)/2 = 30mm from left and right edges (3cm margin!)
    const imgY = currentY;

    try {
      doc.addImage(protocol.photoVerification!, 'JPEG', imgX, imgY, imgWidth, imgHeight);
      // Border around the photo
      doc.setDrawColor(203, 213, 225); // gray-300
      doc.rect(imgX - 1, imgY - 1, imgWidth + 2, imgHeight + 2, 'S');
    } catch (e) {
      console.error("Błąd podczas osadzania zdjęcia w PDF:", e);
      doc.setDrawColor(220, 38, 38); // red border
      doc.rect(imgX - 1, imgY - 1, imgWidth + 2, imgHeight + 2, 'S');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(220, 38, 38);
      doc.text('Blad osadzania zdjecia', pageWidth / 2 - 15, imgY + 15);
    }

    // Move currentY past the image and add 20mm (2cm) margin below the signature!
    currentY += imgHeight + 20; // 20mm margin below the signature!
  }

  // Draw final legal text
  checkPageBreak(15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(grayTextColor[0], grayTextColor[1], grayTextColor[2]);
  doc.text('Konserwacja okresowa wykonana zgodnie z procedurami bankowymi i przepisami prawnymi.', marginX + 5, currentY);

  return doc;
}

export function generatePdfProtocol(protocol: MaintenanceProtocol) {
  const doc = generatePdfDocument(protocol);
  const dateStr = new Date(protocol.createdAt).toISOString().split('T')[0];
  const branchNum = protocol.branch.branchNumber || 'oddzial';
  const fileName = `Protokol_Konserwacji_${branchNum}_${dateStr}.pdf`;
  doc.save(fileName);
}

export function generatePdfBase64(protocol: MaintenanceProtocol): string {
  const doc = generatePdfDocument(protocol);
  const pdfString = doc.output('datauristring');
  return pdfString.split(',')[1] || '';
}
