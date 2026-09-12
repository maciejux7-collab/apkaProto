import { CctvData, CctvRow } from '../types';
import { Video, HelpCircle, ArrowLeft, ArrowRight, Server, Plus, Trash2 } from 'lucide-react';

interface CctvSectionProps {
  cctv: CctvData;
  onChange: (data: CctvData) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function CctvSection({ cctv, onChange, onNext, onPrev }: CctvSectionProps) {
  const handleRowChange = (index: number, field: keyof CctvRow, value: any) => {
    const updatedRows = [...cctv.rows];
    
    if (field === 'analogCount' || field === 'digitalCount') {
      const numVal = parseInt(value, 10);
      updatedRows[index] = {
        ...updatedRows[index],
        [field]: value === '' ? '' : (isNaN(numVal) ? '' : numVal)
      };
    } else {
      updatedRows[index] = {
        ...updatedRows[index],
        [field]: value
      };
    }

    onChange({
      ...cctv,
      rows: updatedRows
    });
  };

  const addCctvRow = () => {
    if (cctv.rows.length >= 4) return;
    onChange({
      ...cctv,
      rows: [
        ...cctv.rows,
        { model: '', serialNumber: '', inventoryNumber: '', analogCount: '', digitalCount: '' }
      ]
    });
  };

  const removeCctvRow = (index: number) => {
    if (cctv.rows.length <= 1) return;
    const updatedRows = cctv.rows.filter((_, idx) => idx !== index);
    onChange({
      ...cctv,
      rows: updatedRows
    });
  };

  const handleInRackChange = (val: boolean) => {
    onChange({
      ...cctv,
      inRack: val
    });
  };

  const handleCommentChange = (val: string) => {
    onChange({
      ...cctv,
      comment: val
    });
  };

  // Validation: at least 1 row, and all rows must have a model selected, serial number, and counts
  const areRowsValid = cctv.rows.length >= 1 && cctv.rows.every(row => {
    const isModelValid = row.model === 'inne' ? (row.customModel && row.customModel.trim() !== '') : !!row.model;
    const areCountsValid = row.analogCount !== '' && row.digitalCount !== '';
    return isModelValid && row.serialNumber.trim() !== '' && areCountsValid;
  });

  const isInRackSelected = cctv.inRack === true || cctv.inRack === false;

  const isCctvValid = areRowsValid && isInRackSelected;

  return (
    <div id="cctv-section" className="space-y-6">
      {/* CCTV recorders card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-600" />
              System CCTV
            </h3>
          </div>
          {cctv.rows.length < 4 && (
            <button
              id="btn-add-cctv-row"
              type="button"
              onClick={addCctvRow}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Dodaj rejestrator
            </button>
          )}
        </div>

        {/* Responsive horizontal scrolling on desktop, stacked card views on mobile */}
        <div className="space-y-6 md:space-y-0 md:border md:border-slate-100 md:rounded-xl md:divide-y md:divide-slate-100">
          {/* Header for desktop table layout */}
          <div className="hidden md:grid md:grid-cols-12 gap-3 bg-slate-50 p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-1 text-center">Lp.</div>
            <div className="col-span-3">Model rejestratora <span className="text-red-500">*</span></div>
            <div className="col-span-3">Numer seryjny <span className="text-red-500">*</span></div>
            <div className="col-span-2">Nr inwentarzowy</div>
            <div className="col-span-1 text-center">Kam. Analog. <span className="text-red-500">*</span></div>
            <div className="col-span-1 text-center">Kam. Cyfr. <span className="text-red-500">*</span></div>
            <div className="col-span-1 text-center">Usuń</div>
          </div>

          {cctv.rows.map((row, index) => (
            <div
              key={index}
              id={`cctv-row-${index}`}
              className="bg-slate-50/50 md:bg-transparent p-4 md:p-3 rounded-xl md:rounded-none border border-slate-100 md:border-none grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
            >
              {/* Row marker */}
              <div className="col-span-1 text-xs font-bold text-slate-400 uppercase md:text-center md:normal-case flex items-center md:justify-center gap-2">
                <span className="md:hidden">REJESTRATOR</span> #{index + 1}
              </div>

              {/* Model Select */}
              <div className="col-span-1 md:col-span-3">
                <label className="block md:hidden text-xs font-semibold text-slate-500 mb-1">Model rejestratora <span className="text-red-500">*</span></label>
                <div className="flex flex-col gap-2">
                  <select
                    id={`cctv-model-${index}`}
                    className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 text-sm ${
                      !row.model 
                        ? 'border-amber-300 focus:ring-amber-500/10 focus:border-amber-500' 
                        : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500'
                    }`}
                    value={row.model}
                    onChange={(e) => handleRowChange(index, 'model', e.target.value)}
                    required
                  >
                    <option value="">Wybierz model...</option>
                    <option value="NUUO">NUUO</option>
                    <option value="TruVision">TruVision</option>
                    <option value="Novus">Novus</option>
                    <option value="inne">inne</option>
                  </select>
                  
                  {row.model === 'inne' && (
                    <input
                      type="text"
                      className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 text-sm ${
                        !row.customModel || row.customModel.trim() === ''
                          ? 'border-amber-300 focus:ring-amber-500/10 focus:border-amber-500'
                          : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500'
                      }`}
                      placeholder="Wpisz model... *"
                      value={row.customModel || ''}
                      onChange={(e) => handleRowChange(index, 'customModel', e.target.value)}
                      required
                    />
                  )}
                </div>
              </div>

              {/* Serial number */}
              <div className="col-span-1 md:col-span-3">
                <label className="block md:hidden text-xs font-semibold text-slate-500 mb-1">Numer seryjny <span className="text-red-500">*</span></label>
                <input
                  id={`cctv-serial-${index}`}
                  type="text"
                  className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 text-sm font-mono text-xs ${
                    !row.serialNumber.trim() 
                      ? 'border-amber-300 focus:ring-amber-500/10 focus:border-amber-500' 
                      : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500'
                  }`}
                  placeholder="S0..."
                  value={row.serialNumber}
                  onChange={(e) => handleRowChange(index, 'serialNumber', e.target.value)}
                  required
                />
              </div>

              {/* Inventory number */}
              <div className="col-span-1 md:col-span-2">
                <label className="block md:hidden text-xs font-semibold text-slate-500 mb-1">Numer inwentarzowy</label>
                <input
                  id={`cctv-inventory-${index}`}
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm"
                  placeholder="np. K/456/2024"
                  value={row.inventoryNumber}
                  onChange={(e) => handleRowChange(index, 'inventoryNumber', e.target.value)}
                />
              </div>

              {/* Analog camera count */}
              <div className="col-span-1 md:col-span-1">
                <label className="block md:hidden text-xs font-semibold text-slate-500 mb-1">Kamery analogowe <span className="text-red-500">*</span></label>
                <input
                  id={`cctv-analog-${index}`}
                  type="number"
                  min="0"
                  className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 text-sm text-center ${
                    row.analogCount === ''
                      ? 'border-amber-300 focus:ring-amber-500/10 focus:border-amber-500'
                      : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500'
                  }`}
                  value={row.analogCount}
                  onChange={(e) => handleRowChange(index, 'analogCount', e.target.value)}
                />
              </div>

              {/* Digital camera count */}
              <div className="col-span-1 md:col-span-1">
                <label className="block md:hidden text-xs font-semibold text-slate-500 mb-1">Kamery cyfrowe (IP) <span className="text-red-500">*</span></label>
                <input
                  id={`cctv-digital-${index}`}
                  type="number"
                  min="0"
                  className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 text-sm text-center ${
                    row.digitalCount === ''
                      ? 'border-amber-300 focus:ring-amber-500/10 focus:border-amber-500'
                      : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500'
                  }`}
                  value={row.digitalCount}
                  onChange={(e) => handleRowChange(index, 'digitalCount', e.target.value)}
                />
              </div>

              {/* Delete action */}
              <div className="col-span-1 md:col-span-1 flex md:justify-center items-center">
                {index > 0 ? (
                  <button
                    id={`btn-remove-cctv-${index}`}
                    type="button"
                    onClick={() => removeCctvRow(index)}
                    className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-1 md:gap-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="md:hidden text-xs font-semibold">Usuń ten rejestrator</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-300 font-medium italic hidden md:block">-</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {!areRowsValid && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-3 mt-4 font-medium flex items-center gap-1.5">
            ⚠️ Każdy dodany rejestrator musi mieć wybrany model, uzupełniony numer seryjny oraz podaną liczbę kamer.
          </p>
        )}

        {/* Rack & comment options inside the same card */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-5">
          <div>
            <span className="block text-sm font-semibold text-slate-700 mb-3">
              Czy rejestrator znajduje się w szafie serwerowej? <span className="text-red-500">*</span>
            </span>
            <div className="flex gap-4">
              <button
                id="btn-rack-yes"
                type="button"
                onClick={() => handleInRackChange(true)}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold border text-sm transition-all ${
                  cctv.inRack === true
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : cctv.inRack === null
                    ? 'bg-white border-amber-300 text-slate-600 hover:bg-slate-50'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                TAK
              </button>
              <button
                id="btn-rack-no"
                type="button"
                onClick={() => handleInRackChange(false)}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold border text-sm transition-all ${
                  cctv.inRack === false
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : cctv.inRack === null
                    ? 'bg-white border-amber-300 text-slate-600 hover:bg-slate-50'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                NIE
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Dodatkowy komentarz / uwagi do CCTV:
            </label>
            <textarea
              id="cctv-comment"
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              placeholder="Wpisz wszelkie uwagi dotyczące stanu technicznego rejestratorów, stopnia zakurzenia, sprawności wentylacji szafy itp..."
              value={cctv.comment}
              onChange={(e) => handleCommentChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-2">
        <button
          id="btn-prev-step-2"
          type="button"
          onClick={onPrev}
          className="px-5 py-3 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm"
        >
          Cofnij
        </button>
        <button
          id="btn-next-step-2"
          type="button"
          onClick={onNext}
          disabled={!isCctvValid}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-600/10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Kolejny krok: SKD
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
