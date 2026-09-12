import React from 'react';
import { BatteryData, BatteryRow, BatteryCapacity } from '../types';
import { Battery, Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';

interface BatterySectionProps {
  batteryData: BatteryData;
  onChange: (data: BatteryData) => void;
  onNext: () => void;
  onPrev: () => void;
  isIsland?: boolean;
}

export default function BatterySection({
  batteryData,
  onChange,
  onNext,
  onPrev,
  isIsland = false
}: BatterySectionProps) {
  const [validationAttempted, setValidationAttempted] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  // Left table add row
  const handleAddLeftRow = () => {
    const nextNum = batteryData.leftTable.length + 1;
    const newRow: BatteryRow = {
      id: crypto.randomUUID(),
      name: `Ekspander ${nextNum}`,
      capacity: '17'
    };
    onChange({
      ...batteryData,
      leftTable: [...batteryData.leftTable, newRow]
    });
  };

  // Right table add row (SSWiN / SKD Power Supplies)
  const handleAddRightRow = () => {
    const sswinCount = batteryData.rightTable.filter(r => r.name.includes('SSWiN')).length;
    const name = sswinCount > 0 ? `Zasilacz SKD` : `Zasilacz SSWiN`;
    const newRow: BatteryRow = {
      id: crypto.randomUUID(),
      name,
      capacity: '65'
    };
    onChange({
      ...batteryData,
      rightTable: [...batteryData.rightTable, newRow]
    });
  };

  // Remove row from left table
  const handleRemoveLeftRow = (id: string) => {
    onChange({
      ...batteryData,
      leftTable: batteryData.leftTable.filter(r => r.id !== id)
    });
  };

  // Remove row from right table
  const handleRemoveRightRow = (id: string) => {
    onChange({
      ...batteryData,
      rightTable: batteryData.rightTable.filter(r => r.id !== id)
    });
  };

  // Update Left row field
  const handleLeftRowChange = (id: string, field: keyof BatteryRow, value: any) => {
    const updated = batteryData.leftTable.map(r => {
      if (r.id === id) {
        if (field === 'efficiency') {
          if (value === '') {
            return { ...r, efficiency: undefined };
          }
          let val = parseInt(value, 10);
          if (!isNaN(val) && val > 120) {
            val = 120;
          }
          return { ...r, efficiency: isNaN(val) ? undefined : val };
        }
        return { ...r, [field]: value };
      }
      return r;
    });
    onChange({
      ...batteryData,
      leftTable: updated
    });
  };

  // Update Right row field
  const handleRightRowChange = (id: string, field: keyof BatteryRow, value: any) => {
    const updated = batteryData.rightTable.map(r => {
      if (r.id === id) {
        if (field === 'efficiency') {
          if (value === '') {
            return { ...r, efficiency: undefined };
          }
          let val = parseInt(value, 10);
          if (!isNaN(val) && val > 120) {
            val = 120;
          }
          return { ...r, efficiency: isNaN(val) ? undefined : val };
        }
        return { ...r, [field]: value };
      }
      return r;
    });
    onChange({
      ...batteryData,
      rightTable: updated
    });
  };

  // Triggered on Next step click
  const handleNextClick = () => {
    const hasIncompleteLeft = batteryData.leftTable.some(
      r => r.efficiency === undefined || r.efficiency === null || isNaN(r.efficiency) || !r.installationDate
    );
    const hasIncompleteRight = !isIsland && batteryData.rightTable.some(
      r => r.efficiency === undefined || r.efficiency === null || isNaN(r.efficiency) || !r.installationDate
    );

    if (hasIncompleteLeft || hasIncompleteRight) {
      setValidationAttempted(true);
      setErrorMsg('Dla wszystkich dodanych akumulatorów pola sprawność (%) oraz data montażu są obowiązkowe.');
      
      // Scroll up to show the error banner
      setTimeout(() => {
        const element = document.getElementById('battery-error-banner');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    const hasTooHighLeftEff = batteryData.leftTable.some(
      r => r.efficiency !== undefined && r.efficiency !== null && r.efficiency > 120
    );
    const hasTooHighRightEff = !isIsland && batteryData.rightTable.some(
      r => r.efficiency !== undefined && r.efficiency !== null && r.efficiency > 120
    );

    if (hasTooHighLeftEff || hasTooHighRightEff) {
      setValidationAttempted(true);
      setErrorMsg('Sprawność akumulatora nie może być większa niż 120%.');
      
      setTimeout(() => {
        const element = document.getElementById('battery-error-banner');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    setValidationAttempted(false);
    setErrorMsg('');
    onNext();
  };

  return (
    <div id="battery-section" className="space-y-6">
      {errorMsg && (
        <div
          id="battery-error-banner"
          className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-xs flex items-start gap-2.5 animate-fadeIn"
        >
          <span className="font-bold text-blue-600 bg-blue-100/60 px-1.5 py-0.5 rounded text-[10px]">BŁĄD WALIDACJI</span>
          <p className="font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Bento grid split for left and right battery tables */}
      <div className={`grid grid-cols-1 ${isIsland ? '' : 'lg:grid-cols-2'} gap-6`}>
        
        {/* LEFT TABLE: Centrale i Ekspandery */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-1.5">
              <Battery className="w-5 h-5 text-blue-600" />
              Centrala i ekspandery
            </h3>
            <button
              id="btn-add-battery-left"
              type="button"
              onClick={handleAddLeftRow}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Dodaj
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {batteryData.leftTable.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Brak urządzeń w lewej tabeli.</p>
            ) : (
              <div className="space-y-3">
                {/* Header labels */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  <div className="col-span-4">Urządzenie <span className="text-red-500">*</span></div>
                  <div className="col-span-3">Pojemność</div>
                  <div className="col-span-2 text-center">Sprawność % <span className="text-red-500">*</span></div>
                  <div className="col-span-3">Data montażu <span className="text-red-500">*</span></div>
                </div>

                {batteryData.leftTable.map((row) => {
                  const isEffIncomplete = row.efficiency === undefined || row.efficiency === null;
                  const isDateIncomplete = !row.installationDate;

                  return (
                    <div
                      key={row.id}
                      id={`battery-left-row-${row.id}`}
                      className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      {/* Device name */}
                      <div className="col-span-1 sm:col-span-4">
                        <label className="block sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-1">Nazwa <span className="text-red-500">*</span></label>
                        <input
                          id={`bat-left-name-${row.id}`}
                          type="text"
                          required
                          className={`w-full px-2 py-1.5 bg-white border rounded-lg text-xs focus:outline-none focus:ring-2 ${
                            !row.name.trim()
                              ? 'border-amber-300 focus:ring-amber-500/10 focus:border-amber-500'
                              : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500'
                          }`}
                          value={row.name}
                          onChange={(e) => handleLeftRowChange(row.id, 'name', e.target.value)}
                        />
                      </div>

                      {/* Capacity dropdown */}
                      <div className="col-span-1 sm:col-span-3">
                        <label className="block sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-1">Pojemność</label>
                        <select
                          id={`bat-left-cap-${row.id}`}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                          value={row.capacity}
                          onChange={(e) => handleLeftRowChange(row.id, 'capacity', e.target.value as BatteryCapacity)}
                        >
                          <option value="brak_aku">brak aku</option>
                          <option value="7">7 Ah</option>
                          <option value="17">17 Ah</option>
                          <option value="42">42 Ah</option>
                          <option value="65">65 Ah</option>
                        </select>
                      </div>

                      {/* Efficiency */}
                      <div className="col-span-1 sm:col-span-2">
                        <label className="block sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-1">Sprawność (%) <span className="text-red-500">*</span></label>
                        <input
                          id={`bat-left-eff-${row.id}`}
                          type="number"
                          min="0"
                          max="120"
                          placeholder="np. 95"
                          className={`w-full px-2 py-1.5 bg-white border rounded-lg text-xs text-center focus:outline-none focus:ring-2 transition-colors ${
                            isEffIncomplete
                              ? 'border-amber-300 focus:ring-amber-500/10 focus:border-amber-500 font-medium'
                              : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500'
                          }`}
                          value={row.efficiency !== undefined ? row.efficiency : ''}
                          onChange={(e) => handleLeftRowChange(row.id, 'efficiency', e.target.value)}
                        />
                      </div>

                      {/* Installation Date + Delete button */}
                      <div className="col-span-1 sm:col-span-3 flex items-center gap-1.5">
                        <div className="flex-1">
                          <label className="block sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-1">Data montażu <span className="text-red-500">*</span></label>
                          <input
                            id={`bat-left-date-${row.id}`}
                            type="month"
                            className={`w-full px-2 py-1.5 bg-white border rounded-lg text-[10px] focus:outline-none focus:ring-2 font-mono transition-colors ${
                              isDateIncomplete
                                ? 'border-amber-300 focus:ring-amber-500/10 focus:border-amber-500 font-medium'
                                : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500'
                            }`}
                            value={row.installationDate || ''}
                            onChange={(e) => handleLeftRowChange(row.id, 'installationDate', e.target.value)}
                          />
                        </div>
                        <button
                          id={`bat-left-delete-${row.id}`}
                          type="button"
                          onClick={() => handleRemoveLeftRow(row.id)}
                          className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors self-end sm:self-auto"
                          title="Usuń wiersz"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT TABLE: Zasilacze pomocnicze */}
        {!isIsland && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-1.5">
                <Battery className="w-5 h-5 text-blue-600 animate-pulse" />
                Zasilacz SSWiN / SKD
              </h3>
              <button
                id="btn-add-battery-right"
                type="button"
                onClick={handleAddRightRow}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Dodaj
              </button>
            </div>

            <div className="space-y-4 flex-1">
              {batteryData.rightTable.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Brak urządzeń w prawej tabeli.</p>
              ) : (
                <div className="space-y-3">
                  {/* Header labels */}
                  <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    <div className="col-span-4">Urządzenie <span className="text-red-500">*</span></div>
                    <div className="col-span-3">Pojemność</div>
                    <div className="col-span-2 text-center">Sprawność % <span className="text-red-500">*</span></div>
                    <div className="col-span-3">Data montażu <span className="text-red-500">*</span></div>
                  </div>

                  {batteryData.rightTable.map((row) => {
                    const isEffIncomplete = row.efficiency === undefined || row.efficiency === null;
                    const isDateIncomplete = !row.installationDate;

                    return (
                      <div
                        key={row.id}
                        id={`battery-right-row-${row.id}`}
                        className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                      >
                        {/* Device name */}
                        <div className="col-span-1 sm:col-span-4">
                          <label className="block sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-1">Urządzenie <span className="text-red-500">*</span></label>
                          <input
                            id={`bat-right-name-${row.id}`}
                            type="text"
                            required
                            placeholder="np. Zasilacz SSWiN"
                            className={`w-full px-2 py-1.5 bg-white border rounded-lg text-xs focus:outline-none focus:ring-2 ${
                              !row.name.trim()
                                ? 'border-amber-300 focus:ring-amber-500/10 focus:border-amber-500'
                                : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500'
                            }`}
                            value={row.name}
                            onChange={(e) => handleRightRowChange(row.id, 'name', e.target.value)}
                          />
                        </div>

                        {/* Capacity dropdown */}
                        <div className="col-span-1 sm:col-span-3">
                          <label className="block sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-1">Pojemność</label>
                          <select
                            id={`bat-right-cap-${row.id}`}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                            value={row.capacity}
                            onChange={(e) => handleRightRowChange(row.id, 'capacity', e.target.value as BatteryCapacity)}
                          >
                            <option value="brak_aku">brak aku</option>
                            <option value="7">7 Ah</option>
                            <option value="17">17 Ah</option>
                            <option value="42">42 Ah</option>
                            <option value="65">65 Ah</option>
                          </select>
                        </div>

                        {/* Efficiency */}
                        <div className="col-span-1 sm:col-span-2">
                          <label className="block sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-1">Sprawność (%) <span className="text-red-500">*</span></label>
                          <input
                            id={`bat-right-eff-${row.id}`}
                            type="number"
                            min="0"
                            max="120"
                            placeholder="np. 95"
                            className={`w-full px-2 py-1.5 bg-white border rounded-lg text-xs text-center focus:outline-none focus:ring-2 transition-colors ${
                              isEffIncomplete
                                ? 'border-amber-300 focus:ring-amber-500/10 focus:border-amber-500 font-medium'
                                : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500'
                            }`}
                            value={row.efficiency !== undefined ? row.efficiency : ''}
                            onChange={(e) => handleRightRowChange(row.id, 'efficiency', e.target.value)}
                          />
                        </div>

                        {/* Installation Date + Delete button */}
                        <div className="col-span-1 sm:col-span-3 flex items-center gap-1.5">
                          <div className="flex-1">
                            <label className="block sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-1">Data montażu <span className="text-red-500">*</span></label>
                            <input
                              id={`bat-right-date-${row.id}`}
                              type="month"
                              className={`w-full px-2 py-1.5 bg-white border rounded-lg text-[10px] focus:outline-none focus:ring-2 font-mono transition-colors ${
                                isDateIncomplete
                                  ? 'border-amber-300 focus:ring-amber-500/10 focus:border-amber-500 font-medium'
                                  : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500'
                              }`}
                              value={row.installationDate || ''}
                              onChange={(e) => handleRightRowChange(row.id, 'installationDate', e.target.value)}
                            />
                          </div>
                          <button
                            id={`bat-right-delete-${row.id}`}
                            type="button"
                            onClick={() => handleRemoveRightRow(row.id)}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors self-end sm:self-auto"
                            title="Usuń wiersz"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Sekcja 3: Bezpiecznik */}
      {!isIsland && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mt-6 animate-fadeIn">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-1.5 mb-4">
            <span className="p-1 bg-blue-50 text-blue-600 rounded-lg">🛡️</span>
            Bezpiecznik
          </h3>
          <div className="space-y-3">
            <label htmlFor="fuse-type" className="block text-sm font-semibold text-slate-700">
              Typ bezpiecznika w rozdzielni, dedykowany pod alarm:
            </label>
            <input
              id="fuse-type"
              type="text"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium text-slate-800 placeholder-slate-400"
              placeholder="Wpisz typ bezpiecznika np. B10, B16..."
              value={batteryData.fuseType || ''}
              onChange={(e) => onChange({ ...batteryData, fuseType: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-2">
        <button
          id="btn-prev-step-4"
          type="button"
          onClick={onPrev}
          className="px-5 py-3 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm"
        >
          Cofnij
        </button>
        <button
          id="btn-next-step-4"
          type="button"
          onClick={handleNextClick}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-600/10 text-sm"
        >
          Dalej: Monitoring
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
