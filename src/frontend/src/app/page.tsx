'use client'

import Dashboard from '@/components/Dashboard';
import Integrations from '@/components/Integrations';
import Knowledge from '@/components/Knowledge';
import Sidebar from '@/components/Sidebar';
import { useState } from 'react';

export interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    deadline: string;
    budget: number;
    category: string;
    tokens_used: number;
}

export type View = 'dashboard' | 'integrations' | 'knowledge';

export default function SPA() {
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    return (
        <div className="w-full h-full flex overflow-hidden" style={{ background: 'var(--bg)' }}>
            <Sidebar
                currentView={currentView}
                setCurrentView={setCurrentView}
                activeTask={activeTask}
                setActiveTask={setActiveTask}
            />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden transition-colors duration-400">
                {currentView === 'dashboard' && <Dashboard activeTask={activeTask} setActiveTask={setActiveTask} />}
                {currentView === 'integrations' && <Integrations />}
                {currentView === 'knowledge' && <Knowledge />}
            </main>
        </div>
    );
}
