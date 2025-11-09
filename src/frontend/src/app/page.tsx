'use client'

import Dashboard from '@/components/Dashboard';
import Integrations from '@/components/Integrations';
import Memory from '@/components/Memory';
import Sidebar from '@/components/Sidebar';
import { useState } from 'react';

export default function SPA() {
    const [currentView, setCurrentView] = useState<'dashboard' | 'integrations' | 'memory'>('dashboard');

    return (
        <div className="w-full h-full flex p-6 gap-6 box-border font-sans">
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

            <main className="flex-grow flex flex-col glass overflow-hidden relative shadow-[0_0_50px_rgba(0,242,254,0.03)] border border-white/10 rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl">
                {currentView === 'dashboard' && <Dashboard />}
                {currentView === 'integrations' && <Integrations />}
                {currentView === 'memory' && <Memory />}
            </main>
        </div>
    );
}
