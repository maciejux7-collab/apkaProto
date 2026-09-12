import React, { useState, useEffect } from 'react';
import { Branch, Technician, MaintenanceSchedule } from '../types/cmms';
import { format, differenceInDays, addMonths, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar, Clock, AlertTriangle, CheckCircle2, Send, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const Scheduler: React.FC = () => {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Branches
      const branchesRes = await fetch('/api/branches');
      const branchesData = await branchesRes.json();
      if (Array.isArray(branchesData)) {
        setBranches(branchesData);
      } else {
        setBranches([]);
      }

      // Fetch Technicians
      const techRes = await fetch('/api/technicians');
      const techData = await techRes.json();
       if (Array.isArray(techData)) {
        setTechnicians(techData.filter((t: any) => t.active));
      } else {
        setTechnicians([]);
      }

      // Fetch Protocols
      const protocolsRes = await fetch('/api/protocols');
      const protocolsData = await protocolsRes.json();
      const safeProtocolsData = Array.isArray(protocolsData) ? protocolsData : [];

      // Calculate Schedules
       const activeBranches = Array.isArray(branchesData) ? branchesData : [];
       const schedulesData = activeBranches.map((branch: any) => {
        // Find latest protocol for this branch
        const lastProtocolRecord = safeProtocolsData.find((p: any) => p.branchNumber === branch.branchNumber);
        
        let lastDate: string | undefined;
        let nextDate: string;
        
        if (lastProtocolRecord) {
          lastDate = lastProtocolRecord.createdAt;
          const lastDateObj = parseISO(lastDate!);
          nextDate = format(addMonths(lastDateObj, branch.maintenanceIntervalMonths || 6), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        } else {
          // If no protocol, set nextDate to yesterday to mark it as urgent immediately
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          nextDate = format(yesterday, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
        }

        const daysRemaining = differenceInDays(parseISO(nextDate), new Date());
        let status: MaintenanceSchedule['status'] = 'ok';
        if (daysRemaining < 0) status = 'urgent';
        else if (daysRemaining < 14) status = 'warning';

        return {
          branchId: branch.id,
          branchNumber: branch.branchNumber,
          city: branch.city,
          lastDate,
          nextDate,
          daysRemaining,
          status
        } as MaintenanceSchedule;
      });

      setSchedules(schedulesData.sort((a: any, b: any) => a.daysRemaining - b.daysRemaining));
    } catch (err) {
      console.error("Error fetching schedule data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!selectedBranch || !selectedTech) return;

    setIsSending(true);
    setSendError(null);
    setSendSuccess(null);

    const token = uuidv4();
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 2); // 2 hours validity

    try {
      await fetch('/api/access-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          branchId: selectedBranch,
          technicianId: selectedTech,
          expiresAt: expirationDate.toISOString(),
          used: false
        })
      });

      const publicBaseUrl = window.location.origin;
      const link = `${publicBaseUrl}/?token=${token}`;
      setGeneratedLink(link);

      // AUTOMATIC EMAIL SENDING
      const tech = technicians.find(t => t.id === selectedTech);
      const branch = branches.find(b => b.id === selectedBranch);

      if (tech && branch) {
        const response = await fetch('/api/send-access-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            technicianEmail: tech.email,
            technicianName: `${tech.firstName} ${tech.lastName}`,
            branchName: `Oddział ${branch.branchNumber} (${branch.city})`,
            accessLink: link
          })
        });

        const data = await response.json();
        if (data.success) {
          setSendSuccess(data.message);
        } else {
          setSendError(data.error || "Błąd wysyłki e-mail.");
        }
      }
    } catch (err) {
      console.error("Error generating token:", err);
      setSendError("Błąd serwera podczas generowania tokena.");
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div className="flex justify-center p-12 text-slate-400">Ładowanie harmonogramu...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Harmonogram Konserwacji</h2>
        <div className="flex gap-2">
           <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">
             <CheckCircle2 className="w-3.5 h-3.5" /> OK
           </div>
           <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold">
             <AlertTriangle className="w-3.5 h-3.5" /> &lt; 14 dni
           </div>
           <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold">
             <Clock className="w-3.5 h-3.5" /> Zaległe
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Oddział</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ostatnia Wizyta</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Następny Termin</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pozostało</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Zleć</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {schedules.map(item => (
              <tr key={item.branchId} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">Oddział #{item.branchNumber}</div>
                  <div className="text-xs text-slate-400">{item.city}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {item.lastDate ? format(parseISO(item.lastDate), 'dd.MM.yyyy') : '---'}
                </td>
                <td className="px-6 py-4">
                  <div className={`text-sm font-bold ${
                    item.status === 'urgent' ? 'text-rose-600' : 
                    item.status === 'warning' ? 'text-amber-600' : 
                    'text-emerald-600'
                  }`}>
                    {format(parseISO(item.nextDate), 'dd.MM.yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    item.status === 'urgent' ? 'bg-rose-50 text-rose-700' : 
                    item.status === 'warning' ? 'bg-amber-50 text-amber-700' : 
                    'bg-emerald-50 text-emerald-700'
                  }`}>
                    {item.daysRemaining < 0 ? `Zaległe ${Math.abs(item.daysRemaining)} dni` : `${item.daysRemaining} dni`}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => { setSelectedBranch(item.branchId); setGeneratedLink(null); }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedBranch && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Generuj Dostęp Czasowy</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Wybrany Oddział</label>
                <div className="p-3 bg-slate-50 rounded-lg font-bold text-slate-800 border border-slate-100">
                  Oddział #{branches.find(b => b.id === selectedBranch)?.branchNumber} ({branches.find(b => b.id === selectedBranch)?.city})
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Wybierz Serwisanta</label>
                <select 
                  className="w-full px-3 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-slate-700"
                  value={selectedTech || ''}
                  onChange={e => setSelectedTech(e.target.value)}
                >
                  <option value="">-- Wybierz z listy --</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.firstName} {tech.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {generatedLink ? (
                <div className="space-y-4 pt-2">
                  {sendSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {sendSuccess}
                    </div>
                  )}
                  {sendError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {sendError}
                    </div>
                  )}
                  
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Link dostępowy (ważny 2h):</p>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-white px-3 py-2 rounded-lg border border-blue-200 text-xs text-blue-800 font-mono overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {generatedLink}
                      </div>
                      <button 
                        onClick={copyToClipboard}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  disabled={!selectedTech || isSending}
                  onClick={handleGenerateLink}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {isSending ? 'Wysyłanie...' : 'Generuj i Wyślij Link'}
                </button>
              )}

              <button
                onClick={() => { setSelectedBranch(null); setGeneratedLink(null); setSelectedTech(null); }}
                className="w-full py-3 text-slate-400 hover:text-slate-600 text-sm font-bold transition-colors"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
