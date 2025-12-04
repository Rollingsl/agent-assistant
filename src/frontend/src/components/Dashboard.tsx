'use client'

import Logo from '@/components/Logo'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
    id: number
    task_id: number
    sender: string
    content: string
    is_approval_request: boolean
}

interface Task {
    id: number
    title: string
    status: string
    deadline: string
    budget: number
}

interface DashboardProps {
    activeTask: Task | null
    setActiveTask: (task: Task) => void
}

const STATUS_CONFIG: Record<string, { icon: string; color: string; label: string; bg: string }> = {
    queued:           { icon: 'fa-clock',       color: 'var(--text-muted)', bg: 'var(--border)',            label: 'Queued' },
    running:          { icon: 'fa-spinner',      color: 'var(--primary)',    bg: 'var(--accent)',             label: 'Running' },
    waiting_for_user: { icon: 'fa-hand-paper',   color: 'var(--warning)',    bg: 'rgba(var(--warning-rgb), 0.08)', label: 'Awaiting Approval' },
    completed:        { icon: 'fa-check',        color: 'var(--success)',    bg: 'rgba(var(--success-rgb), 0.08)', label: 'Complete' },
    approved:         { icon: 'fa-check-double', color: 'var(--success)',    bg: 'rgba(var(--success-rgb), 0.08)', label: 'Approved' },
}

// ─────────────────────────────────────────────────────
// LANDING STATE — Command Center Overview
// ─────────────────────────────────────────────────────
function LandingView({ setActiveTask }: { setActiveTask: (t: Task) => void }) {
    const [recentTasks, setRecentTasks] = useState<Task[]>([])
    const [stats, setStats] = useState({ active: 0, completed: 0, waiting: 0 })

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await fetch('/api/tasks')
                const data = await res.json()
                if (data.tasks) {
                    setRecentTasks(data.tasks.slice(0, 6))
                    setStats({
                        active:    data.tasks.filter((t: Task) => !['completed'].includes(t.status) && t.status !== 'waiting_for_user').length,
                        waiting:   data.tasks.filter((t: Task) => t.status === 'waiting_for_user').length,
                        completed: data.tasks.filter((t: Task) => t.status === 'completed').length,
                    })
                }
            } catch { /* silent */ }
        }
        fetchSummary()
        const iv = setInterval(fetchSummary, 5000)
        return () => clearInterval(iv)
    }, [])

    return (
        <div
            className="h-full w-full overflow-y-auto hide-scrollbar relative"
            style={{ animation: 'fadeIn 0.5s ease' }}
        >
            {/* Dot grid texture */}
            <div className="absolute inset-0 dot-grid opacity-[0.4] pointer-events-none" />

            {/* Ambient glow blobs */}
            <div
                className="absolute pointer-events-none"
                style={{
                    top: '-80px', right: '-80px',
                    width: 480, height: 480,
                    background: 'radial-gradient(circle, rgba(var(--primary-rgb),0.06), transparent 70%)',
                }}
            />
            <div
                className="absolute pointer-events-none"
                style={{
                    bottom: '-60px', left: '20%',
                    width: 360, height: 360,
                    background: 'radial-gradient(circle, rgba(var(--primary-rgb),0.03), transparent 70%)',
                }}
            />

            <div className="relative z-10 max-w-5xl mx-auto px-10 py-10 flex flex-col gap-10">

                {/* ── Hero header ── */}
                <div className="flex items-center justify-between gap-6 flex-wrap">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div style={{ color: 'var(--primary)' }}><Logo size={36} /></div>
                            <div
                                className="flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em]"
                                style={{
                                    color: 'var(--success)',
                                    background: 'rgba(var(--success-rgb), 0.08)',
                                    border: '1px solid rgba(var(--success-rgb), 0.2)',
                                }}
                            >
                                <span
                                    className="inline-block w-1.5 h-1.5 rounded-full"
                                    style={{ background: 'var(--success)', animation: 'breathe 2s ease-in-out infinite' }}
                                />
                                Systems Online
                            </div>
                        </div>
                        <h1
                            className="text-4xl font-black tracking-tight leading-none"
                            style={{ color: 'var(--text-main)' }}
                        >
                            Command Center
                        </h1>
                        <p className="text-[15px] mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                            OPAS is standing by. Delegate a mission from the sidebar.
                        </p>
                    </div>

                    {/* Stat cards */}
                    <div className="flex items-stretch gap-3">
                        {[
                            { value: stats.active,    label: 'Active',    color: 'var(--primary)',  rgb: 'var(--primary-rgb)' },
                            { value: stats.waiting,   label: 'Approval',  color: 'var(--warning)',  rgb: 'var(--warning-rgb)' },
                            { value: stats.completed, label: 'Completed', color: 'var(--success)',  rgb: 'var(--success-rgb)' },
                        ].map(s => (
                            <div
                                key={s.label}
                                className="flex flex-col items-center justify-center px-5 py-4 min-w-[72px]"
                                style={{
                                    background: 'var(--panel)',
                                    border: '1px solid var(--border)',
                                }}
                            >
                                <span
                                    className="text-3xl font-black font-mono tabular-nums leading-none"
                                    style={{ color: s.value > 0 ? s.color : 'var(--text-muted)', opacity: s.value > 0 ? 1 : 0.4 }}
                                >
                                    {s.value}
                                </span>
                                <span className="text-[8px] font-black uppercase tracking-[0.25em] mt-1.5" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── System status strip ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { icon: 'fa-microchip',     label: 'Neural Load',  value: 'Dynamic Balanced', ok: true },
                        { icon: 'fa-shield-halved', label: 'Encryption',   value: 'AES-256 Active',   ok: true },
                        { icon: 'fa-server',        label: 'LLM Gateway',  value: 'Operational',      ok: true },
                    ].map(item => (
                        <div
                            key={item.label}
                            className="flex items-center gap-4 px-5 py-4 group transition-all duration-200"
                            style={{
                                background: 'var(--panel)',
                                border: '1px solid var(--border)',
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(var(--primary-rgb), 0.3)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
                        >
                            <div
                                className="w-9 h-9 flex items-center justify-center shrink-0"
                                style={{
                                    background: 'var(--accent)',
                                    color: 'var(--primary)',
                                    border: '1px solid rgba(var(--primary-rgb), 0.15)',
                                }}
                            >
                                <i className={`fa-solid ${item.icon} text-[13px]`}></i>
                            </div>
                            <div>
                                <div className="text-[8px] font-black uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>{item.label}</div>
                                <div className="text-[12px] font-bold font-mono mt-0.5" style={{ color: 'var(--text-main)' }}>{item.value}</div>
                            </div>
                            <div
                                className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                                style={{
                                    background: 'var(--success)',
                                    boxShadow: '0 0 6px rgba(var(--success-rgb), 0.7)',
                                    animation: 'breathe 2.5s ease-in-out infinite',
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* ── Recent Operations ── */}
                <div>
                    <div
                        className="flex items-center justify-between pb-4 mb-5"
                        style={{ borderBottom: '1px solid var(--border)' }}
                    >
                        <h3 className="text-[13px] font-black uppercase tracking-[0.15em] flex items-center gap-2.5" style={{ color: 'var(--text-main)' }}>
                            <i className="fa-solid fa-list-ul text-[11px]" style={{ color: 'var(--primary)' }}></i>
                            Recent Operations
                        </h3>
                        {recentTasks.length > 0 && (
                            <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                                {recentTasks.length} operation{recentTasks.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {recentTasks.length === 0 ? (
                        <div
                            className="flex flex-col items-center justify-center py-20 gap-4"
                            style={{
                                background: 'var(--panel)',
                                border: '1px dashed var(--border)',
                            }}
                        >
                            <div
                                className="w-12 h-12 flex items-center justify-center"
                                style={{ background: 'var(--accent)', border: '1px solid var(--border)', color: 'var(--primary)', opacity: 0.5 }}
                            >
                                <i className="fa-solid fa-inbox text-xl"></i>
                            </div>
                            <div className="text-center">
                                <p className="text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>No operations yet</p>
                                <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                                    Click <strong style={{ color: 'var(--primary)' }}>New Mission</strong> in the sidebar to begin.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {recentTasks.map((t, i) => {
                                const sc = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.queued
                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => setActiveTask(t)}
                                        className="cursor-pointer group flex flex-col gap-3 p-5 transition-all duration-200"
                                        style={{
                                            background: 'var(--panel)',
                                            border: '1px solid var(--border)',
                                            animation: `fadeInUp 0.4s ease ${i * 0.05}s both`,
                                        }}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(var(--primary-rgb), 0.35)';
                                            (e.currentTarget as HTMLElement).style.background = 'var(--panel-2)';
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                                            (e.currentTarget as HTMLElement).style.background = 'var(--panel)';
                                        }}
                                    >
                                        {/* Top row */}
                                        <div className="flex items-center justify-between">
                                            <span
                                                className="text-[9px] font-black font-mono tracking-[0.12em]"
                                                style={{ color: 'var(--text-muted)', opacity: 0.7 }}
                                            >
                                                OP-{String(t.id).padStart(3, '0')}
                                            </span>
                                            <span
                                                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5"
                                                style={{
                                                    color: sc.color,
                                                    background: sc.bg,
                                                    border: `1px solid ${sc.color}30`,
                                                }}
                                            >
                                                <i className={`fa-solid ${sc.icon} text-[8px] ${t.status === 'running' ? 'fa-spin' : ''}`}></i>
                                                {sc.label}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h4
                                            className="text-[13px] font-semibold leading-snug transition-colors"
                                            style={{ color: 'var(--text-main)' }}
                                        >
                                            {t.title}
                                        </h4>

                                        {/* Metadata */}
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-[10px] font-mono tabular-nums flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                                <i className="fa-solid fa-microchip text-[8px] opacity-40"></i>
                                                {t.budget.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-mono flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                                <i className="fa-regular fa-calendar text-[8px] opacity-40"></i>
                                                {t.deadline || '—'}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────
// ACTIVE TASK VIEW — Mission Log
// ─────────────────────────────────────────────────────
function TaskView({ activeTask }: { activeTask: Task }) {
    const [messages, setMessages] = useState<Message[]>([])
    const [isApproving, setIsApproving] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setMessages([])
        const fetchMsgs = async () => {
            try {
                const res = await fetch(`/api/tasks/${activeTask.id}/messages`)
                const data = await res.json()
                setMessages(data.messages || [])
            } catch { /* silent */ }
        }
        fetchMsgs()
        const iv = setInterval(fetchMsgs, 3000)
        return () => clearInterval(iv)
    }, [activeTask.id])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages.length])

    const approveAction = async () => {
        if (isApproving) return
        setIsApproving(true)
        try {
            await fetch(`/api/tasks/${activeTask.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: 'ACTION: APPROVED', is_approval: true }),
            })
            await new Promise(r => setTimeout(r, 500))
        } catch (e) {
            console.error('Approval failed', e)
        } finally {
            setIsApproving(false)
        }
    }

    const sc = STATUS_CONFIG[activeTask.status] ?? STATUS_CONFIG.queued
    const isRunning = activeTask.status === 'running'
    const isWaiting = activeTask.status === 'waiting_for_user'

    return (
        <div
            className="h-full w-full flex flex-col"
            style={{ animation: 'fadeIn 0.4s ease' }}
        >
            {/* ── Task header ── */}
            <div
                className="shrink-0 flex items-center justify-between px-7 py-4 gap-4"
                style={{
                    background: 'var(--panel)',
                    borderBottom: '1px solid var(--border)',
                }}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div style={{ color: 'var(--primary)', opacity: 0.7 }}>
                        <Logo size={18} />
                    </div>
                    <div
                        className="w-px h-5 shrink-0"
                        style={{ background: 'var(--border)' }}
                    />
                    <h2
                        className="text-[14px] font-bold tracking-tight truncate"
                        style={{ color: 'var(--text-main)' }}
                    >
                        {activeTask.title}
                    </h2>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    {/* Status badge */}
                    <span
                        className="flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em]"
                        style={{
                            color: sc.color,
                            background: sc.bg,
                            border: `1px solid ${sc.color}35`,
                        }}
                    >
                        <i className={`fa-solid ${sc.icon} text-[9px] ${isRunning ? 'fa-spin' : ''}`}></i>
                        {sc.label}
                    </span>
                    {/* Op ID */}
                    <span
                        className="text-[9px] font-black font-mono tracking-[0.18em]"
                        style={{ color: 'var(--text-muted)', opacity: 0.6 }}
                    >
                        OP-{String(activeTask.id).padStart(3, '0')}
                    </span>
                    {/* Budget */}
                    <span
                        className="hidden md:flex items-center gap-1 text-[10px] font-mono"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <i className="fa-solid fa-microchip text-[8px] opacity-40"></i>
                        {activeTask.budget.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* ── Message area ── */}
            <div className="flex-grow overflow-y-auto hide-scrollbar relative">
                {/* Dot grid */}
                <div className="absolute inset-0 dot-grid opacity-[0.35] pointer-events-none" />

                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 relative z-10">
                        <div
                            className="w-12 h-12 flex items-center justify-center"
                            style={{
                                color: 'var(--primary)',
                                border: '1px solid rgba(var(--primary-rgb), 0.2)',
                                background: 'var(--accent)',
                            }}
                        >
                            <i className="fa-solid fa-hourglass-half text-xl" style={{ animation: 'breathe 2s ease-in-out infinite' }}></i>
                        </div>
                        <div className="text-center">
                            <p className="text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>Initializing Mission</p>
                            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                                The agent is warming up — logs will appear shortly.
                            </p>
                        </div>
                        {isRunning && (
                            <div className="flex items-center gap-1.5">
                                {[0, 0.2, 0.4].map((d, i) => (
                                    <div
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{
                                            background: 'var(--primary)',
                                            animation: `breathe 1.2s ease-in-out ${d}s infinite`,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="relative z-10 max-w-3xl w-full mx-auto px-8 py-8 flex flex-col gap-6">
                        {messages.map((m, i) => {
                            const isUser = m.sender === 'user'
                            return (
                                <div
                                    key={m.id ?? i}
                                    className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                                    style={{ animation: `fadeInUp 0.3s ease ${Math.min(i * 0.04, 0.3)}s both` }}
                                >
                                    {/* Avatar */}
                                    <div
                                        className="shrink-0 w-7 h-7 flex items-center justify-center text-[10px] mt-0.5"
                                        style={{
                                            background: isUser ? 'var(--primary)' : 'var(--panel-2)',
                                            color: isUser ? 'var(--bg)' : 'var(--primary)',
                                            border: isUser ? 'none' : '1px solid var(--border)',
                                        }}
                                    >
                                        <i className={`fa-solid ${isUser ? 'fa-user' : 'fa-robot'} text-[9px]`}></i>
                                    </div>

                                    {/* Bubble */}
                                    <div
                                        className="flex flex-col gap-2 max-w-[82%]"
                                    >
                                        {/* Sender label */}
                                        <span
                                            className={`text-[9px] font-black uppercase tracking-[0.18em] ${isUser ? 'text-right' : 'text-left'}`}
                                            style={{ color: isUser ? 'var(--primary)' : 'var(--text-muted)', opacity: 0.7 }}
                                        >
                                            {isUser ? 'Commander' : 'OPAS'}
                                        </span>

                                        <div
                                            className="px-5 py-4 leading-relaxed text-[14px]"
                                            style={{
                                                background: isUser
                                                    ? 'linear-gradient(135deg, rgba(var(--primary-rgb),0.1), rgba(var(--primary-rgb),0.06))'
                                                    : 'var(--panel)',
                                                border: `1px solid ${isUser ? 'rgba(var(--primary-rgb),0.25)' : 'var(--border)'}`,
                                                color: 'var(--text-main)',
                                            }}
                                        >
                                            <div className="prose prose-invert max-w-none agent-markdown">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {m.content}
                                                </ReactMarkdown>
                                            </div>

                                            {/* HITL Approval Card */}
                                            {m.is_approval_request && (
                                                <div
                                                    className="mt-5 p-5 flex flex-col gap-4 relative overflow-hidden"
                                                    style={{
                                                        background: 'rgba(var(--warning-rgb), 0.05)',
                                                        border: '1px solid rgba(var(--warning-rgb), 0.4)',
                                                        animation: 'pulseRing 2.5s ease-in-out infinite',
                                                    }}
                                                >
                                                    {/* Decorative fingerprint watermark */}
                                                    <i
                                                        className="fa-solid fa-fingerprint absolute right-4 top-3 text-5xl pointer-events-none"
                                                        style={{ color: 'var(--warning)', opacity: 0.07 }}
                                                    ></i>

                                                    <div className="flex items-center gap-2">
                                                        <i className="fa-solid fa-shield-halved text-[12px]" style={{ color: 'var(--warning)' }}></i>
                                                        <span
                                                            className="text-[9px] font-black uppercase tracking-[0.25em]"
                                                            style={{ color: 'var(--warning)' }}
                                                        >
                                                            Human-in-the-Loop Intercept
                                                        </span>
                                                    </div>

                                                    <p className="text-[13px] leading-relaxed m-0" style={{ color: 'var(--text-muted)' }}>
                                                        The agent has reached a <strong style={{ color: 'var(--text-main)' }}>high-consequence boundary</strong> and requires your explicit authorization before proceeding. Review the context above carefully.
                                                    </p>

                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={approveAction}
                                                            disabled={isApproving}
                                                            className="flex items-center gap-2.5 px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                            style={{
                                                                background: 'var(--warning)',
                                                                color: '#000',
                                                            }}
                                                            onMouseEnter={e => { if (!isApproving) (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                                                        >
                                                            {isApproving
                                                                ? <><i className="fa-solid fa-spinner fa-spin text-[11px]"></i> Verifying...</>
                                                                : <><i className="fa-solid fa-fingerprint text-[11px]"></i> Authorize Action</>
                                                            }
                                                        </button>
                                                        <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                                            This action cannot be undone.
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Typing indicator when running */}
                        {isRunning && messages.length > 0 && (
                            <div className="flex items-start gap-3">
                                <div
                                    className="shrink-0 w-7 h-7 flex items-center justify-center"
                                    style={{
                                        background: 'var(--panel-2)',
                                        color: 'var(--primary)',
                                        border: '1px solid var(--border)',
                                    }}
                                >
                                    <i className="fa-solid fa-robot text-[9px]"></i>
                                </div>
                                <div
                                    className="px-4 py-3 flex items-center gap-1.5"
                                    style={{
                                        background: 'var(--panel)',
                                        border: '1px solid var(--border)',
                                    }}
                                >
                                    {[0, 0.2, 0.4].map((d, i) => (
                                        <div
                                            key={i}
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{
                                                background: 'var(--text-muted)',
                                                animation: `breathe 1.1s ease-in-out ${d}s infinite`,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Approval needed banner */}
                        {isWaiting && (
                            <div
                                className="flex items-center gap-3 px-5 py-3 text-[12px] font-semibold"
                                style={{
                                    background: 'rgba(var(--warning-rgb), 0.06)',
                                    border: '1px solid rgba(var(--warning-rgb), 0.25)',
                                    color: 'var(--warning)',
                                    animation: 'pulseRing 2.5s ease-in-out infinite',
                                }}
                            >
                                <i className="fa-solid fa-triangle-exclamation text-[13px]"></i>
                                Your approval is required to continue this operation.
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>
                )}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────
export default function Dashboard({ activeTask, setActiveTask }: DashboardProps) {
    if (!activeTask) return <LandingView setActiveTask={setActiveTask} />
    return <TaskView activeTask={activeTask} />
}
