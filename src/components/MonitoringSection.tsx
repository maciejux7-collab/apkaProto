import React from 'react';
import { MonitoringData } from '../types';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface MonitoringSectionProps {
  monitoringData: MonitoringData;
  onChange: (data: MonitoringData) => void;
  onNext: () => void;
  onPrev: () => void;
  isIsland?: boolean;
}

export default function MonitoringSection({
  monitoringData,
  onChange,
  onNext,
  onPrev,
  isIsland = false
}: MonitoringSectionProps) {
  const [validationAttempted, setValidationAttempted] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  const handleToggleTransmitter = (signalName: string, value: boolean) => {
    const updatedRows = monitoringData.rows.map(row => {
      if (row.signalName === signalName) {
        return { ...row, transmitter: row.transmitter === value ? null : value };
      }
      return row;
    });
    onChange({ ...monitoringData, rows: updatedRows });
  };

  const handleToggleSecondPath = (signalName: string, value: boolean) => {
    const updatedRows = monitoringData.rows.map(row => {
      if (row.signalName === signalName) {
        return { ...row, secondPath: row.secondPath === value ? null : value };
      }
      return row;
    });
    onChange({ ...monitoringData, rows: updatedRows });
  };

  const handleSecondPathTypeChange = (type: 'linia_telefoniczna' | 'epx400' | 'drugi_gsm' | 'inne' | '') => {
    onChange({
      ...monitoringData,
      secondPathType: type,
      secondPathOtherText: type === 'inne' ? (monitoringData.secondPathOtherText || '') : ''
    });
  };

  const handleOtherTextChange = (text: string) => {
    onChange({
      ...monitoringData,
      secondPathOtherText: text
    });
  };

  const handleNextClick = () => {
    setValidationAttempted(true);

    // Validate that all rows have both transmitter and secondPath selected (or only transmitter for islands)
    const allRowsSelected = monitoringData.rows.every(
      row => row.transmitter !== null && (isIsland || row.secondPath !== null)
    );

    if (!allRowsSelected) {
      setErrorMsg('Proszę uzupełnić wszystkie pola w tabeli monitoringu (Tak/Nie).');
      return;
    }

    if (!isIsland) {
      // Validate second path question
      if (!monitoringData.secondPathType) {
        setErrorMsg('Wybierz drugi tor monitorowania oddziału.');
        return;
      }

      if (monitoringData.secondPathType === 'inne' && !monitoringData.secondPathOtherText?.trim()) {
        setErrorMsg('Wpisz nazwę innego drugiego toru monitorowania.');
        return;
      }
    }

    setErrorMsg('');
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Main Consolidated Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-fadeIn">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Transmisja sygnałów do SMA</h3>
            <p className="text-xs text-slate-400 mt-0.5">Zaznacz odpowiedź dla każdego sygnału</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Desktop Table Headers */}
        <div className="hidden md:grid grid-cols-12 gap-4 pb-3 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider px-3">
          <div className={isIsland ? 'col-span-8' : 'col-span-6'}>Sygnał</div>
          <div className={`text-center ${isIsland ? 'col-span-4' : 'col-span-3'}`}>Po nadajniku</div>
          {!isIsland && <div className="col-span-3 text-center">Drugi tor monitorowania</div>}
        </div>

        {/* Rows List */}
        <div className="divide-y divide-slate-100 mb-6">
          {monitoringData.rows.map((row) => {
            const isTransmitterMissing = validationAttempted && row.transmitter === null;
            const isSecondPathMissing = validationAttempted && row.secondPath === null;

            return (
              <div
                key={row.signalName}
                className="py-4 md:py-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center px-1 md:px-3 hover:bg-slate-50/40 rounded-xl transition-colors"
              >
                {/* Signal name */}
                <div className={isIsland ? 'col-span-1 md:col-span-8' : 'col-span-1 md:col-span-6'}>
                  <span className="text-sm font-semibold text-slate-800">{row.signalName}</span>
                </div>

                {/* Transmitter Choice */}
                <div className={`col-span-1 ${isIsland ? 'md:col-span-4' : 'md:col-span-3'} flex flex-col md:items-center`}>
                  <span className="block md:hidden text-xs font-semibold text-slate-400 mb-1">Po nadajniku:</span>
                  <div className="flex items-center gap-1.5 md:justify-center w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => handleToggleTransmitter(row.signalName, true)}
                      className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        row.transmitter === true
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : isTransmitterMissing
                          ? 'bg-white border-amber-300 text-slate-600 hover:bg-slate-50'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Tak
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleTransmitter(row.signalName, false)}
                      className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        row.transmitter === false
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : isTransmitterMissing
                          ? 'bg-white border-amber-300 text-slate-600 hover:bg-slate-50'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Nie
                    </button>
                  </div>
                </div>

                {/* Second Path Choice */}
                {!isIsland && (
                  <div className="col-span-1 md:col-span-3 flex flex-col md:items-center">
                    <span className="block md:hidden text-xs font-semibold text-slate-400 mb-1">Drugi tor monitorowania:</span>
                    <div className="flex items-center gap-1.5 md:justify-center w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => handleToggleSecondPath(row.signalName, true)}
                        className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          row.secondPath === true
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : isSecondPathMissing
                            ? 'bg-white border-amber-300 text-slate-600 hover:bg-slate-50'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Tak
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSecondPath(row.signalName, false)}
                        className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          row.secondPath === false
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : isSecondPathMissing
                            ? 'bg-white border-amber-300 text-slate-600 hover:bg-slate-50'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Nie
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!isIsland && (
          <>
            {/* Divider */}
            <div className="my-6 border-t border-slate-100"></div>

            {/* Second transmission path question */}
            <div className="space-y-4 mb-6">
              <p className="block text-sm font-semibold text-slate-700">
                Drugim torem monitorowania oddziału jest: <span className="text-red-500">*</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'linia_telefoniczna', label: 'Linia telefoniczna' },
                  { id: 'epx400', label: 'Nadajnik EPX400' },
                  { id: 'drugi_gsm', label: 'Drugi nadajnik GSM' },
                  { id: 'inne', label: 'inne' }
                ].map((option) => {
                  const isSelected = monitoringData.secondPathType === option.id;
                  const isMissing = validationAttempted && !monitoringData.secondPathType;

                  return (
                    <button
                      key={option.id}
                      id={`btn-monitoring-path-${option.id}`}
                      type="button"
                      onClick={() => handleSecondPathTypeChange(option.id as any)}
                      className={`py-3 px-4 rounded-xl font-semibold border text-sm transition-all text-center ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : isMissing
                          ? 'bg-white border-amber-300 text-slate-600 hover:bg-slate-50'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {monitoringData.secondPathType === 'inne' && (
                <div className="mt-3 animate-fadeIn">
                  <label htmlFor="monitoring-other-text" className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Podaj jaki:
                  </label>
                  <input
                    id="monitoring-other-text"
                    type="text"
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-all font-medium ${
                      validationAttempted && !monitoringData.secondPathOtherText?.trim()
                        ? 'border-amber-300 focus:ring-amber-500/15 focus:border-amber-500'
                        : 'border-slate-200 focus:ring-blue-500/15 focus:border-blue-500'
                    }`}
                    placeholder="Wpisz inny tor monitorowania..."
                    value={monitoringData.secondPathOtherText || ''}
                    onChange={(e) => handleOtherTextChange(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* Divider */}
        <div className="my-6 border-t border-slate-100"></div>

        {/* Transmitter Numbers */}
        <div className="space-y-4">
          <div>
            <label htmlFor="gsm-transmitter" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Numer nadajnika GSM na stacji SMA:
            </label>
            <input
              id="gsm-transmitter"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium text-slate-800 placeholder-slate-400"
              placeholder="np. 00-0-001087127"
              value={monitoringData.gsmTransmitterNumber || ''}
              onChange={(e) => {
                // Keep only numbers (same liczby)
                const numericOnly = e.target.value.replace(/\D/g, '');
                onChange({ ...monitoringData, gsmTransmitterNumber: numericOnly });
              }}
            />
          </div>

          {!isIsland && (
            <div>
              <label htmlFor="second-path-transmitter" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Numer nadajnika 2go toru na stacji SMA:
              </label>
              <input
                id="second-path-transmitter"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium text-slate-800 placeholder-slate-400"
                placeholder="np. 01-0-023037117"
                value={monitoringData.secondPathTransmitterNumber || ''}
                onChange={(e) => {
                  // Keep only numbers (same liczby)
                  const numericOnly = e.target.value.replace(/\D/g, '');
                  onChange({ ...monitoringData, secondPathTransmitterNumber: numericOnly });
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-2">
        <button
          id="btn-prev-step-5"
          type="button"
          onClick={onPrev}
          className="px-5 py-3 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm"
        >
          Cofnij
        </button>
        <button
          id="btn-next-step-5"
          type="button"
          onClick={handleNextClick}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-600/10 text-sm"
        >
          Podsumowanie protokołu
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
