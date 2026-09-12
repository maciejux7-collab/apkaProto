          import React, { useState, useEffect } from 'react';
import { Branch } from '../types/cmms';
import { Plus, Pencil, Trash2, Building2, MapPin, Hash, Calendar, Search, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

export const BranchManager: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Branch, 'id'>>({
    branchNumber: '',
    city: '',
    address: '',
    maintenanceIntervalMonths: 6
  });

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches');
      const bData = await response.json();
      if (Array.isArray(bData)) {
        setBranches(bData);
	 
      } else {
        setBranches([]);
      }
    } catch (err) {
      console.error("Error fetching branches:", err);
      setBranches([]);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await fetch(`/api/branches/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch('/api/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ branchNumber: '', city: '', address: '', maintenanceIntervalMonths: 6 });
      fetchBranches();
    } catch (err) {
      console.error("Error saving branch:", err);
    }
  };

  const handleEdit = (branch: Branch) => {
    setFormData({
      branchNumber: branch.branchNumber,
      city: branch.city,
      address: branch.address,
      maintenanceIntervalMonths: branch.maintenanceIntervalMonths || 6
    });
    setEditingId(branch.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Czy na pewno chcesz usunąć ten oddział?")) {
      await fetch(`/api/branches/${id}`, { method: 'DELETE' });
      fetchBranches();
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        let count = 0;
        for (const row of data) {
          const branchNumber = String(row.Numer || row.numer || row.branchNumber || row.Number || '');
          const city = row.Miasto || row.miasto || row.city || '';
          const address = row.Ulica || row.ulica || row.street || row.address || row.Adres || '';
          const interval = parseInt(row.Interwal || row.interwał || row.interval || '6');

          if (branchNumber && city) {
            await fetch('/api/branches', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                branchNumber,
                city,
                address,
                maintenanceIntervalMonths: isNaN(interval) ? 6 : interval
              })
            });
            count++;
          }
        }

        if (count > 0) {
          alert(`Pomyślnie zaimportowano ${count} oddziałów.`);
          fetchBranches();
        } else {
          alert("Nie znaleziono poprawnych danych.");
        }
      } catch (err) {
        console.error("Import error:", err);
        alert("Błąd podczas importu pliku.");
      } finally {
        setImportLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredBranches = branches.filter(b => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (b.branchNumber || '').toLowerCase().includes(searchLower) ||
      (b.city || '').toLowerCase().includes(searchLower) ||
      (b.address || '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Zarządzanie Oddziałami</h2>
          <p className="text-xs text-slate-500">Baza oddziałów podlegających konserwacji.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer text-sm font-bold">
            <Upload className="w-4 h-4" />
            Importuj CSV/XLSX
            <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleImport} disabled={importLoading} />
          </label>
          <button
            onClick={() => { setIsAdding(!isAdding); setEditingId(null); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Dodaj Oddział
          </button>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Szukaj oddziału (numer, miasto)..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Numer Oddziału</label>
              <input
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
                value={formData.branchNumber}
                onChange={e => setFormData({ ...formData, branchNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Miasto</label>
              <input
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Interwał Konserwacji (Miesiące)</label>
              <input
                type="number"
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
                value={formData.maintenanceIntervalMonths}
                onChange={e => setFormData({ ...formData, maintenanceIntervalMonths: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Adres</label>
              <input
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setIsAdding(false); setEditingId(null); }}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
            >
              {editingId ? 'Zapisz zmiany' : 'Dodaj oddział'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Oddział</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lokalizacja</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Harmonogram</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredBranches.length > 0 ? (
              filteredBranches.map(branch => (
                <tr key={branch.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 truncate">Oddział #{branch.branchNumber}</div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {branch.city}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">{branch.city}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 pl-5 truncate">
                        {branch.address}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-slate-100 text-slate-600 border border-slate-200">
                      <Calendar className="w-3 h-3" />
                      Co {branch.maintenanceIntervalMonths} m-cy
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(branch)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edytuj">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(branch.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Usuń">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                  {searchTerm ? 'Nie znaleziono oddziałów spełniających kryteria.' : 'Brak oddziałów w bazie.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
