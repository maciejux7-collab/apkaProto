import React from 'react';
import { DoorRow, AuthType, HandleType, LockMethod, AtmVestibule, AtmLockType } from '../types';
import { KeyRound, Plus, Trash2, ArrowLeft, ArrowRight, ShieldCheck, Info } from 'lucide-react';

interface SkdSectionProps {
  doors: DoorRow[];
  onDoorsChange: (doors: DoorRow[]) => void;
  skdComment: string;
  onSkdCommentChange: (val: string) => void;
  atmVestibule: AtmVestibule;
  onAtmVestibuleChange: (data: AtmVestibule) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function SkdSection({
  doors,
  onDoorsChange,
  skdComment,
  onSkdCommentChange,
  atmVestibule,
  onAtmVestibuleChange,
  onNext,
  onPrev
}: SkdSectionProps) {

  // Add a new door row
  const handleAddDoor = () => {
    const newDoor: DoorRow = {
      id: crypto.randomUUID(),
      name: '',
      authType: '',
      handleType: '',
      lockOnArmed: null,
      lockMethod: ''
    };
    onDoorsChange([...doors, newDoor]);
  };

  // Remove a door row
  const handleRemoveDoor = (id: string) => {
    onDoorsChange(doors.filter(d => d.id !== id));
  };

  // Update specific field in door row
  const handleDoorChange = (id: string, field: keyof DoorRow, value: any) => {
    onDoorsChange(
      doors.map(d => {
        if (d.id === id) {
          return { ...d, [field]: value };
        }
        return d;
      })
    );
  };

  // Handle ATM Vestibule toggles
  const handleAtmHasLockChange = (hasLock: boolean | 'no_vestibule' | null) => {
    onAtmVestibuleChange({
      hasLock,
      lockType: ''
    });
  };

  const handleAtmLockTypeChange = (lockType: AtmLockType) => {
    onAtmVestibuleChange({
      ...atmVestibule,
      lockType
    });
  };

  return (
    <div id="skd-section" className="space-y-6">
      {/* Wymogi dotyczące blokowania drzwi przejściowych (SKD) */}
      <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4 sm:p-5">
        <h4 className="text-xs font-bold text-blue-900 flex items-center gap-2 mb-3 uppercase tracking-wider">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          Zasady śluzowania drzwi
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-blue-50 shadow-sm space-y-1">
            <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px]">Drzwi Zaplecze</span>
            <p className="text-slate-600 leading-relaxed">
              Blokują się przy <span className="font-semibold text-blue-600">uzbrojonej sali operacyjnej</span>.
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-blue-50 shadow-sm space-y-1">
            <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px]">Drzwi Skarbca</span>
            <p className="text-slate-600 leading-relaxed">
              Blokują się przy <span className="font-semibold text-blue-600">uzbrojonej strefie skarbiec</span>, przy otwartym sejfie lub otwartych drzwiach na salę op.
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-blue-50 shadow-sm space-y-1">
            <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px]">Drzwi Serwerowni</span>
            <p className="text-slate-600 leading-relaxed">
              Blokują się przy <span className="font-semibold text-blue-600">uzbrojonej strefie serwerownia</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Drzwi SKD Table Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-600" />
            System SKD
          </h3>
          <button
            id="btn-add-door"
            type="button"
            onClick={handleAddDoor}
            className="self-start sm:self-auto px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Dodaj kolejne drzwi
          </button>
        </div>

        {/* Doors list - Cards on mobile, Table on desktop */}
        <div className="space-y-4">
          {doors.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-sm text-slate-500">Brak zdefiniowanych drzwi. Kliknij przycisk powyżej, aby dodać.</p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-0 md:border md:border-slate-100 md:rounded-xl md:divide-y md:divide-slate-100">
              {/* Table header for desktop */}
              <div className="hidden md:grid md:grid-cols-12 gap-3 bg-slate-50 p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="col-span-3">Nazwa drzwi <span className="text-red-500">*</span></div>
                <div className="col-span-2">Wejście za pomocą <span className="text-red-500">*</span></div>
                <div className="col-span-2">Typ okucia <span className="text-red-500">*</span></div>
                <div className="col-span-2">Typ ryglowania <span className="text-red-500">*</span></div>
                <div className="col-span-2 text-center">Śluzowanie działa? <span className="text-red-500">*</span></div>
                <div className="col-span-1 text-center">Usuń</div>
              </div>

              {doors.map((door) => (
                <div
                  key={door.id}
                  id={`door-row-${door.id}`}
                  className="bg-slate-50/50 md:bg-transparent p-4 md:p-3 rounded-xl md:rounded-none border border-slate-100 md:border-none grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                >
                  {/* Name field */}
                  <div className="col-span-1 md:col-span-3">
                    <label className="block md:hidden text-xs font-semibold text-slate-500 mb-1">Nazwa drzwi <span className="text-red-500">*</span></label>
                    <input
                      id={`door-name-${door.id}`}
                      type="text"
                      required
                      className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 text-sm ${
                        !door.name.trim()
                          ? 'border-amber-300 focus:ring-amber-500/10 focus:border-amber-500'
                          : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500'
                      }`}
                      placeholder="np. Drzwi serwerownia"
                      value={door.name}
                      onChange={(e) => handleDoorChange(door.id, 'name', e.target.value)}
                    />
                  </div>

                  {/* Auth Type */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block md:hidden text-xs font-semibold text-slate-500 mb-1">Wejście za pomocą <span className="text-red-500">*</span></label>
                    <select
                      id={`door-authtype-${door.id}`}
                      className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 text-sm ${
                        !door.authType
                          ? 'border-amber-300 focus:ring-amber-500/10 focus:border-amber-500'
                          : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500'
                      }`}
                      value={door.authType}
                      onChange={(e) => handleDoorChange(door.id, 'authType', e.target.value as AuthType)}
                    >
                      <option value="">-- Wybierz --</option>
                      <option value="czytnik">Czytnik</option>
                      <option value="klawiatura">Klawiatura</option>
                    </select>
                  </div>

                  {/* Handle Type */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block md:hidden text-xs font-semibold text-slate-500 mb-1">Okucie drzwiowe <span className="text-red-500">*</span></label>
                    <select
                      id={`door-handletype-${door.id}`}
                      className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 text-sm ${
                        !door.handleType
                          ? 'border-amber-300 focus:ring-amber-500/10 focus:border-amber-500'
                          : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500'
                      }`}
                      value={door.handleType}
                      onChange={(e) => handleDoorChange(door.id, 'handleType', e.target.value as HandleType)}
                    >
                      <option value="">-- Wybierz --</option>
                      <option value="gałka">Gałka</option>
                      <option value="pochwyt">Pochwyt</option>
                      <option value="klamka">Klamka</option>
                    </select>
                  </div>

                  {/* Lock Method */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block md:hidden text-xs font-semibold text-slate-500 mb-1">Typ ryglowania <span className="text-red-500">*</span></label>
                    <select
                      id={`door-lockmethod-${door.id}`}
                      className={`w-full px-3 py-2 bg-white border rounded-xl focus:outline-none focus:ring-2 text-sm ${
                        !door.lockMethod
                          ? 'border-amber-300 focus:ring-amber-500/10 focus:border-amber-500'
                          : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500'
                      }`}
                      value={door.lockMethod}
                      onChange={(e) => handleDoorChange(door.id, 'lockMethod', e.target.value as LockMethod)}
                    >
                      <option value="">-- Wybierz --</option>
                      <option value="elektrozaczep">Elektrozaczep</option>
                      <option value="zwora">Zwora magnetyczna</option>
                      <option value="abloy">Zamek Abloy</option>
                    </select>
                  </div>

                  {/* Lock On Armed */}
                  <div className="col-span-1 md:col-span-2 flex flex-col md:items-center">
                    <label className="block md:hidden text-xs font-semibold text-slate-500 mb-1">Śluzowanie działa? <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-2 md:justify-center">
                      <button
                        id={`door-lockarmed-yes-${door.id}`}
                        type="button"
                        onClick={() => handleDoorChange(door.id, 'lockOnArmed', true)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                          door.lockOnArmed === true
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : door.lockOnArmed === null
                            ? 'bg-white border-amber-300 text-slate-600'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        TAK
                      </button>
                      <button
                        id={`door-lockarmed-no-${door.id}`}
                        type="button"
                        onClick={() => handleDoorChange(door.id, 'lockOnArmed', false)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                          door.lockOnArmed === false
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : door.lockOnArmed === null
                            ? 'bg-white border-amber-300 text-slate-600'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        NIE
                      </button>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-1 md:col-span-1 flex md:justify-center justify-end pt-2 md:pt-0">
                    <button
                      id={`door-remove-${door.id}`}
                      type="button"
                      onClick={() => handleRemoveDoor(door.id)}
                      className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
                      title="Usuń drzwi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Bottom Add Door Button */}
              <div className="p-4 bg-slate-50/50 flex justify-center border-t border-slate-100">
                <button
                  id="btn-add-door-bottom"
                  type="button"
                  onClick={handleAddDoor}
                  className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-blue-100"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj kolejne drzwi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Comment field for SKD doors physical state */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Dodatkowy komentarz / uwagi do SKD:
          </label>
          <textarea
            id="skd-comment"
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
            placeholder="np. czy drzwi prawidłowo się zamykają, nie opadły i nie wymagają regulacji samozamykaczy..."
            value={skdComment}
            onChange={(e) => onSkdCommentChange(e.target.value)}
          />
        </div>
      </div>

      {/* Blokada Przedsionka Bankomatowego Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          Blokada Przedsionka Bankomatowego
        </h3>

        <div className="space-y-4">
          <div>
            <span className="block text-sm font-semibold text-slate-700 mb-3">
              Czy w przedsionku bankomatowym znajduje się blokada wejścia? <span className="text-red-500">*</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                id="btn-atm-yes"
                type="button"
                onClick={() => handleAtmHasLockChange(true)}
                className={`py-3 px-4 rounded-xl font-semibold border text-sm transition-all ${
                  atmVestibule.hasLock === true
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : atmVestibule.hasLock === null
                    ? 'bg-white border-amber-300 text-slate-600 hover:bg-slate-50'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                TAK (Jest blokada)
              </button>
              <button
                id="btn-atm-no"
                type="button"
                onClick={() => handleAtmHasLockChange(false)}
                className={`py-3 px-4 rounded-xl font-semibold border text-sm transition-all ${
                  atmVestibule.hasLock === false
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : atmVestibule.hasLock === null
                    ? 'bg-white border-amber-300 text-slate-600 hover:bg-slate-50'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                NIE (Brak blokady)
              </button>
              <button
                id="btn-atm-none"
                type="button"
                onClick={() => handleAtmHasLockChange('no_vestibule')}
                className={`py-3 px-4 rounded-xl font-semibold border text-sm transition-all ${
                  atmVestibule.hasLock === 'no_vestibule'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : atmVestibule.hasLock === null
                    ? 'bg-white border-amber-300 text-slate-600 hover:bg-slate-50'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                NIE (Nie ma przedsionka)
              </button>
            </div>
          </div>

          {atmVestibule.hasLock === true && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 animate-fadeIn">
              <label className="block text-sm font-semibold text-slate-700">
                Wybierz sposób realizacji blokady: <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  id="btn-atm-type-sterownik-bez-czytnika"
                  type="button"
                  onClick={() => handleAtmLockTypeChange('sterownik_bez_czytnika')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                    atmVestibule.lockType === 'sterownik_bez_czytnika'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                      : !atmVestibule.lockType
                      ? 'bg-white border-amber-300 text-slate-600 hover:bg-slate-50'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  sterownik bez czytnika
                </button>
                <button
                  id="btn-atm-type-sterownik-z-czytnikiem"
                  type="button"
                  onClick={() => handleAtmLockTypeChange('sterownik_z_czytnikiem')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                    atmVestibule.lockType === 'sterownik_z_czytnikiem'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                      : !atmVestibule.lockType
                      ? 'bg-white border-amber-300 text-slate-600 hover:bg-slate-50'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  sterownik z czytnikiem
                </button>
                <button
                  id="btn-atm-type-ca-czytnik"
                  type="button"
                  onClick={() => handleAtmLockTypeChange('ca_czytnik')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                    atmVestibule.lockType === 'ca_czytnik'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                      : !atmVestibule.lockType
                      ? 'bg-white border-amber-300 text-slate-600 hover:bg-slate-50'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  na CA z czytnikiem
                </button>
                <button
                  id="btn-atm-type-ca-czytnik-dahua"
                  type="button"
                  onClick={() => handleAtmLockTypeChange('ca_czytnik_dahua')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                    atmVestibule.lockType === 'ca_czytnik_dahua'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                      : !atmVestibule.lockType
                      ? 'bg-white border-amber-300 text-slate-600 hover:bg-slate-50'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  na CA z czytnikiem i kamerą Dahua
                </button>
                <button
                  id="btn-atm-type-ca-czytnik-dahua-glosnik"
                  type="button"
                  onClick={() => handleAtmLockTypeChange('ca_czytnik_dahua_glosnik')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                    atmVestibule.lockType === 'ca_czytnik_dahua_glosnik'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                      : !atmVestibule.lockType
                      ? 'bg-white border-amber-300 text-slate-600 hover:bg-slate-50'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  na CA z czytnikiem, kamerą Dahua i głośnikiem
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-2">
        <button
          id="btn-prev-step-3"
          type="button"
          onClick={onPrev}
          className="px-5 py-3 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm"
        >
          Cofnij
        </button>
        <button
          id="btn-next-step-3"
          type="button"
          onClick={onNext}
          disabled={
            atmVestibule.hasLock === null ||
            (atmVestibule.hasLock === true && !atmVestibule.lockType) ||
            doors.some(door => !door.authType || !door.handleType || door.lockOnArmed === null || !door.lockMethod)
          }
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-600/10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Kolejny krok: Akumulatory
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
