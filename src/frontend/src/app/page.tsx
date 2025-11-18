'use client'

import Dashboard from '@/components/Dashboard';
import Integrations from '@/components/Integrations';
import Knowledge from '@/components/Knowledge';
import Sidebar from '@/components/Sidebar';
import { useState } from 'react';

interface Task {
    id: number;
    title: string;
    status: string;
    deadline: string;
    budget: number;
}

export default function SPA() {
    const [currentView, setCurrentView] = useState<'dashboard' | 'integrations' | 'knowledge'>('dashboard');
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    return (
        <div className="w-full h-full flex box-border font-sans overflow-hidden">
            <Sidebar
                currentView={currentView}
                setCurrentView={setCurrentView}
                activeTask={activeTask}
                setActiveTask={setActiveTask}
            />

            <main className="flex-grow flex flex-col relative overflow-hidden bg-[var(--bg)] transition-colors duration-500">
                {currentView === 'dashboard' && <Dashboard activeTask={activeTask} setActiveTask={setActiveTask} />}
                {currentView === 'integrations' && <Integrations />}
                {currentView === 'knowledge' && <Knowledge />}
            </main>
        </div>
    );
}
