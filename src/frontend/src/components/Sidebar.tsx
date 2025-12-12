'use client'

import { useEffect, useState } from 'react'
import Logo from './Logo'
import type { Task, View } from '@/app/page'

interface SidebarProps {
    currentView: View
    setCurrentView: (view: View) => void
    activeTask: Task | null
    setActiveTask: (task: Task | null) => void
}

const STATUS_CONFIG: Record<string, { icon: string; color: string; label: string; pulse?: boolean }> = {
    queued:           { icon: 'fa-circle-pause',   color: 'var(--text-muted)',  label: 'Queued' },
    running:          { icon: 'fa-circle-play',    color: 'var(--primary)',     label: 'Running',  pulse: true },
    waiting_for_user: { icon: 'fa-shield-halved',  color: 'var(--warning)',     label: 'Approval', pulse: true },
    completed:        { icon: 'fa-circle-check',   color: 'var(--success)',     label: 'Done' },
    approved:         { icon: 'fa-circle-check',   color: 'var(--success)',     label: 'Approved' },
}

const DOMAIN_COLORS: Record<string, string> = {
    chief_of_staff: 'var(--domain-cos)',
    creative_agency: 'var(--domain-creative)',
    sales_intelligence: 'var(--domain-sales)',
    custom: 'var(--domain-custom)',
}

const THEMES = [
    { key: 'dark',   label: 'Obsidian',  color: '#6366f1' },
    { key: 'light',  label: 'Paper',     color: '#4f46e5' },
    { key: 'aurora', label: 'Aurora',    color: '#e879f9' },
] as const

const NAV_ITEMS = [
    { key: 'dashboard',    icon: 'fa-bolt',      label: 'Missions' },
    { key: 'integrations', icon: 'fa-plug',      label: 'Connect' },
    { key: 'knowledge',    icon: 'fa-database',  label: 'Memory' },
    { key: 'preferences',  icon: 'fa-user-gear', label: 'Profile' },
] as const

const MISSION_TYPES = [
    { key: 'chief_of_staff',     label: 'Chief of Staff',  icon: 'fa-user-tie',    desc: 'Research, analysis & strategy' },
    { key: 'creative_agency',    label: 'Creative',        icon: 'fa-pen-nib',     desc: 'Content, copy & campaigns' },
    { key: 'sales_intelligence', label: 'Sales Intel',     icon: 'fa-crosshairs',  desc: 'Leads, outreach & battlecards' },
    { key: 'custom',             label: 'Custom',          icon: 'fa-terminal',    desc: 'Free-form agent task' },
] as const

const TEMPLATES: Record<string, { title: string; description: string }[]> = {
    chief_of_staff: [
        { title: 'Competitor Analysis', description: 'Research top 3 competitors: product launches, pricing, market position. Produce structured report with citations.' },
        { title: 'Market Brief', description: 'Create a market brief: trends, growth projections, emerging players. Cite all sources.' },
        { title: 'Meeting Prep', description: 'Prepare briefing materials: research attendees, companies, recent news, talking points.' },
        { title: 'Strategic Memo', description: 'Draft a strategic memo on a business opportunity: market size, landscape, recommendations.' },
    ],
    creative_agency: [
        { title: 'Blog Post', description: 'Research and write a blog post with data points, quotes, and insights. Output as .md file.' },
        { title: 'Social Campaign', description: 'Design 5-7 social posts with copy, hashtags, and schedule. Generate as file.' },
        { title: 'Email Newsletter', description: 'Write an email newsletter with subject line, sections, and CTA. Ready to send or save.' },
        { title: 'Brand Voice Doc', description: 'Create a brand voice document: attributes, do/don\'t examples, sample copy.' },
    ],
    sales_intelligence: [
        { title: 'Lead Research', description: 'Research target company: funding, tech stack, decision makers, pain points. Compile dossier.' },
        { title: 'Cold Outreach', description: 'Research prospect and draft 3 personalized cold email variants with subject lines and CTAs.' },
        { title: 'Pitch Deck Outline', description: 'Create pitch deck outline for a prospect: problem/solution, advantages, proof points.' },
        { title: 'Competitive Battlecard', description: 'Build battlecard: strengths, weaknesses, objection handling, win themes.' },
    ],
    custom: [],
}

export default function Sidebar({ currentView, setCurrentView, activeTask, setActiveTask }: SidebarProps) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [panelOpen, setPanelOpen] = useState(true)
    const [theme, setTheme] = useState<'dark' | 'light' | 'aurora'>('dark')
    const [submitting, setSubmitting] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>('custom')
    const [formTitle, setFormTitle] = useState('')
    const [formDescription, setFormDescription] = useState('')
    const [executionMode, setExecutionMode] = useState<'agent' | 'pipeline'>('agent')
    const [completedOpen, setCompletedOpen] = useState(false)

    useEffect(() => {
        const t = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | 'aurora'
        if (t) setTheme(t)
    }, [])

    const handleThemeChange = (t: 'dark' | 'light' | 'aurora') => {
        setTheme(t)
        document.documentElement.setAttribute('data-theme', t)
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

    const handleTemplateClick = (tpl: { title: string; description: string }) => {
        setFormTitle(tpl.title)
        setFormDescription(tpl.description)
        setExecutionMode('pipeline') // Auto-select pipeline for templates (zero tokens)
    }

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
                    deadline: fd.get('deadline') || '',
                    budget: parseInt(fd.get('budget') as string, 10) || 50000,
                    category: selectedCategory,
                    execution_mode: executionMode,
                })
            })
        } finally {
            setSubmitting(false)
            setIsModalOpen(false)
            setFormTitle('')
            setFormDescription('')
            setSelectedCategory('custom')
            setExecutionMode('agent')
        }
    }

    const activeTasks = tasks.filter(t => t.status !== 'completed')
    const completedTasks = tasks.filter(t => t.status === 'completed')
    const categoryTemplates = TEMPLATES[selectedCategory] || []
    const domainColor = DOMAIN_COLORS[selectedCategory] || 'var(--primary)'
    const isTemplateSelected = categoryTemplates.some(t => t.title === formTitle)

    return (
        <>
            {/* ═══ Icon Rail ═══ */}
            <div
                className="h-full flex flex-col items-center shrink-0 z-50"
                style={{
                    width: 56,
                    background: 'var(--panel)',
                    borderRight: '1px solid var(--border)',
                }}
            >
                {/* Logo */}
                <div className="py-4 flex items-center justify-center" style={{ color: 'var(--primary)' }}>
                    <Logo size={24} />
                </div>

                <div className="w-6 h-px mb-2" style={{ background: 'var(--border)' }} />

                {/* Nav icons */}
                <nav className="flex flex-col items-center gap-1 px-2">
                    {NAV_ITEMS.map(item => {
                        const isActive = currentView === item.key
                        return (
                            <button
                                key={item.key}
                                onClick={() => { setCurrentView(item.key as View); if (item.key === 'dashboard') setActiveTask(null) }}
                                title={item.label}
                                className="relative w-10 h-10 flex items-center justify-center transition-all duration-200"
                                style={{
                                    borderRadius: 'var(--radius-md)',
                                    background: isActive ? 'var(--accent-strong)' : 'transparent',
                                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                }}
                                onMouseEnter={e => { if (!isActive) { (e.currentTarget).style.background = 'var(--accent)'; (e.currentTarget).style.color = 'var(--text-secondary)' } }}
                                onMouseLeave={e => { if (!isActive) { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.color = 'var(--text-muted)' } }}
                            >
                                <i className={`fa-solid ${item.icon} text-[14px]`}></i>
                                {isActive && (
                                    <span
                                        className="absolute -left-[11px] w-[3px] h-4"
                                        style={{ background: 'var(--primary)', borderRadius: '0 2px 2px 0' }}
                                    />
                                )}
                            </button>
                        )
                    })}
                </nav>

                {/* Panel toggle */}
                <button
                    onClick={() => setPanelOpen(v => !v)}
                    title={panelOpen ? 'Collapse panel' : 'Expand panel'}
                    className="w-10 h-10 flex items-center justify-center mt-2 transition-all duration-200"
                    style={{
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-muted)',
                    }}
                    onMouseEnter={e => { (e.currentTarget).style.background = 'var(--accent)'; (e.currentTarget).style.color = 'var(--text-secondary)' }}
                    onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.color = 'var(--text-muted)' }}
                >
                    <i className={`fa-solid ${panelOpen ? 'fa-sidebar' : 'fa-bars'} text-[13px]`}></i>
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Theme dots */}
                <div className="flex flex-col items-center gap-2 pb-4">
                    {THEMES.map(t => (
                        <button
                            key={t.key}
                            onClick={() => handleThemeChange(t.key)}
                            title={t.label}
                            className="transition-all duration-200"
                            style={{
                                width: theme === t.key ? 10 : 8,
                                height: theme === t.key ? 10 : 8,
                                borderRadius: '50%',
                                background: t.color,
                                opacity: theme === t.key ? 1 : 0.35,
                                boxShadow: theme === t.key ? `0 0 8px ${t.color}60` : 'none',
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* ═══ Mission Panel ═══ */}
            {panelOpen && (
                <div
                    className="h-full flex flex-col shrink-0 overflow-hidden"
                    style={{
                        width: 280,
                        background: 'var(--panel)',
                        borderRight: '1px solid var(--border)',
                        animation: 'slideInRight 0.2s ease',
                    }}
                >
                    {/* Panel header */}
                    <div className="px-5 py-4 flex items-center justify-between shrink-0">
                        <h2 className="text-[13px] font-bold" style={{ color: 'var(--text-main)' }}>
                            Missions
                        </h2>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-7 h-7 flex items-center justify-center transition-all duration-200"
                            style={{
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--primary)',
                                color: '#fff',
                            }}
                            onMouseEnter={e => (e.currentTarget).style.opacity = '0.85'}
                            onMouseLeave={e => (e.currentTarget).style.opacity = '1'}
                            title="New Mission"
                        >
                            <i className="fa-solid fa-plus text-[11px]"></i>
                        </button>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)' }} />

                    {/* Task list */}
                    <div className="flex-1 overflow-y-auto hide-scrollbar px-3 py-3 flex flex-col gap-1.5">
                        {tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <div
                                    className="w-10 h-10 flex items-center justify-center"
                                    style={{ borderRadius: 'var(--radius-lg)', background: 'var(--accent)', color: 'var(--primary)', opacity: 0.5 }}
                                >
                                    <i className="fa-solid fa-inbox text-[16px]"></i>
                                </div>
                                <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>No missions yet</span>
                            </div>
                        ) : (
                            <>
                                {/* Active */}
                                {activeTasks.length > 0 && (
                                    <div className="mb-1">
                                        <div className="px-2 py-1.5 flex items-center justify-between">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Active</span>
                                            <span
                                                className="text-[10px] font-bold px-1.5 py-0.5"
                                                style={{ borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: 'var(--primary)' }}
                                            >
                                                {activeTasks.length}
                                            </span>
                                        </div>
                                        {activeTasks.map(t => {
                                            const sc = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.queued
                                            const isSelected = activeTask?.id === t.id
                                            const dc = DOMAIN_COLORS[t.category] || 'var(--primary)'
                                            const pct = t.budget > 0 ? Math.min(((t.tokens_used || 0) / t.budget) * 100, 100) : 0

                                            return (
                                                <div
                                                    key={t.id}
                                                    onClick={() => { setActiveTask(t); setCurrentView('dashboard') }}
                                                    className="cursor-pointer px-3 py-3 flex flex-col gap-2 transition-all duration-200"
                                                    style={{
                                                        borderRadius: 'var(--radius-md)',
                                                        background: isSelected ? 'var(--accent-hover)' : 'transparent',
                                                        border: isSelected ? '1px solid rgba(var(--primary-rgb), 0.2)' : '1px solid transparent',
                                                    }}
                                                    onMouseEnter={e => { if (!isSelected) (e.currentTarget).style.background = 'var(--accent)' }}
                                                    onMouseLeave={e => { if (!isSelected) (e.currentTarget).style.background = 'transparent' }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="w-2 h-2 rounded-full shrink-0"
                                                            style={{
                                                                background: sc.color,
                                                                boxShadow: sc.pulse ? `0 0 6px ${sc.color}` : 'none',
                                                                animation: sc.pulse ? 'breathe 2s ease-in-out infinite' : 'none',
                                                            }}
                                                        />
                                                        <span className="text-[12px] font-semibold truncate flex-1" style={{ color: 'var(--text-main)' }}>
                                                            {t.title}
                                                        </span>
                                                        {t.execution_mode === 'pipeline' && (
                                                            <span
                                                                className="text-[8px] font-bold px-1 py-0.5 shrink-0"
                                                                style={{ borderRadius: 'var(--radius-sm)', background: 'rgba(var(--success-rgb), 0.12)', color: 'var(--success)' }}
                                                            >
                                                                AUTO
                                                            </span>
                                                        )}
                                                        <span
                                                            className="w-1.5 h-5 rounded-full shrink-0"
                                                            style={{ background: dc, opacity: 0.5 }}
                                                        />
                                                    </div>
                                                    {/* Progress bar */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                                                            <div
                                                                className="h-full rounded-full transition-all duration-500"
                                                                style={{ width: `${pct}%`, background: dc, opacity: 0.7 }}
                                                            />
                                                        </div>
                                                        <span className="text-[9px] font-mono tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                                                            {sc.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Completed — collapsible */}
                                {completedTasks.length > 0 && (
                                    <div className="mt-2">
                                        <button
                                            onClick={() => setCompletedOpen(v => !v)}
                                            className="w-full px-2 py-1.5 flex items-center justify-between cursor-pointer transition-colors duration-150"
                                            style={{ background: 'transparent', border: 'none' }}
                                            onMouseEnter={e => (e.currentTarget).style.background = 'var(--accent)'}
                                            onMouseLeave={e => (e.currentTarget).style.background = 'transparent'}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <i
                                                    className={`fa-solid fa-chevron-right text-[8px] transition-transform duration-200`}
                                                    style={{ color: 'var(--text-subtle)', transform: completedOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                                                ></i>
                                                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Completed</span>
                                            </span>
                                            <span
                                                className="text-[10px] font-bold px-1.5 py-0.5"
                                                style={{ borderRadius: 'var(--radius-sm)', background: 'rgba(var(--success-rgb), 0.08)', color: 'var(--success)' }}
                                            >
                                                {completedTasks.length}
                                            </span>
                                        </button>
                                        {completedOpen && completedTasks.map(t => {
                                            const isSelected = activeTask?.id === t.id
                                            return (
                                                <div
                                                    key={t.id}
                                                    onClick={() => { setActiveTask(t); setCurrentView('dashboard') }}
                                                    className="cursor-pointer px-3 py-2 flex items-center gap-2.5 transition-all duration-200"
                                                    style={{
                                                        borderRadius: 'var(--radius-md)',
                                                        opacity: isSelected ? 1 : 0.5,
                                                        background: isSelected ? 'var(--accent)' : 'transparent',
                                                    }}
                                                    onMouseEnter={e => { (e.currentTarget).style.opacity = '1'; (e.currentTarget).style.background = 'var(--accent)' }}
                                                    onMouseLeave={e => { (e.currentTarget).style.opacity = isSelected ? '1' : '0.5'; (e.currentTarget).style.background = isSelected ? 'var(--accent)' : 'transparent' }}
                                                >
                                                    <i className="fa-solid fa-circle-check text-[10px]" style={{ color: 'var(--success)' }}></i>
                                                    <span className="text-[12px] font-medium truncate" style={{ color: 'var(--text-main)' }}>{t.title}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ New Mission Modal ═══ */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-[100] p-6"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                    onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}
                >
                    <div
                        className="w-full max-w-[640px] flex flex-col max-h-[88vh] overflow-hidden"
                        style={{
                            background: 'var(--panel)',
                            border: '1px solid var(--border-hover)',
                            borderRadius: 'var(--radius-xl)',
                            boxShadow: 'var(--shadow-lg)',
                            animation: 'popIn 0.25s ease',
                        }}
                    >
                        {/* Header */}
                        <div className="px-7 py-5 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <h2 className="text-[16px] font-bold m-0" style={{ color: 'var(--text-main)' }}>New Mission</h2>
                                <p className="text-[12px] mt-0.5 m-0" style={{ color: 'var(--text-muted)' }}>
                                    OPAS will execute using real tools with HITL safety gates.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center transition-all duration-200"
                                style={{ borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}
                                onMouseEnter={e => { (e.currentTarget).style.background = 'var(--accent)'; (e.currentTarget).style.color = 'var(--text-main)' }}
                                onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.color = 'var(--text-muted)' }}
                            >
                                <i className="fa-solid fa-xmark text-[14px]"></i>
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-7 overflow-y-auto hide-scrollbar">

                            {/* Domain selector */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Domain</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {MISSION_TYPES.map(mt => {
                                        const isActive = selectedCategory === mt.key
                                        const dc = DOMAIN_COLORS[mt.key]
                                        return (
                                            <button
                                                key={mt.key}
                                                type="button"
                                                onClick={() => { setSelectedCategory(mt.key); setFormTitle(''); setFormDescription('') }}
                                                className="flex flex-col items-center gap-1.5 py-3 px-2 transition-all duration-200"
                                                style={{
                                                    borderRadius: 'var(--radius-md)',
                                                    background: isActive ? `${dc}18` : 'transparent',
                                                    border: `1px solid ${isActive ? `${dc}40` : 'var(--border)'}`,
                                                    color: isActive ? dc : 'var(--text-muted)',
                                                }}
                                                onMouseEnter={e => { if (!isActive) { (e.currentTarget).style.borderColor = 'var(--border-hover)'; (e.currentTarget).style.background = 'var(--accent)' } }}
                                                onMouseLeave={e => { if (!isActive) { (e.currentTarget).style.borderColor = 'var(--border)'; (e.currentTarget).style.background = 'transparent' } }}
                                            >
                                                <i className={`fa-solid ${mt.icon} text-[15px]`}></i>
                                                <span className="text-[10px] font-semibold">{mt.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Execution Mode Toggle */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Execution Mode</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setExecutionMode('agent')}
                                        className="flex items-center gap-2.5 px-3 py-2.5 transition-all duration-200"
                                        style={{
                                            borderRadius: 'var(--radius-md)',
                                            background: executionMode === 'agent' ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                                            border: `1px solid ${executionMode === 'agent' ? 'rgba(var(--primary-rgb), 0.3)' : 'var(--border)'}`,
                                            color: executionMode === 'agent' ? 'var(--primary)' : 'var(--text-muted)',
                                        }}
                                        onMouseEnter={e => { if (executionMode !== 'agent') { (e.currentTarget).style.borderColor = 'var(--border-hover)'; (e.currentTarget).style.background = 'var(--accent)' } }}
                                        onMouseLeave={e => { if (executionMode !== 'agent') { (e.currentTarget).style.borderColor = 'var(--border)'; (e.currentTarget).style.background = 'transparent' } }}
                                    >
                                        <i className="fa-solid fa-brain text-[13px]"></i>
                                        <div className="text-left">
                                            <div className="text-[11px] font-semibold">Agent</div>
                                            <div className="text-[9px]" style={{ color: 'var(--text-subtle)' }}>LLM-powered reasoning</div>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { if (isTemplateSelected) setExecutionMode('pipeline') }}
                                        disabled={!isTemplateSelected}
                                        className="flex items-center gap-2.5 px-3 py-2.5 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                        style={{
                                            borderRadius: 'var(--radius-md)',
                                            background: executionMode === 'pipeline' ? 'rgba(var(--success-rgb), 0.1)' : 'transparent',
                                            border: `1px solid ${executionMode === 'pipeline' ? 'rgba(var(--success-rgb), 0.3)' : 'var(--border)'}`,
                                            color: executionMode === 'pipeline' ? 'var(--success)' : 'var(--text-muted)',
                                        }}
                                        onMouseEnter={e => { if (isTemplateSelected && executionMode !== 'pipeline') { (e.currentTarget).style.borderColor = 'var(--border-hover)'; (e.currentTarget).style.background = 'var(--accent)' } }}
                                        onMouseLeave={e => { if (executionMode !== 'pipeline') { (e.currentTarget).style.borderColor = 'var(--border)'; (e.currentTarget).style.background = 'transparent' } }}
                                    >
                                        <i className="fa-solid fa-bolt text-[13px]"></i>
                                        <div className="text-left">
                                            <div className="text-[11px] font-semibold">Autopilot</div>
                                            <div className="text-[9px]" style={{ color: 'var(--text-subtle)' }}>{isTemplateSelected ? 'Zero tokens, predefined' : 'Select a template first'}</div>
                                        </div>
                                    </button>
                                </div>
                                {executionMode === 'pipeline' && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 text-[10px]" style={{ color: 'var(--success)' }}>
                                        <i className="fa-solid fa-leaf text-[9px]"></i>
                                        No LLM required. Tools execute directly using template steps.
                                    </div>
                                )}
                            </div>

                            {/* Templates */}
                            {categoryTemplates.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Quick Start</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {categoryTemplates.map((tpl, i) => {
                                            const isActive = formTitle === tpl.title
                                            return (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => handleTemplateClick(tpl)}
                                                    className="text-left px-3 py-2.5 transition-all duration-200"
                                                    style={{
                                                        borderRadius: 'var(--radius-md)',
                                                        background: isActive ? `${domainColor}12` : 'var(--input-bg)',
                                                        border: `1px solid ${isActive ? `${domainColor}35` : 'var(--border)'}`,
                                                    }}
                                                    onMouseEnter={e => { (e.currentTarget).style.borderColor = 'var(--border-hover)' }}
                                                    onMouseLeave={e => { (e.currentTarget).style.borderColor = isActive ? `${domainColor}35` : 'var(--border)' }}
                                                >
                                                    <div className="text-[12px] font-semibold" style={{ color: 'var(--text-main)' }}>{tpl.title}</div>
                                                    <div className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{tpl.description.slice(0, 55)}...</div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Title */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Title</label>
                                <input
                                    name="title"
                                    required
                                    type="text"
                                    value={formTitle}
                                    onChange={e => { setFormTitle(e.target.value); if (executionMode === 'pipeline') setExecutionMode('agent') }}
                                    placeholder="What should OPAS accomplish?"
                                    className="w-full px-4 py-2.5 text-[13px] outline-none transition-all"
                                    style={{
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--input-bg)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-main)',
                                    }}
                                    onFocus={e => { (e.target).style.borderColor = 'rgba(var(--primary-rgb), 0.4)'; (e.target).style.background = 'var(--input-bg-focus)' }}
                                    onBlur={e => { (e.target).style.borderColor = 'var(--border)'; (e.target).style.background = 'var(--input-bg)' }}
                                />
                            </div>

                            {/* Description */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Context & Objectives</label>
                                <textarea
                                    name="description"
                                    required
                                    rows={4}
                                    value={formDescription}
                                    onChange={e => setFormDescription(e.target.value)}
                                    placeholder="Provide details, constraints, URLs, and success criteria..."
                                    className="w-full px-4 py-2.5 text-[13px] outline-none transition-all resize-none leading-relaxed"
                                    style={{
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--input-bg)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-main)',
                                    }}
                                    onFocus={e => { (e.target).style.borderColor = 'rgba(var(--primary-rgb), 0.4)'; (e.target).style.background = 'var(--input-bg-focus)' }}
                                    onBlur={e => { (e.target).style.borderColor = 'var(--border)'; (e.target).style.background = 'var(--input-bg)' }}
                                />
                            </div>

                            {/* Deadline + Budget */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Deadline</label>
                                    <input
                                        name="deadline"
                                        type="date"
                                        className="w-full px-4 py-2.5 text-[13px] outline-none transition-all font-mono"
                                        style={{ borderRadius: 'var(--radius-md)', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                                        onFocus={e => { (e.target).style.borderColor = 'rgba(var(--primary-rgb), 0.4)' }}
                                        onBlur={e => { (e.target).style.borderColor = 'var(--border)' }}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Token Budget</label>
                                    <input
                                        name="budget"
                                        required
                                        type="number"
                                        defaultValue={50000}
                                        className="w-full px-4 py-2.5 text-[13px] outline-none transition-all font-mono"
                                        style={{ borderRadius: 'var(--radius-md)', background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                                        onFocus={e => { (e.target).style.borderColor = 'rgba(var(--primary-rgb), 0.4)' }}
                                        onBlur={e => { (e.target).style.borderColor = 'var(--border)' }}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-[12px] font-medium transition-all"
                                    style={{ borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)' }}
                                    onMouseEnter={e => { (e.currentTarget).style.background = 'var(--accent)'; (e.currentTarget).style.color = 'var(--text-main)' }}
                                    onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.color = 'var(--text-muted)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 text-[12px] font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                                    style={{ borderRadius: 'var(--radius-md)', background: domainColor, color: '#fff', border: 'none' }}
                                    onMouseEnter={e => { if (!submitting) (e.currentTarget).style.opacity = '0.88' }}
                                    onMouseLeave={e => { (e.currentTarget).style.opacity = '1' }}
                                >
                                    {submitting
                                        ? <><i className="fa-solid fa-spinner fa-spin text-[11px]"></i> Launching...</>
                                        : <><i className="fa-solid fa-arrow-right text-[11px]"></i> Launch Mission</>
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
