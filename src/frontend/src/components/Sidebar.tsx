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

const STATUS_CONFIG: Record<string, { icon: string; color: string; rgb: string; label: string }> = {
    queued:           { icon: 'fa-clock',         color: 'var(--text-muted)',  rgb: '74,94,114',    label: 'Queued' },
    running:          { icon: 'fa-spinner',        color: 'var(--primary)',     rgb: 'var(--primary-rgb)', label: 'Running' },
    waiting_for_user: { icon: 'fa-hand-paper',     color: 'var(--warning)',     rgb: 'var(--warning-rgb)',  label: 'Approval' },
    completed:        { icon: 'fa-check',          color: 'var(--success)',     rgb: 'var(--success-rgb)',  label: 'Complete' },
    approved:         { icon: 'fa-check-double',   color: 'var(--success)',     rgb: 'var(--success-rgb)',  label: 'Approved' },
}

const THEMES = [
    { key: 'dark',   color: '#00e5ff', label: 'Neural Abyss' },
    { key: 'light',  color: '#0284c7', label: 'Clean Slate' },
    { key: 'aurora', color: '#f43f5e', label: 'Rose Nebula' },
] as const

const NAV_ITEMS = [
    { key: 'dashboard',    icon: 'fa-satellite-dish', label: 'Operations' },
    { key: 'integrations', icon: 'fa-server',         label: 'Integrations' },
    { key: 'knowledge',    icon: 'fa-brain',           label: 'Knowledge' },
] as const

export default function Sidebar({ currentView, setCurrentView, activeTask, setActiveTask }: SidebarProps) {
    const [tasks, setTasks]         = useState<Task[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [theme, setTheme]         = useState<'dark' | 'light' | 'aurora'>('dark')
    const [submitting, setSubmitting] = useState(false)
    const [triggering, setTriggering] = useState<number | null>(null)
    const [isCollapsed, setIsCollapsed] = useState(false)

    useEffect(() => {
        const t = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | 'aurora';
        if (t) setTheme(t);
    }, []);

    const handleThemeChange = (t: 'dark' | 'light' | 'aurora') => {
        setTheme(t);
        document.documentElement.setAttribute('data-theme', t);
    };

    const handleTrigger = async (e: React.MouseEvent, taskId: number) => {
        e.stopPropagation()
        setTriggering(taskId)
        try { await fetch(`/api/tasks/${taskId}/trigger`, { method: 'POST' }) }
        finally { setTriggering(null) }
    }

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await fetch('/api/tasks')
                const data = await res.json()
                if (data.tasks) setTasks(data.tasks)
            } catch { /* silent */ }
        }
        fetchTasks()
        const iv = setInterval(fetchTasks, 3000)
        return () => clearInterval(iv)
    }, [])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitting(true)
        const fd = new FormData(e.currentTarget)
        try {
            await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title:       fd.get('title'),
                    description: fd.get('description'),
                    deadline:    fd.get('deadline'),
                    budget:      parseInt(fd.get('budget') as string, 10),
                })
            })
        } finally {
            setSubmitting(false)
            setIsModalOpen(false)
        }
    }

    const activeTasks    = tasks.filter(t => t.status !== 'completed')
    const completedTasks = tasks.filter(t => t.status === 'completed')

    return (
        <>
            {/* ─── SIDEBAR ─────────────────────────────────────── */}
            <aside
                className={`${isCollapsed ? 'w-[72px]' : 'w-[268px]'} h-full flex flex-col shrink-0 transition-all duration-300 z-40 relative`}
                style={{ background: 'var(--panel)', borderRight: '1px solid var(--border)' }}
            >
                {/* Collapse toggle */}
                <button
                    onClick={() => setIsCollapsed(v => !v)}
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                    className="absolute -right-3 top-[52px] w-6 h-6 flex items-center justify-center z-10 transition-all hover:scale-110"
                    style={{
                        background: 'var(--panel-2)',
                        border: '1px solid var(--border-hover)',
                        color: 'var(--text-muted)',
                    }}
                >
                    <i className={`fa-solid ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-[9px]`}></i>
                </button>

                {/* ── Brand Header ── */}
                <div
                    className={`flex items-center gap-3 shrink-0 transition-all duration-300 ${isCollapsed ? 'px-0 justify-center py-5' : 'px-5 py-5'}`}
                    style={{ borderBottom: '1px solid var(--border)' }}
                >
                    <div className="shrink-0 relative" style={{ color: 'var(--primary)' }}>
                        <Logo size={26} />
                        {/* Live status dot */}
                        <span
                            className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full"
                            style={{
                                background: 'var(--success)',
                                boxShadow: '0 0 6px rgba(var(--success-rgb), 0.8)',
                                animation: 'breathe 2.5s ease-in-out infinite',
                            }}
                        />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col leading-none">
                            <span className="text-[15px] font-black tracking-tight" style={{ color: 'var(--text-main)' }}>OPAS</span>
                            <span className="text-[9px] font-bold uppercase tracking-[0.22em] mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>Neural Agent</span>
                        </div>
                    )}
                </div>

                {/* ── Navigation ── */}
                <nav className={`pt-3 pb-2 ${isCollapsed ? 'px-2' : 'px-3'}`}>
                    {NAV_ITEMS.map(item => {
                        const isActive = currentView === item.key
                        return (
                            <button
                                key={item.key}
                                onClick={() => setCurrentView(item.key)}
                                title={isCollapsed ? item.label : ''}
                                className={`w-full flex items-center gap-3 transition-all duration-200 mb-0.5 relative group ${isCollapsed ? 'justify-center py-3.5 px-0' : 'px-4 py-2.5'}`}
                                style={{
                                    background: isActive ? 'var(--accent)' : 'transparent',
                                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                }}
                                onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-main)'; } }}
                                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; } }}
                            >
                                {/* Active indicator bar */}
                                {isActive && (
                                    <span
                                        className="absolute left-0 top-1 bottom-1 w-[3px]"
                                        style={{ background: 'var(--primary)', boxShadow: 'var(--glow-sm)' }}
                                    />
                                )}
                                <i className={`fa-solid ${item.icon} text-[13px] w-4 text-center shrink-0`}></i>
                                {!isCollapsed && (
                                    <span className="text-[11px] font-bold uppercase tracking-[0.12em]">{item.label}</span>
                                )}
                            </button>
                        )
                    })}
                </nav>

                {/* ── Delegate Button ── */}
                <div className={`${isCollapsed ? 'px-2' : 'px-3'} pb-3 pt-1`}>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        title={isCollapsed ? 'Delegate Task' : ''}
                        className="w-full flex items-center justify-center gap-2 py-2.5 font-black uppercase transition-all duration-200 text-[10px] tracking-[0.18em] group"
                        style={{
                            border: '1px solid rgba(var(--primary-rgb), 0.3)',
                            color: 'var(--primary)',
                            background: 'rgba(var(--primary-rgb), 0.04)',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(var(--primary-rgb), 0.1)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(var(--primary-rgb), 0.6)';
                            (e.currentTarget as HTMLElement).style.boxShadow = 'var(--glow-sm)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(var(--primary-rgb), 0.04)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(var(--primary-rgb), 0.3)';
                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                        }}
                    >
                        <i className="fa-solid fa-plus text-[11px]"></i>
                        {!isCollapsed && 'New Mission'}
                    </button>
                </div>

                <div style={{ borderTop: '1px solid var(--border)' }} />

                {/* ── Queue header ── */}
                {!isCollapsed && (
                    <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>Queue</span>
                        {activeTasks.length > 0 && (
                            <span
                                className="text-[9px] font-black tabular-nums px-1.5 py-0.5"
                                style={{
                                    color: 'var(--primary)',
                                    background: 'var(--accent)',
                                    border: '1px solid rgba(var(--primary-rgb), 0.25)',
                                }}
                            >
                                {activeTasks.length}
                            </span>
                        )}
                    </div>
                )}

                {/* ── Task List ── */}
                <div className="flex-grow overflow-y-auto hide-scrollbar flex flex-col gap-0 pb-2">
                    {tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: 'var(--text-muted)' }}>
                            <i className="fa-regular fa-circle-dot text-xl opacity-30"></i>
                            {!isCollapsed && <span className="text-[11px] font-medium">Queue is empty</span>}
                        </div>
                    ) : (
                        <>
                            {/* Active tasks */}
                            <div className={`flex flex-col ${isCollapsed ? 'gap-1 px-1' : 'gap-0.5 px-2'}`}>
                                {activeTasks.map(t => {
                                    const sc = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.queued
                                    const isSelected = activeTask?.id === t.id
                                    const isWaiting = t.status === 'waiting_for_user'
                                    const isRunning = t.status === 'running'

                                    return (
                                        <div
                                            key={t.id}
                                            onClick={() => { setActiveTask(t); setCurrentView('dashboard'); }}
                                            title={isCollapsed ? t.title : ''}
                                            className="cursor-pointer transition-all duration-200 relative"
                                            style={{
                                                background: isSelected ? 'var(--accent-hover)' : isWaiting ? 'rgba(var(--warning-rgb), 0.04)' : 'transparent',
                                                borderLeft: `2px solid ${isSelected ? 'var(--primary)' : isWaiting ? 'var(--warning)' : 'transparent'}`,
                                                padding: isCollapsed ? '10px 0' : '10px 12px 10px 10px',
                                                display: 'flex',
                                                flexDirection: isCollapsed ? 'column' : 'column',
                                                alignItems: isCollapsed ? 'center' : 'flex-start',
                                                gap: isCollapsed ? '0' : '6px',
                                            }}
                                            onMouseEnter={e => {
                                                if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--accent)';
                                            }}
                                            onMouseLeave={e => {
                                                if (!isSelected) (e.currentTarget as HTMLElement).style.background = isWaiting ? 'rgba(var(--warning-rgb), 0.04)' : 'transparent';
                                            }}
                                        >
                                            {/* Status row */}
                                            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between w-full'}`}>
                                                <div className="flex items-center gap-1.5">
                                                    <i
                                                        className={`fa-solid ${sc.icon} text-[10px] ${isRunning ? 'fa-spin' : ''}`}
                                                        style={{ color: sc.color }}
                                                    />
                                                    {!isCollapsed && (
                                                        <span
                                                            className="text-[9px] font-black uppercase tracking-wider"
                                                            style={{ color: sc.color }}
                                                        >
                                                            {sc.label}
                                                        </span>
                                                    )}
                                                </div>
                                                {!isCollapsed && t.status === 'queued' && (
                                                    <button
                                                        onClick={e => handleTrigger(e, t.id)}
                                                        className="text-[9px] font-black px-1.5 py-0.5 flex items-center gap-1 transition-all"
                                                        style={{
                                                            color: 'var(--primary)',
                                                            border: '1px solid rgba(var(--primary-rgb), 0.3)',
                                                        }}
                                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent)'}
                                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                                    >
                                                        {triggering === t.id
                                                            ? <i className="fa-solid fa-spinner fa-spin text-[8px]"></i>
                                                            : <><i className="fa-solid fa-play text-[7px]"></i> Run</>
                                                        }
                                                    </button>
                                                )}
                                            </div>

                                            {/* Task title */}
                                            {!isCollapsed && (
                                                <>
                                                    <div
                                                        className="text-[12px] font-semibold leading-snug overflow-hidden text-ellipsis whitespace-nowrap w-full"
                                                        style={{ color: 'var(--text-main)' }}
                                                    >
                                                        {t.title}
                                                    </div>
                                                    <div className="flex items-center justify-between w-full">
                                                        <span
                                                            className="text-[9px] font-mono tabular-nums flex items-center gap-1"
                                                            style={{ color: 'var(--text-muted)' }}
                                                        >
                                                            <i className="fa-solid fa-microchip text-[7px] opacity-50"></i>
                                                            {t.budget.toLocaleString()}
                                                        </span>
                                                        <span
                                                            className="text-[9px] font-mono tabular-nums flex items-center gap-1"
                                                            style={{ color: 'var(--text-muted)' }}
                                                        >
                                                            <i className="fa-regular fa-calendar text-[7px] opacity-50"></i>
                                                            {t.deadline || '—'}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Completed tasks */}
                            {!isCollapsed && completedTasks.length > 0 && (
                                <div className="mt-4 px-2">
                                    <div className="flex items-center gap-2 px-2 mb-2">
                                        <div className="flex-grow h-px" style={{ background: 'var(--border)' }} />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-subtle)' }}>Done</span>
                                        <div className="flex-grow h-px" style={{ background: 'var(--border)' }} />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        {completedTasks.map(t => (
                                            <div
                                                key={t.id}
                                                onClick={() => { setActiveTask(t); setCurrentView('dashboard'); }}
                                                className="cursor-pointer flex items-center gap-2.5 px-3 py-2 transition-all"
                                                style={{
                                                    opacity: activeTask?.id === t.id ? 1 : 0.55,
                                                    background: activeTask?.id === t.id ? 'var(--accent)' : 'transparent',
                                                    borderLeft: `2px solid ${activeTask?.id === t.id ? 'var(--success)' : 'transparent'}`,
                                                }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = activeTask?.id === t.id ? '1' : '0.55'; (e.currentTarget as HTMLElement).style.background = activeTask?.id === t.id ? 'var(--accent)' : 'transparent'; }}
                                            >
                                                <i className="fa-solid fa-circle-check text-[11px] shrink-0" style={{ color: 'var(--success)' }}></i>
                                                <span className="text-[12px] font-medium overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: 'var(--text-main)' }}>
                                                    {t.title}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── Theme Switcher ── */}
                <div
                    className={`shrink-0 flex items-center gap-0 transition-all ${isCollapsed ? 'flex-col py-4 px-0 justify-center gap-3' : 'px-5 py-4'}`}
                    style={{ borderTop: '1px solid var(--border)' }}
                >
                    {!isCollapsed && (
                        <span className="text-[9px] font-black uppercase tracking-[0.25em] mr-3" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>Theme</span>
                    )}
                    <div className={`flex ${isCollapsed ? 'flex-col gap-2' : 'gap-2'}`}>
                        {THEMES.map(t => (
                            <button
                                key={t.key}
                                onClick={() => handleThemeChange(t.key)}
                                title={t.label}
                                className="transition-all duration-200"
                                style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: '50%',
                                    background: t.color,
                                    border: theme === t.key
                                        ? `2px solid var(--text-main)`
                                        : '2px solid transparent',
                                    boxShadow: theme === t.key
                                        ? `0 0 8px ${t.color}80`
                                        : 'none',
                                    outline: theme === t.key ? `1px solid ${t.color}` : 'none',
                                    outlineOffset: 2,
                                    transform: theme === t.key ? 'scale(1.15)' : 'scale(1)',
                                    opacity: theme === t.key ? 1 : 0.5,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </aside>

            {/* ─── DELEGATE TASK MODAL ─────────────────────────── */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}
                    onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}
                >
                    <div
                        className="w-full max-w-[680px] flex flex-col max-h-[92vh] overflow-y-auto hide-scrollbar"
                        style={{
                            background: 'var(--panel)',
                            border: '1px solid var(--border-hover)',
                            animation: 'popIn 0.2s ease',
                        }}
                    >
                        {/* Modal header */}
                        <div
                            className="px-7 py-5 flex items-start justify-between shrink-0"
                            style={{ borderBottom: '1px solid var(--border)' }}
                        >
                            <div>
                                <h2 className="text-[17px] font-black tracking-tight flex items-center gap-2.5 m-0" style={{ color: 'var(--text-main)' }}>
                                    <span style={{ color: 'var(--primary)' }}><i className="fa-solid fa-bolt text-[14px]"></i></span>
                                    Delegate Mission
                                </h2>
                                <p className="text-[12px] mt-1 m-0" style={{ color: 'var(--text-muted)' }}>
                                    OPAS will queue and execute this autonomously, requesting approval before any high-impact action.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-7 h-7 flex items-center justify-center transition-colors mt-0.5"
                                style={{ color: 'var(--text-muted)' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-main)'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
                            >
                                <i className="fa-solid fa-xmark text-[15px]"></i>
                            </button>
                        </div>

                        {/* Modal form */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-7">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                                    Mission Title <span style={{ color: 'var(--primary)' }}>*</span>
                                </label>
                                <input
                                    name="title"
                                    required
                                    type="text"
                                    placeholder="e.g. Research the top AI coding tools"
                                    className="w-full px-4 py-3 text-[13px] outline-none transition-all font-medium"
                                    style={{
                                        background: 'var(--input-bg)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-main)',
                                    }}
                                    onFocus={e => (e.target as HTMLElement).style.borderColor = 'rgba(var(--primary-rgb), 0.5)'}
                                    onBlur={e => (e.target as HTMLElement).style.borderColor = 'var(--border)'}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                                    Objective & Context <span style={{ color: 'var(--primary)' }}>*</span>
                                </label>
                                <textarea
                                    name="description"
                                    required
                                    rows={5}
                                    placeholder="Provide context, URLs, constraints, and clear success criteria..."
                                    className="w-full px-4 py-3 text-[13px] outline-none transition-all resize-none leading-relaxed"
                                    style={{
                                        background: 'var(--input-bg)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-main)',
                                    }}
                                    onFocus={e => (e.target as HTMLElement).style.borderColor = 'rgba(var(--primary-rgb), 0.5)'}
                                    onBlur={e => (e.target as HTMLElement).style.borderColor = 'var(--border)'}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Deadline</label>
                                    <input
                                        name="deadline"
                                        type="date"
                                        className="w-full px-4 py-3 text-[13px] outline-none transition-all font-mono"
                                        style={{
                                            background: 'var(--input-bg)',
                                            border: '1px solid var(--border)',
                                            color: 'var(--text-main)',
                                        }}
                                        onFocus={e => (e.target as HTMLElement).style.borderColor = 'rgba(var(--primary-rgb), 0.5)'}
                                        onBlur={e => (e.target as HTMLElement).style.borderColor = 'var(--border)'}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                                        Token Budget <span style={{ color: 'var(--primary)' }}>*</span>
                                    </label>
                                    <input
                                        name="budget"
                                        required
                                        type="number"
                                        defaultValue={50000}
                                        className="w-full px-4 py-3 text-[13px] outline-none transition-all font-mono"
                                        style={{
                                            background: 'var(--input-bg)',
                                            border: '1px solid var(--border)',
                                            color: 'var(--text-main)',
                                        }}
                                        onFocus={e => (e.target as HTMLElement).style.borderColor = 'rgba(var(--primary-rgb), 0.5)'}
                                        onBlur={e => (e.target as HTMLElement).style.borderColor = 'var(--border)'}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div
                                className="flex justify-end gap-3 pt-3 mt-1"
                                style={{ borderTop: '1px solid var(--border)' }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all"
                                    style={{
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-muted)',
                                        background: 'transparent',
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-main)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        background: 'var(--primary)',
                                        color: 'var(--bg)',
                                    }}
                                    onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                                >
                                    {submitting
                                        ? <><i className="fa-solid fa-spinner fa-spin text-[10px]"></i> Queuing...</>
                                        : <><i className="fa-solid fa-rocket text-[10px]"></i> Launch</>
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
