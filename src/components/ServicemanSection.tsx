import React from 'react';
import { ServicemanData, BranchData, ProtocolTask } from '../types';
import { User, Phone, MapPin, Building, Calendar, ArrowRight } from 'lucide-react';

interface ServicemanSectionProps {
  serviceman: ServicemanData;
  onServicemanChange: (data: ServicemanData) => void;
  branch: BranchData;
  onBranchChange: (data: BranchData) => void;
  onNext: () => void;
  protocolTasks: ProtocolTask[];
  onProtocolTasksChange: (tasks: ProtocolTask[]) => void;
}

export default function ServicemanSection({
  serviceman,
  onServicemanChange,
  branch,
  onBranchChange,
  onNext,
  protocolTasks,
  onProtocolTasksChange
}: ServicemanSectionProps) {

  const handleServicemanChange = (field: keyof ServicemanData, value: string) => {
    if (field === 'phone') {
      // Restrict characters: only allow digits, spaces, dashes, parentheses and plus sign
      const sanitized = value.replace(/[^0-9\s\-()+]/g, '');
      onServicemanChange({
        ...serviceman,
        [field]: sanitized
      });
      return;
    }
    onServicemanChange({
      ...serviceman,
      [field]: value
    });
  };

  const getPhoneError = (phone: string): string | null => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 0) return 'Numer musi zawierać cyfry';
    if (digits.length < 9) {
      return `Za krótki numer (wpisano ${digits.length} z wymaganych 9 cyfr)`;
    }
    if (digits.length === 10) {
      return 'Niepoprawna długość (10 cyfr). Polski numer ma 9 cyfr (np. 501 202 303) lub 11 z prefiksem 48';
    }
    if (digits.length > 11) {
      return `Za długi numer (wpisano ${digits.length} cyfr. Maksymalnie 11 z prefiksem 48)`;
    }
    if (digits.length === 11 && !digits.startsWith('48')) {
      return 'Dla 11 cyfr wymagany jest polski kierunkowy "48" na początku';
    }
    return null;
  };

  const phoneError = getPhoneError(serviceman.phone);

  const getBranchNumberError = (val: string): string | null => {
    if (!val) return 'Wpisz numer oddziału (001 - 99999)';
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 99999) {
      return 'Numer oddziału musi być liczbą w przedziale od 001 do 99999';
    }
    return null;
  };

  const branchNumberError = getBranchNumberError(branch.branchNumber);

  const handleBranchChange = (field: keyof BranchData, value: string) => {
    let sanitizedValue = value;
    if (field === 'branchNumber') {
      // Tylko cyfry i maks 5 znaków
      sanitizedValue = value.replace(/\D/g, '').slice(0, 5);
    } else if (field === 'city') {
      // Tylko litery (w tym polskie diakrytyki) i spacje
      sanitizedValue = value.replace(/[^a-zA-ZąęćńłóśźżĄĘĆŃŁÓŚŹŻ\s]/g, '');
    }
    onBranchChange({
      ...branch,
      [field]: sanitizedValue
    });
  };

  return (
    <div id="serviceman-section" className="space-y-6">
      {/* Dane Serwisanta Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Dane Serwisanta <span className="text-xs text-blue-500 font-normal bg-blue-50 px-2 py-0.5 rounded-full">Zapisywane automatycznie</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Firma <span className="text-red-500">*</span></label>
            <div className="relative">
              <select
                id="serviceman-company"
                className={`w-full pl-9 pr-8 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-all appearance-none cursor-pointer ${
                  !serviceman.company
                    ? 'border-amber-300 focus:ring-amber-500/20 focus:border-amber-500'
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
                value={serviceman.company || ''}
                onChange={(e) => handleServicemanChange('company', e.target.value)}
                required
              >
                <option value="">-- Wybierz --</option>
                <option value="Solid">Solid</option>
                <option value="Garda">Garda</option>
              </select>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                🏢
              </span>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                ▼
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Imię <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                id="serviceman-firstname"
                type="text"
                className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-all ${
                  !serviceman.firstName
                    ? 'border-amber-300 focus:ring-amber-500/20 focus:border-amber-500'
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
                placeholder="np. Jan"
                value={serviceman.firstName}
                onChange={(e) => handleServicemanChange('firstName', e.target.value)}
                required
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                👤
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nazwisko <span className="text-red-500">*</span></label>
            <input
              id="serviceman-lastname"
              type="text"
              className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-all ${
                !serviceman.lastName
                  ? 'border-amber-300 focus:ring-amber-500/20 focus:border-amber-500'
                  : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
              }`}
              placeholder="np. Kowalski"
              value={serviceman.lastName}
              onChange={(e) => handleServicemanChange('lastName', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Numer telefonu <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                id="serviceman-phone"
                type="tel"
                className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-all ${
                  phoneError 
                    ? 'border-blue-400 focus:ring-blue-500/20 focus:border-blue-500 text-blue-900 bg-blue-50/10' 
                    : !serviceman.phone
                    ? 'border-amber-300 focus:ring-amber-500/20 focus:border-amber-500'
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800'
                }`}
                placeholder="np. 500 600 700"
                value={serviceman.phone}
                onChange={(e) => handleServicemanChange('phone', e.target.value)}
                required
              />
              <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${phoneError ? 'text-blue-400' : (!serviceman.phone ? 'text-amber-400' : 'text-slate-400')}`} />
            </div>
            {phoneError && (
              <p className="text-[11px] text-blue-500 mt-1 font-medium leading-tight">
                ⚠️ {phoneError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dane Oddziału Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" />
          Dane Oddziału
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Numer oddziału <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                id="branch-number"
                type="text"
                className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-all font-medium ${
                  !branch.branchNumber
                    ? 'border-amber-300 focus:ring-amber-500/20 focus:border-amber-500'
                    : branchNumberError 
                    ? 'border-blue-400 focus:ring-blue-500/20 focus:border-blue-500 text-blue-900 bg-blue-50/10' 
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800'
                }`}
                placeholder="np. 001 lub 1243"
                value={branch.branchNumber}
                onChange={(e) => handleBranchChange('branchNumber', e.target.value)}
                required
              />
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs ${!branch.branchNumber ? 'text-amber-400' : branchNumberError ? 'text-blue-400' : 'text-slate-400'}`}>#</span>
            </div>
            {branchNumberError && branch.branchNumber && (
              <p className="text-[11px] text-blue-500 mt-1 font-medium leading-tight">
                ⚠️ {branchNumberError}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Miejscowość <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                id="branch-city"
                type="text"
                className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-all ${
                  !branch.city
                    ? 'border-amber-300 focus:ring-amber-500/20 focus:border-amber-500'
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
                placeholder="np. Warszawa"
                value={branch.city}
                onChange={(e) => handleBranchChange('city', e.target.value)}
                required
              />
              <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${!branch.city ? 'text-amber-400' : 'text-slate-400'}`} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Ulica i numer <span className="text-red-500">*</span></label>
            <input
              id="branch-street"
              type="text"
              className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-all ${
                !branch.street
                  ? 'border-amber-300 focus:ring-amber-500/20 focus:border-amber-500'
                  : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
              }`}
              placeholder="np. Marszałkowska 102"
              value={branch.street}
              onChange={(e) => handleBranchChange('street', e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Typ oddziału <span className="text-red-500">*</span></label>
          <div className="flex flex-wrap gap-4">
            {['wyspa', 'korporacje', 'detal'].map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${branch.branchType === type ? 'border-blue-600 bg-blue-50' : (!branch.branchType ? 'border-amber-400' : 'border-slate-300')}`}>
                  {branch.branchType === type && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                </div>
                <input
                  type="radio"
                  name="branchType"
                  value={type}
                  className="hidden"
                  checked={branch.branchType === type}
                  onChange={(e) => handleBranchChange('branchType', e.target.value)}
                  required
                />
                <span className="text-sm font-medium text-slate-700 capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Zadania Dodatkowe dla tego Oddziału */}
      {protocolTasks.length > 0 && (
        <div id="additional-tasks-card" className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">📋</span>
            Wymagane Zadania Dodatkowe dla Oddziału #{branch.branchNumber}
          </h3>
          <p className="text-xs text-slate-400">
            Dla tego oddziału przypisano dodatkowe wytyczne, które musisz zrealizować i odznaczyć podczas konserwacji:
          </p>

          <div className="space-y-3">
            {protocolTasks.map((task) => (
              <div
                key={task.taskId}
                className={`p-4 rounded-xl border transition-all ${
                  task.isCompleted
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-slate-50 border-slate-200/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`task-check-${task.taskId}`}
                    checked={task.isCompleted}
                    onChange={(e) => {
                      const updated = protocolTasks.map(t =>
                        t.taskId === task.taskId ? { ...t, isCompleted: e.target.checked } : t
                      );
                      onProtocolTasksChange(updated);
                    }}
                    className="mt-1 h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500/30 cursor-pointer"
                  />
                  <div className="flex-1 space-y-2">
                    <label
                      htmlFor={`task-check-${task.taskId}`}
                      className={`text-sm font-bold text-slate-800 cursor-pointer leading-tight block ${
                        task.isCompleted ? 'line-through text-slate-500' : ''
                      }`}
                    >
                      {task.title}
                    </label>
                    {task.description && (
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {task.description}
                      </p>
                    )}

                    <div className="pt-1.5">
                      <input
                        type="text"
                        placeholder="Uwagi / uwagi technika do zadania (opcjonalnie)..."
                        value={task.comment || ''}
                        onChange={(e) => {
                          const updated = protocolTasks.map(t =>
                            t.taskId === task.taskId ? { ...t, comment: e.target.value } : t
                          );
                          onProtocolTasksChange(updated);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation button */}
      <div className="flex justify-end pt-2">
        <button
          id="btn-next-step-1"
          type="button"
          onClick={onNext}
          disabled={!branch.branchNumber || !branch.city || !branch.street || !branch.branchType || !!phoneError || !!branchNumberError || !serviceman.company || !serviceman.firstName || !serviceman.lastName || !serviceman.phone}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-600/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Kolejny krok: CCTV
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
