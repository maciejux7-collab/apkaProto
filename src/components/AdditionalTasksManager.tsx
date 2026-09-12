import React, { useState, useEffect } from 'react';
import { AdditionalTask } from '../types';
import {
  Plus,
  Trash2,
  ListTodo,
  Info,
  Building,
  Calendar,
  Sparkles,
  Search,
  Lock,
  KeyRound
} from 'lucide-react';

interface AdditionalTasksManagerProps {
  onTasksUpdated?: () => void;
  standalone?: boolean;
}

export default function AdditionalTasksManager({ onTasksUpdated, standalone }: AdditionalTasksManagerProps) {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => standalone || sessionStorage.getItem('sswin_tasks_unlocked') === 'true');
  const [passcode, setPasscode] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string>('');

  const [tasks, setTasks] = useState<AdditionalTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('Wszystkie');
  const [specificBranch, setSpecificBranch] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (isUnlocked) {
      fetchTasks();
    }
  }, [isUnlocked]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '12345') {
      setIsUnlocked(true);
      sessionStorage.setItem('sswin_tasks_unlocked', 'true');
      setPasscodeError('');
    } else {
      setPasscodeError('Niepoprawne hasło dostępu!');
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/additional-tasks');
      const fetchedTasks = await response.json();
      setTasks(fetchedTasks);
      localStorage.setItem('sswin_additional_tasks_cache', JSON.stringify(fetchedTasks));
    } catch (err) {
      console.warn('SQL offline or failed, loading from cache', err);
      const cached = localStorage.getItem('sswin_additional_tasks_cache');
      if (cached) {
        try {
          setTasks(JSON.parse(cached));
        } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const filterVal = branchFilter === 'specific' ? specificBranch.trim() : 'Wszystkie';
    if (branchFilter === 'specific' && !filterVal) {
      setAlertMsg({ type: 'error', text: 'Podaj numer oddziału!' });
      return;
    }

    try {
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        branchFilter: filterVal
      };
      await fetch('/api/additional-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      
      setAlertMsg({ type: 'success', text: 'Pomyślnie dodano dodatkowe zadanie!' });
      setTitle('');
      setDescription('');
      setSpecificBranch('');
      setBranchFilter('Wszystkie');
      fetchTasks();
      if (onTasksUpdated) onTasksUpdated();
    } catch (err: any) {
      console.error("Failed to write to SQL:", err);
      setAlertMsg({ type: 'error', text: 'Nie udało się zapisać zadania.' });
    }

    setTimeout(() => setAlertMsg(null), 5000);
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć to zadanie?')) return;

    try {
      await fetch(`/api/additional-tasks/${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => t.id !== id));
      if (onTasksUpdated) onTasksUpdated();
    } catch (err) {
      console.error("Failed to delete from SQL:", err);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const query = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      (task.description || '').toLowerCase().includes(query) ||
      task.branchFilter.toLowerCase().includes(query)
    );
  });

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl p-8 border border-slate-100 shadow-xl space-y-6 text-center animate-in fade-in duration-300">
        <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner relative">
          <Lock className="w-8 h-8" />
          <div className="absolute inset-0 rounded-2xl border border-blue-100 animate-ping opacity-25" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Strefa Chroniona Hasłem</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            Zarządzanie zadaniami dodatkowymi i wytycznymi globalnymi wymaga autoryzacji hasłem administratora.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4 text-xs">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <KeyRound className="w-4 h-4" />
            </span>
            <input
              type="password"
              placeholder="Wpisz hasło autoryzacyjne..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all font-semibold tracking-wider text-center"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              autoFocus
            />
          </div>

          {passcodeError && (
            <p className="text-xs font-bold text-rose-600 animate-bounce">{passcodeError}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Odblokuj panel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intro info card */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-xl shrink-0">
            <Sparkles className="w-6 h-6 text-blue-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight">Kreator Zadań Dodatkowych dla Serwisantów</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tutaj możesz dopisywać zadania, które muszą wykonać serwisanci podczas konserwacji.
              Zadania te zapisują się bezpośrednio na Twoim serwerze (np. na DMZ), co oznacza, że <strong>każdy serwisant połączy się i pobierze je na żywo</strong> automatycznie, bez potrzeby aktualizowania czy instalowania nowej wersji aplikacji!
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Add Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="w-5 h-5 text-blue-600" />
            Dodaj nowe zadanie
          </h3>

          {alertMsg && (
            <div className={`p-3 rounded-xl text-xs font-medium border ${
              alertMsg.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}>
              {alertMsg.text}
            </div>
          )}

          <form onSubmit={handleAddTask} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1 uppercase tracking-wider">Tytuł zadania *</label>
              <input
                type="text"
                required
                placeholder="np. Wymienić uszczelkę w obudowie centrali"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all font-medium"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1 uppercase tracking-wider">Opis / Instrukcje (opcjonalnie)</label>
              <textarea
                rows={3}
                placeholder="np. Sprawdzić stan i dokręcić dławiki kablowe."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all font-medium resize-none"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-2 uppercase tracking-wider">Przypisanie do Oddziału</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setBranchFilter('Wszystkie')}
                  className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                    branchFilter === 'Wszystkie'
                      ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Dla wszystkich
                </button>
                <button
                  type="button"
                  onClick={() => setBranchFilter('specific')}
                  className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                    branchFilter === 'specific'
                      ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Konkretny oddział
                </button>
              </div>

              {branchFilter === 'specific' && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="block font-semibold text-slate-500 mb-1">Numer oddziału</label>
                  <input
                    type="text"
                    required={branchFilter === 'specific'}
                    placeholder="np. 1015 lub 022"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all font-mono font-medium"
                    value={specificBranch}
                    onChange={e => setSpecificBranch(e.target.value)}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Zapisz i opublikuj zadanie
            </button>
          </form>
        </div>

        {/* Right column: Task List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-blue-600" />
              Aktualna lista wytycznych ({filteredTasks.length})
            </h3>

            {/* Search */}
            <div className="relative w-full sm:w-64 text-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Filtruj zadania..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Pobieranie wytycznych z serwera...</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2 border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
              <ListTodo className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">Brak zdefiniowanych zadań dodatkowych</p>
              <p className="text-[10px] text-slate-400 max-w-sm mx-auto">Wypełnij formularz po lewej stronie, aby przypisać wytyczne dla techników.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-4 group hover:shadow-sm hover:bg-slate-50/80 transition-all"
                >
                  <div className="space-y-1.5 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        task.branchFilter === 'Wszystkie'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {task.branchFilter === 'Wszystkie' ? (
                          <span className="flex items-center gap-1"><Building className="w-3 h-3" /> Wszystkie Oddziały</span>
                        ) : (
                          <span className="flex items-center gap-1"><Building className="w-3 h-3" /> Oddział #{task.branchFilter}</span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(task.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 text-sm leading-snug">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-slate-500 leading-relaxed bg-white/70 p-2 rounded-lg border border-slate-100/50 font-medium">{task.description}</p>
                    )}
                  </div>

                  <button
                    id={`btn-delete-task-${task.id}`}
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                    title="Usuń zadanie"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-[10px] text-blue-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong>Jak to działa u technika?</strong> Gdy serwisant otworzy formularz i wpisze numer oddziału, aplikacja automatycznie dopasuje te zadania (globalne oraz dla tego konkretnego numeru) i wyświetli mu je jako checklistę. Technik musi je odznaczyć jako wykonane, a ich status oraz komentarze wejdą w skład generowanego raportu.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
