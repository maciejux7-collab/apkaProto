import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ServicemanData,
  BranchData,
  CctvData,
  DoorRow,
  AtmVestibule,
  BatteryData,
  MaintenanceProtocol,
  CctvRow,
  BatteryRow,
  MonitoringData,
  ProtocolTask,
  AdditionalTask
} from './types';
import ServicemanSection from './components/ServicemanSection';
import CctvSection from './components/CctvSection';
import SkdSection from './components/SkdSection';
import BatterySection from './components/BatterySection';
import MonitoringSection from './components/MonitoringSection';
import SignatureCropper from './components/SignatureCropper';
import { AdminPanelContainer } from './components/AdminPanelContainer';
import { generateTextProtocol, generateMailtoUrl, downloadTextFile } from './utils/protocolExporter';
import { generatePdfProtocol, generatePdfBase64 } from './utils/pdfGenerator';
import { downloadExcelProtocol, getExcelBase64 } from './utils/excelGenerator';
import { scanAndEnhanceDocument } from './utils/docScanner';
import {
  ShieldAlert,
  ClipboardCheck,
  Mail,
  Download,
  Save,
  CheckCircle,
  Clock,
  FilePlus2,
  FileText,
  Trash2,
  Lock,
  Phone,
  User,
  MapPin,
  Check,
  HelpCircle,
  Copy,
  Camera,
  Calendar
} from 'lucide-react';

// Default / Initial states
const defaultServiceman = (): ServicemanData => {
  const cached = localStorage.getItem('sswin_serviceman_profile');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }
  return { company: '', firstName: '', lastName: '', phone: '' };
};

const defaultBranch = (): BranchData => ({
  branchNumber: '',
  city: '',
  street: ''
});

const defaultCctv = (): CctvData => ({
  rows: [
    { model: '', serialNumber: '', inventoryNumber: '', analogCount: '', digitalCount: '' }
  ],
  inRack: null,
  comment: ''
});

const defaultDoors = (): DoorRow[] => [
  {
    id: 'door-1',
    name: 'drzwi zaplecze',
    authType: '',
    handleType: '',
    lockOnArmed: null,
    lockMethod: ''
  },
  {
    id: 'door-2',
    name: 'drzwi skarbiec',
    authType: '',
    handleType: '',
    lockOnArmed: null,
    lockMethod: ''
  },
  {
    id: 'door-3',
    name: 'drzwi serwerownia',
    authType: '',
    handleType: '',
    lockOnArmed: null,
    lockMethod: ''
  }
];

const defaultAtmVestibule = (): AtmVestibule => ({
  hasLock: null,
  lockType: ''
});

const defaultBatteryData = (): BatteryData => {
  return {
    leftTable: [
      { id: 'left-1', name: 'Centrala alarmowa', capacity: '17' },
      { id: 'left-2', name: 'Ekspander 1', capacity: '17' },
      { id: 'left-3', name: 'Ekspander 2', capacity: '17' }
    ],
    rightTable: [
      { id: 'right-1', name: 'Zasilacz SSWiN', capacity: '65' },
      { id: 'right-2', name: 'Zasilacz SKD', capacity: '65' }
    ],
    fuseType: ''
  };
};

const defaultMonitoringData = (): MonitoringData => ({
  rows: [
    { signalName: 'Włamanie - transmisja do SMA', transmitter: null, secondPath: null },
    { signalName: 'Napad - transmisja do SMA', transmitter: null, secondPath: null },
    { signalName: 'Uzbrojenie systemu - transmisja do SMA', transmitter: null, secondPath: null },
    { signalName: 'Pożar - transmisja do SMA', transmitter: null, secondPath: null },
    { signalName: 'Usterka - transmisja do SMA', transmitter: null, secondPath: null },
    { signalName: 'Przymus - transmisja do SMA', transmitter: null, secondPath: null },
    { signalName: 'Sabotaż - transmisja do SMA', transmitter: null, secondPath: null }
  ],
  secondPathType: '',
  secondPathOtherText: '',
  gsmTransmitterNumber: '',
  secondPathTransmitterNumber: ''
});

export default function App() {
  // Navigation Tabs: 'create' | 'admin'
  const [activeTab, setActiveTab] = useState<'create' | 'admin'>('create');
  
  // Token access logic
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenVerified, setTokenVerified] = useState<boolean>(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [prefilledFromToken, setPrefilledFromToken] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setAccessToken(token);
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`/api/access-tokens/${token}`);
      if (!response.ok) {
        const error = await response.json();
        setTokenError(error.error || "Link wygasł lub jest niepoprawny.");
        return;
      }

      const tokenData = await response.json();
      const expiresAt = new Date(tokenData.expiresAt);
      if (expiresAt < new Date()) {
        setTokenError("Link wygasł (minęło 30 minut/czas ważności).");
        return;
      }

      setTokenVerified(true);
      
      // Fetch branch data
      const branchesRes = await fetch(`/api/branches`);
      const branchesData = await branchesRes.json();
      const branchData = branchesData.find((b: any) => b.id === tokenData.branchId);
      
      if (branchData) {
        setBranch({
          branchNumber: branchData.branchNumber || '',
          city: branchData.city || '',
          street: branchData.address || '',
          branchType: branchData.branchType || 'detal'
        });

        // Fetch technician data
        const techsRes = await fetch(`/api/technicians`);
        const techsData = await techsRes.json();
        const techData = techsData.find((t: any) => t.id === tokenData.technicianId);
        
        if (techData) {
          setServiceman({
            firstName: techData.firstName,
            lastName: techData.lastName,
            phone: techData.phone,
            company: techData.company || ''
          });
        }

        // PRE-FILL from latest protocol
        const protocolsRes = await fetch(`/api/protocols`);
        const protocolsData = await protocolsRes.json();
        const lastProtocolRecord = protocolsData.find((p: any) => p.branchNumber === branchData.branchNumber);
        
        if (lastProtocolRecord) {
          const lastProtocol = lastProtocolRecord.data as MaintenanceProtocol;
          setCctv(lastProtocol.cctv);
          setDoors(lastProtocol.skdDoors);
          setSkdComment(lastProtocol.skdComment || '');
          setAtmVestibule(lastProtocol.atmVestibule);
          setBatteryData(lastProtocol.batteries);
          setMonitoringData(lastProtocol.monitoring);
          setPrefilledFromToken(true);
        }
      }
    } catch (err) {
      console.error("Token verification error:", err);
      setTokenError("Błąd serwera podczas weryfikacji dostępu.");
    }
  };
  const [serviceman, setServiceman] = useState<ServicemanData>(defaultServiceman);
  const [branch, setBranch] = useState<BranchData>(defaultBranch);
  const [cctv, setCctv] = useState<CctvData>(defaultCctv);
  const [doors, setDoors] = useState<DoorRow[]>(defaultDoors);
  const [skdComment, setSkdComment] = useState<string>('');
  const [atmVestibule, setAtmVestibule] = useState<AtmVestibule>(defaultAtmVestibule);
  const [batteryData, setBatteryData] = useState<BatteryData>(defaultBatteryData);
  const [monitoringData, setMonitoringData] = useState<MonitoringData>(defaultMonitoringData);
  const [photoVerification, setPhotoVerification] = useState<string>('');
  const [rawCapturedPhoto, setRawCapturedPhoto] = useState<string>('');
  
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  // Additional tasks states
  const [protocolTasks, setProtocolTasks] = useState<ProtocolTask[]>([]);
  const [tasksUpdateTrigger, setTasksUpdateTrigger] = useState<number>(0);

  // Step Wizard: 1 (Dane), 2 (CCTV), 3 (SKD), 4 (Akumulatory), 5 (Monitoring), 6 (Podsumowanie)
  const [activeStep, setActiveStep] = useState<number>(1);

  // Synchronize additional tasks whenever the branch number or tasks are updated
  useEffect(() => {
    const syncTasks = async () => {
      let allTasks: AdditionalTask[] = [];
      try {
        const response = await fetch('/api/additional-tasks');
         const data = await response.json();
        if (Array.isArray(data)) {
          allTasks = data;
          localStorage.setItem('sswin_additional_tasks_cache', JSON.stringify(allTasks));
        } else {
          throw new Error('API returned invalid data format');
        }
		
      } catch (err) {
        console.warn('SQL syncTasks failed, loading from cache', err);
        const cached = localStorage.getItem('sswin_additional_tasks_cache');
        if (cached) {
          try {
             const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) allTasks = parsed;
          } catch (e) {}
        }
      }

      const currentBranchNum = branch.branchNumber ? branch.branchNumber.trim() : '';
      const relevantTasks = Array.isArray(allTasks) ? allTasks.filter(t => {
        return t.branchFilter === 'Wszystkie' || (currentBranchNum && t.branchFilter === currentBranchNum);
      }) : [];

      setProtocolTasks(prev => {
        return relevantTasks.map(t => {
          const existing = prev.find(pt => pt.taskId === t.id);
          return {
            taskId: t.id!,
            title: t.title,
            description: t.description || '',
            branchFilter: t.branchFilter,
            isCompleted: existing ? existing.isCompleted : false,
            comment: existing ? existing.comment : ''
          };
        });
      });
    };

    syncTasks();
  }, [branch.branchNumber, tasksUpdateTrigger]);

  const isIsland = branch.branchType === 'wyspa';

  useEffect(() => {
    if (isIsland && activeStep === 3) {
      setActiveStep(4);
    }
  }, [isIsland, activeStep]);

  // Keyboard / Focus UX helpers for mobile devices
  const [isKeyboardActive, setIsKeyboardActive] = useState<boolean>(false);

  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        setIsKeyboardActive(true);
        // Delay slightly to let the virtual keyboard slide up and resize the viewport
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 250);
      }
    };

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        setTimeout(() => {
          const currentActive = document.activeElement;
          if (!currentActive || (currentActive.tagName !== 'INPUT' && currentActive.tagName !== 'TEXTAREA')) {
            setIsKeyboardActive(false);
          }
        }, 150);
      }
    };

    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);
    return () => {
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, []);

  // Scroll to top when active step or active tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeStep, activeTab]);

  // Email API Statuses
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [emailMessage, setEmailMessage] = useState<string>('');
  
  // Copy to clipboard status
  const [copied, setCopied] = useState<boolean>(false);

  // Initialize dates and load profile on mount
  useEffect(() => {
    // Set default start & end times (today, now, + 2h)
    const now = new Date();
    const formatDateTime = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    setStartTime(formatDateTime(now));
  }, []);

  // Save technician's profile details to cache on edit
  useEffect(() => {
    localStorage.setItem('sswin_serviceman_profile', JSON.stringify(serviceman));
  }, [serviceman]);

  // Build the unified protocol object
  const buildProtocolObject = (): MaintenanceProtocol => ({
    id: crypto.randomUUID(),
    serviceman,
    branch,
    cctv,
    skdDoors: doors,
    skdComment,
    atmVestibule,
    batteries: batteryData,
    monitoring: monitoringData,
    startTime,
    endTime,
    createdAt: new Date().toISOString(),
    isTemplate: false,
    photoVerification,
    additionalTasks: protocolTasks
  });

  // Submit protocol to the e-mail address
  const handleSubmitProtocol = async () => {
    const protocol = buildProtocolObject();
    setEmailStatus('sending');
    setEmailMessage('');

    try {
      // 1. Save to cloud database (always)
      await fetch('/api/protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: protocol,
          branchNumber: branch.branchNumber
        })
      });

      // 2. If token was used, mark it as used
      if (accessToken) {
        await fetch(`/api/access-tokens/${accessToken}`, {
          method: 'PATCH'
        });
      }

      // 3. Create Base64 for Excel XLS export
      const xlsBase64 = getExcelBase64(protocol);
      // 4. Create Base64 for PDF export
      const pdfBase64 = generatePdfBase64(protocol);

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol,
          xlsAttachment: xlsBase64,
          pdfAttachment: pdfBase64
        })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setEmailStatus('success');
        setEmailMessage(data.message || 'Protokół w formacie PDF oraz XLS został pomyślnie wysłany!');
      } else {
        throw new Error(data.error || 'Serwer zwrócił błąd wysyłki.');
      }
    } catch (err: any) {
      console.error(err);
      setEmailStatus('error');
      setEmailMessage(err.message || 'Nie udało się wysłać protokołu przez API serwera.');
    }
  };

  const copyToClipboard = () => {
    const protocol = buildProtocolObject();
    const textReport = generateTextProtocol(protocol);
    navigator.clipboard.writeText(textReport).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setRawCapturedPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetForm = () => {
    if (confirm('Czy na pewno chcesz wyczyścić cały formularz i zacząć od nowa?')) {
      setBranch(defaultBranch());
      setCctv(defaultCctv());
      setDoors(defaultDoors());
      setAtmVestibule(defaultAtmVestibule());
      setBatteryData(defaultBatteryData());
      setMonitoringData(defaultMonitoringData());
      setPhotoVerification('');
      setProtocolTasks([]);
      setActiveStep(1);
      
      const now = new Date();
      const formatDateTime = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      setStartTime(formatDateTime(now));
      setEndTime('');
    }
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setStartTime(newStart);
    if (newStart && endTime) {
      const datePart = newStart.split('T')[0];
      const timePart = endTime.split('T')[1];
      if (timePart) {
        setEndTime(`${datePart}T${timePart}`);
      }
    }
  };

  const handleEndTimeTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeVal = e.target.value;
    if (!timeVal) {
      setEndTime('');
      return;
    }
    
    if (startTime) {
      const datePart = startTime.split('T')[0];
      setEndTime(`${datePart}T${timeVal}`);
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      setEndTime(`${year}-${month}-${day}T${timeVal}`);
    }
  };

  const endTimeValue = endTime ? endTime.split('T')[1] : '';

  const currentProtocol = buildProtocolObject();

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      {/* Header Bar */}
      <header className="bg-slate-900 text-white shadow-md py-4 px-6 shrink-0 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <ClipboardCheck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Protokół Konserwacji</h1>
              <p className="text-xs text-slate-300 font-medium">SSWiN • CCTV • SKD • AKUMULATORY</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
            <button
              id="tab-create"
              onClick={() => setActiveTab('create')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FilePlus2 className="w-4 h-4" />
              Nowy Protokół
            </button>
            {!accessToken && (
              <button
                id="tab-admin"
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                Admin Panel
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6">
        {accessToken && tokenError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-8 rounded-2xl text-center space-y-4 mb-8">
            <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
            <h2 className="text-xl font-bold">Dostęp Zabroniony</h2>
            <p className="text-sm font-medium">{tokenError}</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
            >
              Wróć do strony głównej
            </button>
          </div>
        )}

        {accessToken && tokenVerified && prefilledFromToken && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div className="text-xs text-left">
              <p className="font-bold">Dane wczytane z poprzedniej wizyty!</p>
              <p>Formularz został wstępnie uzupełniony numerami seryjnymi i ilością sprzętu. Sprawdź je i zaktualizuj jeśli zaszły zmiany.</p>
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          {activeTab === 'create' && (!accessToken || tokenVerified) && (
            <motion.div
              key="creator"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Wizard Progress Indicator */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 overflow-x-auto">
                <div className="flex items-center justify-between min-w-[500px] px-4">
                  {[
                    { nr: 1, label: 'Dane Ogólne' },
                    { nr: 2, label: 'CCTV' },
                    ...(isIsland ? [] : [{ nr: 3, label: 'SKD' }]),
                    { nr: 4, label: 'Akumulatory' },
                    { nr: 5, label: 'Monitoring' },
                    { nr: 6, label: 'Podsumowanie' }
                  ].map((step) => (
                    <React.Fragment key={step.nr}>
                      <button
                        id={`btn-stepper-${step.nr}`}
                        onClick={() => {
                          // Allow moving back anytime, or forward if credentials are put in
                          if (step.nr <= activeStep || (branch.branchNumber && branch.city && branch.street && branch.branchType && serviceman.company && serviceman.firstName && serviceman.lastName && serviceman.phone)) {
                            setActiveStep(step.nr);
                          }
                        }}
                        className="flex items-center gap-2 focus:outline-none group text-left"
                      >
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            activeStep === step.nr
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10 scale-110'
                              : activeStep > step.nr
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                          }`}
                        >
                          {activeStep > step.nr ? '✓' : step.nr}
                        </span>
                        <span
                          className={`text-xs font-semibold whitespace-nowrap transition-colors ${
                            activeStep === step.nr ? 'text-blue-600 font-bold' : 'text-slate-500'
                          }`}
                        >
                          {step.label}
                        </span>
                      </button>
                      {step.nr < 6 && (
                        <div
                          className={`h-[2px] flex-1 mx-4 rounded ${
                            activeStep > step.nr ? 'bg-blue-100' : 'bg-slate-100'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Reset form button helper */}
              {activeStep > 1 && (
                <div className="flex justify-end">
                  <button
                    id="btn-reset-form"
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs text-blue-500 hover:text-blue-700 hover:bg-blue-50 font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Wyczyść formularz
                  </button>
                </div>
              )}

              {/* Steps container */}
              <div className="min-h-[400px]">
                {activeStep === 1 && (
                  <ServicemanSection
                    serviceman={serviceman}
                    onServicemanChange={setServiceman}
                    branch={branch}
                    onBranchChange={setBranch}
                    onNext={() => setActiveStep(2)}
                    protocolTasks={protocolTasks}
                    onProtocolTasksChange={setProtocolTasks}
                  />
                )}

                {activeStep === 2 && (
                  <CctvSection
                    cctv={cctv}
                    onChange={setCctv}
                    onNext={() => setActiveStep(isIsland ? 4 : 3)}
                    onPrev={() => setActiveStep(1)}
                  />
                )}

                {activeStep === 3 && !isIsland && (
                  <SkdSection
                    doors={doors}
                    onDoorsChange={setDoors}
                    skdComment={skdComment}
                    onSkdCommentChange={setSkdComment}
                    atmVestibule={atmVestibule}
                    onAtmVestibuleChange={setAtmVestibule}
                    onNext={() => setActiveStep(4)}
                    onPrev={() => setActiveStep(2)}
                  />
                )}

                {activeStep === 4 && (
                  <BatterySection
                    batteryData={batteryData}
                    onChange={setBatteryData}
                    onNext={() => setActiveStep(5)}
                    onPrev={() => setActiveStep(isIsland ? 2 : 3)}
                    isIsland={isIsland}
                  />
                )}

                {activeStep === 5 && (
                  <MonitoringSection
                    monitoringData={monitoringData}
                    onChange={setMonitoringData}
                    onNext={() => setActiveStep(6)}
                    onPrev={() => setActiveStep(4)}
                    isIsland={isIsland}
                  />
                )}

                {activeStep === 6 && (
                  <div className="space-y-6">
                    {/* Summary Protocol Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-800">Podsumowanie Protokołu</h3>
                          <p className="text-xs text-slate-400 mt-1">Przejrzyj dane przed wysłaniem na e-mail: <span className="font-semibold text-blue-600 text-center sm:text-left block sm:inline">artur236@poczta.onet.pl, adrozdz94@gmail.com</span></p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            id="btn-copy-protocol"
                            type="button"
                            onClick={copyToClipboard}
                            disabled={!startTime || !endTime}
                            className="px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-200 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? 'Skopiowano!' : 'Kopiuj tekst'}
                          </button>
                        </div>
                      </div>

                      {/* Displaying visual structured blocks */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        
                        {/* Block 1: Dane Serwisanta i Oddziału */}
                        <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
                          <h4 className="font-bold text-slate-700 uppercase tracking-wide text-xs">Oddział & Serwisant</h4>
                          <div className="space-y-2">
                            <p className="flex items-center gap-2"><User className="w-4 h-4 text-blue-500 shrink-0" /> <span className="font-medium">{serviceman.firstName || '---'} {serviceman.lastName || '---'} {serviceman.company ? `(${serviceman.company})` : ''}</span></p>
                            <p className="flex items-center gap-2 text-xs text-slate-500"><Phone className="w-4 h-4 text-blue-400 shrink-0" /> {serviceman.phone || '---'}</p>
                            <p className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/60 font-semibold text-blue-800"><MapPin className="w-4 h-4 text-blue-600 shrink-0" /> Oddział #{branch.branchNumber || '---'}</p>
                            <p className="text-xs text-slate-600 pl-6">{branch.city || '---'}, {branch.street || '---'}</p>
                            <p className="text-xs text-slate-600 pl-6 capitalize">Typ oddziału: {branch.branchType || '---'}</p>
                            <div className="flex gap-4 text-xs text-slate-400 pl-6 pt-1">
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Start: {startTime ? new Date(startTime).toLocaleString('pl-PL') : '---'}</span>
                            </div>
                            <div className="flex gap-4 text-xs text-slate-400 pl-6">
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Stop: {endTime ? new Date(endTime).toLocaleString('pl-PL') : '---'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Block 2: CCTV Summary */}
                        <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
                          <h4 className="font-bold text-slate-700 uppercase tracking-wide text-xs">Telewizja Przemysłowa (CCTV)</h4>
                          <div className="space-y-2">
                            <p className="text-xs font-semibold">Rejestratory: ({cctv.rows.length}):</p>
                            <div className="space-y-1.5 pl-2">
                              {cctv.rows.map((row, i) => (
                                <p key={i} className="text-xs text-slate-600 border-l-2 border-blue-200 pl-2">
                                  <span className="font-medium text-slate-700">{row.model === 'inne' ? (row.customModel || 'inne') : (row.model || 'Brak modelu')}</span> {row.serialNumber ? `(S/N: ${row.serialNumber})` : ''} - analog: {row.analogCount}, cyfr: {row.digitalCount}
                                </p>
                              ))}
                            </div>
                            <p className="text-xs pt-1 border-t border-slate-200/60">
                              W szafie serwerowej: <span className="font-bold text-slate-700">{cctv.inRack === true ? 'TAK' : cctv.inRack === false ? 'NIE' : 'NIE OKREŚLONO'}</span>
                            </p>
                            {cctv.comment && (
                              <p className="text-xs italic text-slate-500 bg-white p-1.5 rounded border border-slate-100">{cctv.comment}</p>
                            )}
                          </div>
                        </div>

                        {/* Block 3: SKD summary */}
                        {!isIsland && (
                          <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
                            <h4 className="font-bold text-slate-700 uppercase tracking-wide text-xs">Kontrola Dostępu (SKD)</h4>
                            <div className="space-y-2">
                              <p className="text-xs font-semibold">Drzwi ({doors.length}):</p>
                              <div className="space-y-1 pl-2 max-h-[140px] overflow-y-auto">
                                {doors.map((d, i) => (
                                  <p key={d.id} className="text-xs text-slate-600">
                                    • <span className="font-medium text-slate-700">{d.name || 'Drzwi bez nazwy'}</span> ({d.authType || 'nie wybrano'}, {d.handleType || 'nie wybrano'}) {d.lockOnArmed === true ? ' - Śluzowanie: TAK' : d.lockOnArmed === false ? ' - Śluzowanie: NIE' : ' - Śluzowanie: Nie wybrano'} - [{d.lockMethod}]
                                  </p>
                                ))}
                              </div>
                              <p className="text-xs pt-2 border-t border-slate-200/60">
                                Przedsionek bankomatowy: <span className="font-bold text-slate-700">
                                  {atmVestibule.hasLock === 'no_vestibule' ? 'NIE (brak przedsionka)' :
                                   atmVestibule.hasLock === true ? `TAK (${
                                     atmVestibule.lockType === 'czytnik' ? 'Czytnik' :
                                     atmVestibule.lockType === 'analityka' ? 'Kamera z analityką' :
                                     atmVestibule.lockType === 'glosnik' ? 'Kamera+Głośnik' : 'Brak typu'
                                   })` : atmVestibule.hasLock === false ? 'NIE (brak blokady)' : 'Nie wybrano'}
                                </span>
                              </p>
                              {skdComment && (
                                <p className="text-xs italic text-slate-500 bg-white p-1.5 rounded border border-slate-100 mt-1">{skdComment}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Block 4: Akumulatory */}
                        <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
                          <h4 className="font-bold text-slate-700 uppercase tracking-wide text-xs">Pomiary Akumulatorów</h4>
                          <div className={`grid grid-cols-1 ${isIsland ? '' : 'sm:grid-cols-2'} gap-4 text-xs`}>
                            <div>
                              <p className="font-semibold text-blue-700 mb-1"> Centrala i ekspandery:</p>
                              <div className="space-y-1">
                                {batteryData.leftTable.map(r => (
                                  <p key={r.id} className="text-[11px] text-slate-600">• {r.name}: {r.capacity === 'brak_aku' ? 'brak aku' : `${r.capacity}Ah`} ({r.efficiency}%)</p>
                                ))}
                              </div>
                            </div>
                            {!isIsland && (
                              <div>
                                <p className="font-semibold text-blue-700 mb-1">Zasilacz SSWiN / SKD:</p>
                                <div className="space-y-1">
                                  {batteryData.rightTable.map(r => (
                                    <p key={r.id} className="text-[11px] text-slate-600">• {r.name}: {r.capacity === 'brak_aku' ? 'brak aku' : `${r.capacity}Ah`} ({r.efficiency}%)</p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          {!isIsland && batteryData.fuseType && (
                            <div className="pt-2 border-t border-slate-200/60 text-xs">
                              <span className="font-semibold text-slate-700">Dedykowany bezpiecznik w rozdzielni:</span>{' '}
                              <span className="text-slate-600 font-medium">{batteryData.fuseType}</span>
                            </div>
                          )}
                        </div>

                        {/* Block 5: Monitoring i Transmisja SMA */}
                        <div className="col-span-1 md:col-span-2 p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-100">
                          <h4 className="font-bold text-slate-700 uppercase tracking-wide text-xs">Monitoring i Transmisja SMA</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                            {monitoringData.rows.map((row) => (
                              <div key={row.signalName} className="p-2.5 bg-white rounded-lg border border-slate-200/50 flex flex-col justify-between">
                                <span className="font-semibold text-slate-800 mb-1.5">{row.signalName}</span>
                                <div className="flex justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                                  <span>Po nadajniku: <strong className="text-slate-700">{row.transmitter ? 'TAK' : row.transmitter === false ? 'NIE' : 'brak'}</strong></span>
                                  {!isIsland && <span>Drugi tor: <strong className="text-slate-700">{row.secondPath ? 'TAK' : row.secondPath === false ? 'NIE' : 'brak'}</strong></span>}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t border-slate-200/60 text-xs space-y-1.5">
                            {!isIsland && (
                              <div>
                                <span className="font-semibold text-slate-700">Drugi tor monitorowania oddziału:</span>{' '}
                                <span className="text-slate-600 font-medium">
                                  {monitoringData.secondPathType === 'linia_telefoniczna' ? 'Linia telefoniczna' :
                                   monitoringData.secondPathType === 'epx400' ? 'Nadajnik EPX400' :
                                   monitoringData.secondPathType === 'drugi_gsm' ? 'Drugi nadajnik GSM' :
                                   monitoringData.secondPathType === 'inne' ? `inne: ${monitoringData.secondPathOtherText || ''}` : 'Nie wybrano'}
                                </span>
                              </div>
                            )}
                            {monitoringData.gsmTransmitterNumber && (
                              <div>
                                <span className="font-semibold text-slate-700">Numer nadajnika GSM na stacji SMA:</span>{' '}
                                <span className="text-slate-600 font-mono font-medium">{monitoringData.gsmTransmitterNumber}</span>
                              </div>
                            )}
                            {!isIsland && monitoringData.secondPathTransmitterNumber && (
                              <div>
                                <span className="font-semibold text-slate-700">Numer nadajnika 2go toru na stacji SMA:</span>{' '}
                                <span className="text-slate-600 font-mono font-medium">{monitoringData.secondPathTransmitterNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Block 6: Zadania Dodatkowe i Wytyczne */}
                        {protocolTasks.length > 0 && (
                          <div className="col-span-1 md:col-span-2 p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                            <h4 className="font-bold text-slate-700 uppercase tracking-wide text-xs flex items-center gap-1.5">
                              <span>📋</span> Zadania Dodatkowe i Wytyczne ({protocolTasks.length})
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              {protocolTasks.map((t) => (
                                <div key={t.taskId} className="p-3 bg-white rounded-lg border border-slate-200/50 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className={`w-2 h-2 rounded-full ${t.isCompleted ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                      <span className="font-bold text-slate-800 leading-snug">{t.title}</span>
                                    </div>
                                    {t.description && <p className="text-[10px] text-slate-400 italic mb-1.5">{t.description}</p>}
                                  </div>
                                  <div className="pt-2 border-t border-slate-100 mt-2 flex flex-col gap-1">
                                    <p className="text-[10px]">
                                      Status: <strong className={t.isCompleted ? 'text-emerald-600' : 'text-rose-600'}>{t.isCompleted ? 'WYKONANO' : 'NIE WYKONANO'}</strong>
                                    </p>
                                    {t.comment && (
                                      <p className="text-[10px] text-slate-500 bg-slate-50 p-1 rounded font-medium">
                                        Uwagi: {t.comment}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Czas Konserwacji Card */}
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-200/60 pb-3">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          Czas Konserwacji
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Data i godzina rozpoczęcia</label>
                            <input
                              id="maintenance-start"
                              type="datetime-local"
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all font-mono"
                              value={startTime}
                              onChange={handleStartTimeChange}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Godzina zakończenia</label>
                            <input
                              id="maintenance-end"
                              type="time"
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all font-mono"
                              value={endTimeValue}
                              onChange={handleEndTimeTimeChange}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Block 5: Oświadczenie z fotoweryfikacją */}
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                              <Camera className="w-4 h-4 text-blue-600" />
                              Oświadczenie z fotoweryfikacją (Dowód obecności)
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              Zrób zdjęcie karty dostępowej pracownika banku lub pieczątki imiennej z podpisem na małej karteczce. Zdjęcie zostanie automatycznie wklejone w dolną sekcję protokołu.
                            </p>
                          </div>
                          {photoVerification && (
                            <button
                              id="btn-remove-verification-photo"
                              type="button"
                              onClick={() => setPhotoVerification('')}
                              className="text-xs text-blue-500 hover:text-blue-700 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors self-start sm:self-auto"
                            >
                              Usuń zdjęcie
                            </button>
                          )}
                        </div>

                        <div className="flex flex-col items-center justify-center">
                          {photoVerification ? (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white shadow-inner p-2 max-w-md w-full">
                              <img
                                src={photoVerification}
                                alt="Fotoweryfikacja"
                                className="w-full h-48 object-contain rounded-lg"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <label className="cursor-pointer bg-white text-slate-800 text-xs font-bold px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors shadow flex items-center gap-1.5">
                                  <Camera className="w-4 h-4 text-blue-600" />
                                  Zmień zdjęcie
                                  <input
                                    id="file-capture-change"
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={handlePhotoCapture}
                                  />
                                </label>
                              </div>
                            </div>
                          ) : (
                            <label className="w-full max-w-md border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-white hover:bg-blue-50/10 cursor-pointer transition-all">
                              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <Camera className="w-6 h-6 animate-pulse" />
                              </div>
                              <div className="text-center">
                                <span className="bg-blue-600 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm hover:bg-blue-700 transition-colors inline-block">
                                  Zrób zdjęcie identyfikatora / pieczątki
                                </span>
                                <p className="text-[11px] text-slate-400 mt-2">
                                  Kliknij, aby uruchomić aparat
                                </p>
                              </div>
                              <input
                                id="file-capture-primary"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handlePhotoCapture}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Submit & Send triggers */}
                      <div className="pt-4">
                      </div>

                      {/* Display sending status messages */}
                      {(!startTime || !endTime) && (
                        <div className="p-4 rounded-xl border text-sm bg-amber-50 border-amber-200 text-amber-800 flex gap-2 items-center">
                          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                          <span>Wypełnij datę i godzinę rozpoczęcia oraz zakończenia konserwacji, aby móc wysłać protokół.</span>
                        </div>
                      )}
                      
                      {emailStatus !== 'idle' && (
                        <div
                          className={`p-4 rounded-xl border text-sm ${
                            emailStatus === 'success'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                              : emailStatus === 'error'
                              ? 'bg-blue-50 border-blue-100 text-blue-800'
                              : 'bg-blue-50 border-blue-100 text-blue-800 animate-pulse'
                          }`}
                        >
                          <div className="flex gap-2 items-center">
                            {emailStatus === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
                            {emailStatus === 'error' && <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0" />}
                            {emailStatus === 'sending' && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />}
                            <span>{emailMessage || (emailStatus === 'sending' ? 'Wysyłanie protokołu przez API...' : '')}</span>
                          </div>
                        </div>
                      )}

                      {/* Primary send action buttons */}
                      <div className="pt-2 flex flex-col sm:flex-row gap-3">
                        <button
                          id="btn-submit-and-send"
                          type="button"
                          onClick={handleSubmitProtocol}
                          disabled={emailStatus === 'sending' || !startTime || !endTime}
                          className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/10 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Mail className="w-5 h-5" />
                          Wyślij protokół na adresy e-mail
                        </button>
                        
                        <a
                          id="link-mailto-fallback"
                          href={!startTime || !endTime ? '#' : generateMailtoUrl(currentProtocol)}
                          className={`py-4 px-6 bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm ${(!startTime || !endTime) ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-200'}`}
                          title="Alternatywna wysyłka"
                        >
                          Otwórz w programie pocztowym (Mailto)
                        </a>
                      </div>

                    </div>

                    {/* Footer Nav Buttons */}
                    <div className="flex justify-between pt-2">
                      <button
                        id="btn-prev-step-6"
                        type="button"
                        onClick={() => setActiveStep(5)}
                        className="px-5 py-3 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm"
                      >
                        Cofnij
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <AdminPanelContainer />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic spacer to allow scrolling when virtual keyboard is active */}
        {isKeyboardActive && (
          <div className="h-[40vh] pointer-events-none transition-all duration-300" />
        )}
      </main>

      {/* Footer copyright */}
      <footer className="bg-slate-100 py-6 px-6 text-center text-xs text-slate-400 border-t border-slate-200 mt-auto shrink-0">
        <p>© 2026 Protokół Konserwacji. Wszystkie dane są zapisywane lokalnie na Twoim urządzeniu.</p>
      </footer>

      {/* Signature Cropper Modal overlay */}
      {rawCapturedPhoto && (
        <SignatureCropper
          imageSrc={rawCapturedPhoto}
          branchNumber={branch.branchNumber}
          onConfirm={(croppedBase64) => {
            setPhotoVerification(croppedBase64);
            setRawCapturedPhoto('');
          }}
          onCancel={() => {
            setRawCapturedPhoto('');
          }}
        />
      )}
    </div>
  );
}
