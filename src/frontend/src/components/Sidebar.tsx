'use client'

import { useEffect, useState } from 'react';
import Logo from './Logo';

interface Task {
    id: number;
    title: string;
    status: string;
    deadline: string;
    budget: number;
}

interface SidebarProps {
    currentView: 'dashboard' | 'integrations' | 'knowledge';
    setCurrentView: (view: 'dashboard' | 'integrations' | 'knowledge') => void;
    activeTask: Task | null;
    setActiveTask: (task: Task) => void;
}

export default function Sidebar({ currentView, setCurrentView, activeTask, setActiveTask }: SidebarProps) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [theme, setTheme] = useState<'dark' | 'light' | 'aurora'>('dark')

    useEffect(() => {
        // Initialize theme from document element
        const currentTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | 'aurora';
        if (currentTheme) setTheme(currentTheme);
    }, []);

    const handleThemeChange = (newTheme: 'dark' | 'light' | 'aurora') => {
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    // Polling for tasks
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await fetch('/api/tasks')
                const data = await res.json()
                if (data.tasks) setTasks(data.tasks)
            } catch (err) {
                console.error("Failed to fetch tasks")
            }
        }
        fetchTasks()
        const interval = setInterval(fetchTasks, 3000)
        return () => clearInterval(interval)
    }, [])

    return (
        <>
            <aside className="w-full md:w-[320px] lg:w-[350px] flex flex-col p-6 animate-[slideInLeft_0.5s_ease] relative bg-[var(--panel)] border-r border-[var(--border)] h-[100dvh] md:h-full shrink-0 transition-colors duration-500 overflow-hidden">
                <div className="flex items-center gap-3 text-2xl font-bold mb-8 tracking-wide text-[var(--text-main)] transition-colors duration-500">
                    <Logo size={40} className="text-[var(--primary)] transition-all duration-500" />
                    OPAS
                </div>

                {/* Navigation Links */}
                <div className="flex flex-col gap-2 mb-8 font-medium">
                    <button onClick={() => setCurrentView('dashboard')} className={`p-3 flex items-center gap-3 transition-all duration-300 w-full text-left ${currentView === 'dashboard' ? 'bg-[var(--accent)] text-[var(--text-main)] border-r-2 border-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent)] border-r-2 border-transparent'}`}>
                        <i className={`fa-solid fa-satellite-dish w-5 text-center ${currentView === 'dashboard' ? 'text-[var(--primary)]' : ''}`}></i> Operations Board
                    </button>
                    <button onClick={() => setCurrentView('integrations')} className={`p-3 flex items-center gap-3 transition-all duration-300 w-full text-left ${currentView === 'integrations' ? 'bg-[var(--accent)] text-[var(--text-main)] border-r-2 border-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent)] border-r-2 border-transparent'}`}>
                        <i className={`fa-solid fa-key w-5 text-center ${currentView === 'integrations' ? 'text-[var(--primary)]' : ''}`}></i> API & Integrations
                    </button>
                    <button onClick={() => setCurrentView('knowledge')} className={`p-3 flex items-center gap-3 transition-all duration-300 w-full text-left ${currentView === 'knowledge' ? 'bg-[var(--accent)] text-[var(--text-main)] border-r-2 border-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent)] border-r-2 border-transparent'}`}>
                        <i className={`fa-solid fa-book-open-reader w-5 text-center ${currentView === 'knowledge' ? 'text-[var(--primary)]' : ''}`}></i> Knowledge Base
                    </button>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full p-4 bg-transparent border border-[var(--border)] text-[var(--primary)] font-semibold hover:bg-[var(--accent)] transition-all mb-6 flex items-center justify-center gap-2"
                >
                    <i className="fa-solid fa-plus"></i> Delegate Task
                </button>

                <div className="text-xs text-[var(--text-muted)] mb-3 font-bold uppercase tracking-widest pl-1">Active Queue</div>

                <div className="flex-grow overflow-y-auto hide-scrollbar flex flex-col gap-3 pr-2 mb-4">
                    {tasks.length === 0 ? (
                        <div className="text-center p-8 text-[var(--text-muted)] text-sm">Queue is empty.</div>
                    ) : (
                        tasks.map(t => (
                            <div
                                key={t.id}
                                onClick={() => { setActiveTask(t); setCurrentView('dashboard'); }}
                                className={`p-4 bg-[var(--bg)]/40 border-l-4 cursor-pointer hover:bg-[var(--bg)]/60 transition-all
                  ${activeTask?.id === t.id ? 'border-[var(--primary)] bg-[var(--accent)]' :
                                        t.status === 'queued' ? 'border-[var(--text-muted)]' :
                                            t.status === 'running' ? 'border-[var(--primary)]' :
                                                t.status === 'waiting_for_user' ? 'border-[#f39c12] bg-[#f39c12]/5' :
                                                    'border-[#10a37f] bg-[#10a37f]/5'}`
                                }
                            >
                                <div className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 bg-[var(--panel)] border border-[var(--border)] mb-3 inline-block text-[var(--text-main)]">
                                    <i className={`fa-solid mr-1.5 ${t.status === 'running' ? 'fa-spinner fa-spin text-[var(--primary)]' : t.status === 'waiting_for_user' ? 'fa-hand-paper text-[#f39c12]' : t.status === 'completed' ? 'fa-check text-[#10a37f]' : 'fa-clock'}`}></i>
                                    {t.status.replace(/_/g, ' ')}
                                </div>
                                <div className="font-semibold text-[15px] mb-2 leading-snug text-[var(--text-main)]">{t.title}</div>
                                <div className="text-xs text-[var(--text-muted)] flex justify-between font-mono">
                                    <span><i className="fa-solid fa-microchip mr-1 border-b border-[var(--border)] pb-0.5"></i> {t.budget}</span>
                                    <span><i className="fa-regular fa-calendar mr-1 border-b border-[var(--border)] pb-0.5"></i> {t.deadline || '--/--/--'}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Theme Selector */}
                <div className="mt-auto pt-4 border-t border-[var(--border)] flex justify-between items-center gap-2">
                    <button
                        onClick={() => handleThemeChange('dark')}
                        className={`flex-1 p-2 rounded-lg flex flex-col items-center gap-1 text-[10px] uppercase tracking-wider font-bold transition-all ${theme === 'dark' ? 'bg-[var(--accent)] text-[var(--primary)] border border-[var(--primary)]' : 'text-[var(--text-muted)] hover:bg-[var(--accent)] border border-transparent'}`}
                    >
                        <i className="fa-solid fa-moon text-sm"></i> Dark
                    </button>
                    <button
                        onClick={() => handleThemeChange('light')}
                        className={`flex-1 p-2 rounded-lg flex flex-col items-center gap-1 text-[10px] uppercase tracking-wider font-bold transition-all ${theme === 'light' ? 'bg-[var(--accent)] text-[var(--primary)] border border-[var(--primary)]' : 'text-[var(--text-muted)] hover:bg-[var(--accent)] border border-transparent'}`}
                    >
                        <i className="fa-regular fa-sun text-sm"></i> Light
                    </button>
                    <button
                        onClick={() => handleThemeChange('aurora')}
                        className={`flex-1 p-2 rounded-lg flex flex-col items-center gap-1 text-[10px] uppercase tracking-wider font-bold transition-all ${theme === 'aurora' ? 'bg-[var(--accent)] text-[var(--primary)] border border-[var(--primary)]' : 'text-[var(--text-muted)] hover:bg-[var(--accent)] border border-transparent'}`}
                    >
                        <i className="fa-solid fa-wand-magic-sparkles text-sm"></i> Aurora
                    </button>
                </div>
            </aside>

            {/* NEW TASK MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-[var(--bg)]/90 flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-[550px] p-8 flex flex-col gap-6 animate-[popIn_0.3s_ease] border border-[var(--border)] max-h-[90vh] overflow-y-auto hide-scrollbar bg-[var(--panel)]">
                        <div>
                            <h2 className="text-2xl font-bold m-0 flex items-center gap-2 text-[var(--text-main)]"><i className="fa-solid fa-bolt text-[var(--primary)]"></i> Agentic Delegation</h2>
                            <p className="text-sm text-[var(--text-muted)] mt-2">
                                Specify the objectives. OPAS will queue this, equip skills, and execute asynchronously. It will halt when HITL approval is required.
                            </p>
                        </div>

                        <form className="flex flex-col gap-5" onSubmit={async (e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            await fetch('/api/tasks', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    title: fd.get('title'),
                                    description: fd.get('description'),
                                    deadline: fd.get('deadline'),
                                    budget: parseInt(fd.get('budget') as string, 10)
                                })
                            });
                            setIsModalOpen(false);
                        }}>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Operation Title</label>
                                <input name="title" required type="text" className="p-3 bg-black/20 border border-[var(--border)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] transition-colors" placeholder="e.g. University Applications" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Detailed Objective & Payload</label>
                                <textarea name="description" required rows={4} className="p-3 bg-black/20 border border-[var(--border)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] transition-colors resize-none" placeholder="Provide context, URLs, and overall goals..."></textarea>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Deadline</label>
                                    <input name="deadline" type="date" className="p-3 bg-black/20 border border-[var(--border)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] transition-colors font-mono text-sm" />
                                </div>
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Token Budget Limit</label>
                                    <input name="budget" required type="number" defaultValue={50000} className="p-3 bg-black/20 border border-[var(--border)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] transition-colors font-mono text-sm" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-transparent border border-[var(--border)] text-[var(--text-main)] font-semibold hover:bg-[var(--accent)] transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2.5 bg-[var(--primary)] text-[var(--bg)] font-bold hover:opacity-90 transition-opacity">Launch Operation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
