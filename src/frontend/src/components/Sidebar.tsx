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

const STATUS_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
    queued: { icon: 'fa-clock', color: 'var(--text-muted)', label: 'Queued' },
    running: { icon: 'fa-spinner', color: 'var(--primary)', label: 'Running' },
    waiting_for_user: { icon: 'fa-hand-paper', color: '#f39c12', label: 'Awaiting Approval' },
    completed: { icon: 'fa-check', color: '#10a37f', label: 'Completed' },
    approved: { icon: 'fa-check-double', color: '#10a37f', label: 'Approved' },
}

export default function Sidebar({ currentView, setCurrentView, activeTask, setActiveTask }: SidebarProps) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [theme, setTheme] = useState<'dark' | 'light' | 'aurora'>('dark')
    const [submitting, setSubmitting] = useState(false)
    const [triggering, setTriggering] = useState<number | null>(null)
    const [isCollapsed, setIsCollapsed] = useState(false)

    useEffect(() => {
        const currentTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | 'aurora';
        if (currentTheme) setTheme(currentTheme);
    }, []);

    const handleThemeChange = (newTheme: 'dark' | 'light' | 'aurora') => {
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const handleTrigger = async (e: React.MouseEvent, taskId: number) => {
        e.stopPropagation()
        setTriggering(taskId)
        try {
            await fetch(`/api/tasks/${taskId}/trigger`, { method: 'POST' })
        } finally {
            setTriggering(null)
        }
    }

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

    const navItems = [
        { key: 'dashboard', icon: 'fa-satellite-dish', label: 'Operations Board' },
        { key: 'integrations', icon: 'fa-server', label: 'API & Integrations' },
        { key: 'knowledge', icon: 'fa-book-open-reader', label: 'Knowledge Base' },
    ] as const

    const themes = [
        { key: 'dark', icon: 'fa-moon', label: 'Dark' },
        { key: 'light', icon: 'fa-sun', label: 'Light' },
        { key: 'aurora', icon: 'fa-wand-magic-sparkles', label: 'Aurora' },
    ] as const

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitting(true)
        const fd = new FormData(e.currentTarget)
        try {
            await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: fd.get('title'),
                    description: fd.get('description'),
                    deadline: fd.get('deadline'),
                    budget: parseInt(fd.get('budget') as string, 10)
                })
            })
        } finally {
            setSubmitting(false)
            setIsModalOpen(false)
        }
    }

    const activeTasks = tasks.filter(t => !['completed'].includes(t.status))
    const completedTasks = tasks.filter(t => t.status === 'completed')

    return (
        <>
            <aside className={`${isCollapsed ? 'w-20' : 'w-72'} h-full bg-[var(--panel)] border-r border-[var(--border)] flex flex-col shrink-0 transition-all duration-300 z-40 relative group/sidebar`}>

                {/* Collapse Toggle Button (Floating) */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-10 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] transition-all z-10"
                >
                    <i className={`fa-solid ${isCollapsed ? 'fa-square-caret-right' : 'fa-square-caret-left'} text-lg`}></i>
                </button>

                {/* Header / Brand */}
                <div className={`p-6 border-b border-[var(--border)] flex flex-col gap-1 transition-all ${isCollapsed ? 'items-center px-0' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center text-[var(--primary)] shrink-0 overflow-hidden">
                            <Logo size={24} />
                        </div>
                        {!isCollapsed && (
                            <h1 className="text-xl font-black tracking-tighter text-[var(--text-main)] transition-all">OPAS</h1>
                        )}
                    </div>
                    {!isCollapsed && (
                        <span className="text-[9px] uppercase font-black tracking-[0.3em] text-[var(--text-muted)] opacity-70">Autonomous Agent</span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="px-3 pt-4 pb-2">
                    {navItems.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => setCurrentView(item.key)}
                            className={`w-full flex items-center ${isCollapsed ? 'justify-center py-4' : 'gap-4 px-6 py-3'} text-[11px] font-bold uppercase tracking-[0.15em] transition-all ${currentView === item.key
                                ? 'bg-[var(--accent)] text-[var(--primary)] border-r-2 border-[var(--primary)]'
                                : 'text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text-main)]'
                                }`}
                            title={isCollapsed ? item.label : ''}
                        >
                            <i className={`fa-solid ${item.icon} w-4 text-center text-sm ${currentView === item.key ? 'text-[var(--primary)]' : ''}`}></i>
                            {!isCollapsed && item.label}
                        </button>
                    ))}
                </nav>

                {/* Delegate Button */}
                <div className={`${isCollapsed ? 'px-2' : 'px-4'} mt-2 mb-4`}>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className={`w-full py-3 border border-[var(--primary)]/30 text-[var(--primary)] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[var(--accent)] hover:border-[var(--primary)] transition-all flex items-center justify-center gap-2`}
                        title={isCollapsed ? "Delegate Task" : ""}
                    >
                        <i className="fa-solid fa-plus text-[10px]"></i> {!isCollapsed && "Delegate Task"}
                    </button>
                </div>

                {/* Task Queue Section Header */}
                {!isCollapsed && (
                    <div className="px-4 mb-2 flex items-center justify-between">
                        <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Active Queue</span>
                        {activeTasks.length > 0 && (
                            <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--accent)] border border-[var(--primary)]/30 px-1.5 py-0.5 tabular-nums">{activeTasks.length}</span>
                        )}
                    </div>
                )}

                {/* Queue Content */}
                <div className="flex-grow overflow-y-auto hide-scrollbar flex flex-col gap-0 mx-3 mb-2">
                    {tasks.length === 0 ? (
                        <div className="text-center py-10 text-[var(--text-muted)] text-xs flex flex-col items-center gap-2">
                            <i className="fa-regular fa-clock text-xl opacity-40"></i>
                            {!isCollapsed && "Queue is empty"}
                        </div>
                    ) : (
                        <>
                            {activeTasks.map(t => {
                                const sc = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.queued
                                const isActive = activeTask?.id === t.id
                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => { setActiveTask(t); setCurrentView('dashboard'); }}
                                        className={`cursor-pointer transition-all border-l-2 ${isCollapsed ? 'p-3 flex justify-center' : 'p-3.5 mb-1'} ${isActive
                                            ? 'bg-[var(--accent)] border-[var(--primary)]'
                                            : t.status === 'waiting_for_user'
                                                ? 'border-[#f39c12] hover:bg-[var(--accent)]'
                                                : 'border-transparent hover:bg-[var(--accent)] hover:border-[var(--border)]'
                                            }`}
                                        title={isCollapsed ? t.title : ''}
                                    >
                                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between mb-1.5'}`}>
                                            <div className="flex items-center gap-1.5">
                                                <i className={`fa-solid ${sc.icon} ${t.status === 'running' ? 'fa-spin' : ''} text-[10px]`} style={{ color: sc.color }}></i>
                                                {!isCollapsed && <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: sc.color }}>{sc.label}</span>}
                                            </div>
                                            {!isCollapsed && t.status === 'queued' && (
                                                <button
                                                    onClick={e => handleTrigger(e, t.id)}
                                                    title="Run immediately"
                                                    className="text-[10px] font-bold px-1.5 py-0.5 border border-[var(--primary)]/40 text-[var(--primary)] hover:bg-[var(--accent)] transition-all flex items-center gap-1"
                                                >
                                                    {triggering === t.id
                                                        ? <i className="fa-solid fa-spinner fa-spin"></i>
                                                        : <><i className="fa-solid fa-play text-[8px]"></i> Run</>}
                                                </button>
                                            )}
                                        </div>
                                        {!isCollapsed && (
                                            <>
                                                <div className="text-[13px] font-bold leading-snug text-[var(--text-main)] mb-2 whitespace-nowrap overflow-hidden text-ellipsis">{t.title}</div>
                                                <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono tracking-tighter">
                                                    <span className="opacity-80"><i className="fa-solid fa-microchip mr-1 text-[8px] opacity-50"></i>{t.budget.toLocaleString()}</span>
                                                    <span className="opacity-80"><i className="fa-regular fa-calendar mr-1 text-[8px] opacity-50"></i>{t.deadline || '—'}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )
                            })}

                            {!isCollapsed && completedTasks.length > 0 && (
                                <>
                                    <div className="px-1 mt-6 mb-2 text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest flex items-center gap-2">
                                        <div className="h-[1px] flex-grow bg-[var(--border)]"></div>
                                        Completed
                                        <div className="h-[1px] flex-grow bg-[var(--border)]"></div>
                                    </div>
                                    {completedTasks.map(t => (
                                        <div
                                            key={t.id}
                                            onClick={() => { setActiveTask(t); setCurrentView('dashboard'); }}
                                            className={`p-3 opacity-60 hover:opacity-100 cursor-pointer transition-all border-l-2 ${activeTask?.id === t.id ? 'bg-[var(--accent)] border-[var(--primary)]' : 'border-transparent hover:border-[var(--border)]'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="shrink-0 flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors">
                                                    <i className={`fa-solid ${t.status === 'completed' ? 'fa-circle-check' : t.status === 'waiting_for_user' ? 'fa-circle-exclamation' : 'fa-circle-dot'} text-lg`}></i>
                                                </div>
                                                <div className="text-sm font-semibold leading-snug text-[var(--text-main)] whitespace-nowrap overflow-hidden text-ellipsis">{t.title}</div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Theme & Footer Area */}
                <div className={`p-6 border-t border-[var(--border)] flex flex-col gap-4 transition-all ${isCollapsed ? 'items-center px-0' : ''}`}>
                    {!isCollapsed && <div className="text-[9px] uppercase font-black tracking-[0.3em] text-[var(--text-muted)] opacity-70 mb-1">Perspective</div>}
                    <div className={`flex ${isCollapsed ? 'flex-col gap-3' : 'justify-between'} items-center`}>
                        {themes.map(t => (
                            <button
                                key={t.key}
                                onClick={() => handleThemeChange(t.key)}
                                className={`w-8 h-8 flex items-center justify-center border transition-all ${theme === t.key
                                    ? 'bg-[var(--primary)] text-black border-[var(--primary)]'
                                    : 'bg-[var(--panel)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--primary)]/50'
                                    }`}
                                title={t.label}
                            >
                                <i className={`fa-solid ${t.icon} text-xs`}></i>
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* DELEGATE TASK MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-[var(--bg)]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
                    <div className="w-full max-w-[800px] bg-[var(--panel)] border border-[var(--border)] flex flex-col animate-[popIn_0.25s_ease] max-h-[90vh] overflow-y-auto hide-scrollbar">

                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-[var(--border)] flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2.5 text-[var(--text-main)] m-0">
                                    <i className="fa-solid fa-bolt text-[var(--primary)] text-base"></i>
                                    Agentic Delegation
                                </h2>
                                <p className="text-sm text-[var(--text-muted)] mt-1.5 m-0">OPAS will queue this task, equip skills, and execute autonomously.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors w-8 h-8 flex items-center justify-center">
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form className="flex flex-col gap-5 p-8" onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Operation Title *</label>
                                <input
                                    name="title"
                                    required
                                    type="text"
                                    className="p-3 bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] transition-colors text-sm"
                                    placeholder="e.g. Research Top AI Tools 2025"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Detailed Objective & Payload *</label>
                                <textarea
                                    name="description"
                                    required
                                    rows={5}
                                    className="p-3 bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] transition-colors resize-none text-sm leading-relaxed"
                                    placeholder="Provide context, URLs, constraints, and clear success criteria..."
                                ></textarea>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Deadline</label>
                                    <input
                                        name="deadline"
                                        type="date"
                                        className="p-3 bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] transition-colors font-mono text-sm"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Token Budget</label>
                                    <input
                                        name="budget"
                                        required
                                        type="number"
                                        defaultValue={50000}
                                        className="p-3 bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] transition-colors font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-1 border-t border-[var(--border)] mt-1">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 bg-transparent border border-[var(--border)] text-[var(--text-muted)] text-sm font-semibold hover:bg-[var(--accent)] hover:text-[var(--text-main)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-[var(--primary)] text-[var(--bg)] text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {submitting ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Queuing...</> : 'Launch Operation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
