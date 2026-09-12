import React, { useState } from 'react';
import { TechnicianManager } from './TechnicianManager';
import { BranchManager } from './BranchManager';
import { Scheduler } from './Scheduler';
import AdditionalTasksManager from './AdditionalTasksManager';
import { Users, Building2, CalendarDays, ClipboardList, LayoutDashboard } from 'lucide-react';

export const AdminPanelContainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scheduler' | 'technicians' | 'branches' | 'tasks'>('scheduler');

  const tabs = [
    { id: 'scheduler', label: 'Harmonogram', icon: CalendarDays },
    { id: 'technicians', label: 'Serwisanci', icon: Users },
    { id: 'branches', label: 'Oddziały', icon: Building2 },
    { id: 'tasks', label: 'Zadania Globalne', icon: ClipboardList },
  ];

  return (
    <div className="bg-slate-50 min-h-[600px] rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
      {/* Sidebar / Tabs Navigation */}
      <div className="flex flex-col md:flex-row border-b border-slate-200 bg-white">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-6">
        {activeTab === 'scheduler' && <Scheduler />}
        {activeTab === 'technicians' && <TechnicianManager />}
        {activeTab === 'branches' && <BranchManager />}
        {activeTab === 'tasks' && <AdditionalTasksManager standalone={true} />}
      </div>
    </div>
  );
};
