import React, { useState, useEffect } from 'react';
import { Technician } from '../types/cmms';
import { UserPlus, Pencil, Trash2, Mail, Phone, UserCheck, UserX, Search, Upload, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export const TechnicianManager: React.FC = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Technician, 'id'>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    active: true
  });

  const fetchTechnicians = async () => {
    try {
      const response = await fetch('/api/technicians');
      const data = await response.json();
       if (Array.isArray(data)) {
        setTechnicians(data);
      } else {
        setTechnicians([]);
      }
    } catch (err) {
      console.error("Error fetching technicians:", err);
      setTechnicians([]);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await fetch(`/api/technicians/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch('/api/technicians', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', active: true });
      fetchTechnicians();
    } catch (err) {
      console.error("Error saving technician:", err);
    }
  };

  const handleEdit = (tech: Technician) => {
    setFormData({
      firstName: tech.firstName,
      lastName: tech.lastName,
      email: tech.email,
      phone: tech.phone,
      active: tech.active
    });
    setEditingId(tech.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Czy na pewno chcesz usunąć tego serwisanta?")) {
      await fetch(`/api/technicians/${id}`, { method: 'DELETE' });
      fetchTechnicians();
    }
  };

  const toggleActive = async (tech: Technician) => {
    await fetch(`/api/technicians/${tech.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !tech.active })
    });
    fetchTechnicians();
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
          const firstName = row.Imie || row.Imię || row.firstName || row.Firstname || '';
          const lastName = row.Nazwisko || row.lastName || row.Lastname || '';
          const email = row.Email || row.email || '';
          const phone = row.Telefon || row.Phone || row.phone || '';

          if (firstName && lastName && email) {
            await fetch('/api/technicians', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                firstName,
                lastName,
                email,
                phone,
                active: true
              })
            });
            count++;
          }
        }

        if (count > 0) {
          alert(`Pomyślnie zaimportowano ${count} serwisantów.`);
          fetchTechnicians();
        } else {
          alert("Nie znaleziono poprawnych danych do importu.");
        }
      } catch (err) {
        console.error("Import error:", err);
        alert("Błąd podczas importu pliku.");
      } finally {
        setImportLoading(false);
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredTechnicians = technicians.filter(tech => {
    const searchLower = searchTerm.toLowerCase();
    return (
      tech.firstName.toLowerCase().includes(searchLower) ||
      tech.lastName.toLowerCase().includes(searchLower) ||
      tech.email.toLowerCase().includes(searchLower) ||
      tech.phone.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Zarządzanie Serwisantami</h2>
          <p className="text-xs text-slate-500">Lista aktywnych i nieaktywnych serwisantów w systemie.</p>
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
            <UserPlus className="w-4 h-4" />
            Dodaj Nowego
          </button>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Szukaj serwisanta (imię, nazwisko, email)..."
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Imię</label>
              <input
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nazwisko</label>
              <input
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
              <input
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
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
              {editingId ? 'Zapisz zmiany' : 'Dodaj serwisanta'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Serwisant</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kontakt</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredTechnicians.length > 0 ? (
              filteredTechnicians.map(tech => (
                <tr key={tech.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                        {tech.firstName[0]}{tech.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 truncate">{tech.firstName} {tech.lastName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {tech.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{tech.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {tech.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(tech)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                        tech.active 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {tech.active ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                      {tech.active ? 'Aktywny' : 'Nieaktywny'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(tech)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edytuj">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(tech.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Usuun">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                  {searchTerm ? 'Nie znaleziono serwisantów spełniających kryteria.' : 'Brak serwisantów w bazie.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
