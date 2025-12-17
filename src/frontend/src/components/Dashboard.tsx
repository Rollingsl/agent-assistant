'use client'

import Logo from '@/components/Logo'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Task } from '@/app/page'

interface Message {
    id: number
    task_id: number
    sender: string
    content: string
    is_approval_request: boolean
    msg_type: string
}

interface OutputFile {
    filename: string
    size: number
    modified: number
}

interface DashboardProps {
    activeTask: Task | null
    setActiveTask: (task: Task | null) => void
}

const STATUS_CONFIG: Record<string, { icon: string; color: string; label: string; bg: string }> = {
    queued:           { icon: 'fa-circle-pause',  color: 'var(--text-muted)', bg: 'var(--panel-2)',                   label: 'Queued' },
    running:          { icon: 'fa-circle-play',   color: 'var(--primary)',    bg: 'var(--accent)',                     label: 'Running' },
    waiting_for_user: { icon: 'fa-shield-halved', color: 'var(--warning)',    bg: 'rgba(var(--warning-rgb), 0.08)',   label: 'Needs Approval' },
    completed:        { icon: 'fa-circle-check',  color: 'var(--success)',    bg: 'rgba(var(--success-rgb), 0.08)',   label: 'Complete' },
    approved:         { icon: 'fa-circle-check',  color: 'var(--success)',    bg: 'rgba(var(--success-rgb), 0.08)',   label: 'Approved' },
}

const DOMAIN_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    chief_of_staff:     { label: 'Chief of Staff',  color: 'var(--domain-cos)',      icon: 'fa-user-tie' },
    creative_agency:    { label: 'Creative',         color: 'var(--domain-creative)', icon: 'fa-pen-nib' },
    sales_intelligence: { label: 'Sales Intel',      color: 'var(--domain-sales)',    icon: 'fa-crosshairs' },
    custom:             { label: 'Custom',           color: 'var(--domain-custom)',   icon: 'fa-terminal' },
}


/* ─────────────────────────────────────────
   Landing View — Home / No task selected
───────────────────────────────────────── */
function LandingView({ setActiveTask }: { setActiveTask: (t: Task) => void }) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [stats, setStats] = useState({ active: 0, completed: 0, waiting: 0 })

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await fetch('/api/tasks')
                const data = await res.json()
                if (data.tasks) {
                    setTasks(data.tasks.slice(0, 8))
                    setStats({
                        active:    data.tasks.filter((t: Task) => !['completed', 'waiting_for_user'].includes(t.status)).length,
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
        <div className="h-full overflow-y-auto hide-scrollbar relative" style={{ animation: 'fadeIn 0.4s ease' }}>
            {/* Gradient mesh background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute"
                    style={{
                        top: '-10%', right: '-5%', width: '50%', height: '50%',
                        background: 'radial-gradient(ellipse, rgba(var(--primary-rgb), 0.06), transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
                <div
                    className="absolute"
                    style={{
                        bottom: '10%', left: '5%', width: '40%', height: '40%',
                        background: 'radial-gradient(ellipse, rgba(var(--primary-rgb), 0.03), transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-10 py-12 flex flex-col gap-10">

                {/* Hero */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div style={{ color: 'var(--primary)' }}><Logo size={32} /></div>
                        <div
                            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold"
                            style={{
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--success)',
                                background: 'rgba(var(--success-rgb), 0.08)',
                                border: '1px solid rgba(var(--success-rgb), 0.15)',
                            }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)', animation: 'breathe 2s infinite' }} />
                            Online
                        </div>
                    </div>
                    <h1 className="text-[32px] font-bold tracking-tight leading-none" style={{ color: 'var(--text-main)' }}>
                        Good to see you.
                    </h1>
                    <p className="text-[15px] mt-2" style={{ color: 'var(--text-secondary)' }}>
                        Select a mission from the sidebar or create a new one to get started.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { val: stats.active,    label: 'Active',   color: 'var(--primary)',  rgb: 'var(--primary-rgb)' },
                        { val: stats.waiting,   label: 'Awaiting',  color: 'var(--warning)',  rgb: 'var(--warning-rgb)' },
                        { val: stats.completed, label: 'Done',      color: 'var(--success)',  rgb: 'var(--success-rgb)' },
                    ].map(s => (
                        <div
                            key={s.label}
                            className="flex items-center gap-4 px-5 py-4 transition-all duration-200"
                            style={{
                                borderRadius: 'var(--radius-lg)',
                                background: 'var(--panel)',
                                border: '1px solid var(--border)',
                            }}
                        >
                            <span
                                className="text-[28px] font-bold font-mono tabular-nums"
                                style={{ color: s.val > 0 ? s.color : 'var(--text-subtle)' }}
                            >
                                {s.val}
                            </span>
                            <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Recent missions */}
                {tasks.length > 0 && (
                    <div>
                        <h3 className="text-[13px] font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                            <i className="fa-solid fa-clock-rotate-left text-[11px]" style={{ color: 'var(--text-muted)' }}></i>
                            Recent Missions
                        </h3>
                        <div className="flex flex-col gap-2">
                            {tasks.map((t, i) => {
                                const sc = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.queued
                                const dc = DOMAIN_CONFIG[t.category] || DOMAIN_CONFIG.custom
                                const pct = t.budget > 0 ? Math.min(((t.tokens_used || 0) / t.budget) * 100, 100) : 0

                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => setActiveTask(t)}
                                        className="cursor-pointer flex items-center gap-4 px-5 py-3.5 group transition-all duration-200"
                                        style={{
                                            borderRadius: 'var(--radius-md)',
                                            background: 'var(--panel)',
                                            border: '1px solid var(--border)',
                                            animation: `fadeInUp 0.3s ease ${i * 0.04}s both`,
                                        }}
                                        onMouseEnter={e => { (e.currentTarget).style.borderColor = 'var(--border-hover)'; (e.currentTarget).style.background = 'var(--panel-2)' }}
                                        onMouseLeave={e => { (e.currentTarget).style.borderColor = 'var(--border)'; (e.currentTarget).style.background = 'var(--panel)' }}
                                    >
                                        {/* Domain dot */}
                                        <div
                                            className="w-8 h-8 flex items-center justify-center shrink-0"
                                            style={{
                                                borderRadius: 'var(--radius-md)',
                                                background: `${dc.color}14`,
                                                color: dc.color,
                                            }}
                                        >
                                            <i className={`fa-solid ${dc.icon} text-[12px]`}></i>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-main)' }}>{t.title}</div>
                                            <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{t.description}</div>
                                        </div>

                                        {/* Progress */}
                                        <div className="flex items-center gap-3 shrink-0">
                                            {t.execution_mode === 'pipeline' ? (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5" style={{ borderRadius: 'var(--radius-sm)', background: 'rgba(var(--success-rgb), 0.1)', color: 'var(--success)' }}>
                                                    <i className="fa-solid fa-bolt text-[8px] mr-0.5"></i> AUTO
                                                </span>
                                            ) : (
                                                <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: sc.color }} />
                                                </div>
                                            )}
                                            <span
                                                className="text-[10px] font-semibold px-2 py-0.5"
                                                style={{ borderRadius: 'var(--radius-sm)', color: sc.color, background: sc.bg }}
                                            >
                                                {sc.label}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}


/* ─────────────────────────────────────────
   Timeline Dot
───────────────────────────────────────── */
function TimelineDot({ type, color }: { type: 'agent' | 'tool_call' | 'tool_result' | 'user' | 'approval'; color?: string }) {
    const icons: Record<string, string> = {
        agent: 'fa-robot',
        tool_call: 'fa-wrench',
        tool_result: 'fa-arrow-down',
        user: 'fa-user',
        approval: 'fa-shield-halved',
    }
    const bg: Record<string, string> = {
        agent: 'var(--panel-2)',
        tool_call: 'rgba(var(--primary-rgb), 0.12)',
        tool_result: 'rgba(var(--success-rgb), 0.12)',
        user: 'var(--primary)',
        approval: 'rgba(var(--warning-rgb), 0.12)',
    }
    const clr: Record<string, string> = {
        agent: 'var(--text-muted)',
        tool_call: 'var(--primary)',
        tool_result: 'var(--success)',
        user: '#fff',
        approval: 'var(--warning)',
    }

    return (
        <div
            className="w-9 h-9 flex items-center justify-center shrink-0 z-10"
            style={{
                borderRadius: 'var(--radius-md)',
                background: bg[type] || 'var(--panel-2)',
                color: color || clr[type] || 'var(--text-muted)',
                border: `1px solid ${type === 'user' ? 'transparent' : 'var(--border)'}`,
            }}
        >
            <i className={`fa-solid ${icons[type] || 'fa-circle'} text-[11px]`}></i>
        </div>
    )
}


/* ─────────────────────────────────────────
   Markdown Preview Sheet
───────────────────────────────────────── */
function MarkdownPreview({ filename, onClose }: { filename: string; onClose: () => void }) {
    const [content, setContent] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        fetch(`/api/outputs/${encodeURIComponent(filename)}/content`)
            .then(r => r.json())
            .then(d => { setContent(d.content || ''); setLoading(false) })
            .catch(() => { setContent('Failed to load file content.'); setLoading(false) })
    }, [filename])

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[90]"
                style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            />
            {/* Sheet */}
            <div
                className="fixed top-0 right-0 bottom-0 z-[100] flex flex-col"
                style={{
                    width: 'min(900px, 90vw)',
                    background: 'var(--bg)',
                    borderLeft: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-lg)',
                    animation: 'slideInFromRight 0.25s ease',
                }}
            >
                {/* Header */}
                <div className="shrink-0 px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', background: 'var(--panel)' }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <i className="fa-solid fa-file-lines text-[13px] shrink-0" style={{ color: 'var(--success)' }}></i>
                        <span className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-main)' }}>{filename}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <a
                            href={`/api/outputs/${encodeURIComponent(filename)}`}
                            download
                            className="w-8 h-8 flex items-center justify-center transition-all duration-200 no-underline"
                            style={{ borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}
                            title="Download"
                            onMouseEnter={e => { (e.currentTarget).style.background = 'var(--accent)'; (e.currentTarget).style.color = 'var(--text-main)' }}
                            onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.color = 'var(--text-muted)' }}
                        >
                            <i className="fa-solid fa-download text-[12px]"></i>
                        </a>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center transition-all duration-200"
                            style={{ borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}
                            onMouseEnter={e => { (e.currentTarget).style.background = 'var(--accent)'; (e.currentTarget).style.color = 'var(--text-main)' }}
                            onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.color = 'var(--text-muted)' }}
                        >
                            <i className="fa-solid fa-xmark text-[14px]"></i>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto hide-scrollbar px-8 py-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 gap-3" style={{ color: 'var(--text-muted)' }}>
                            <i className="fa-solid fa-spinner fa-spin text-lg" style={{ color: 'var(--primary)' }}></i>
                            <span className="text-[13px]">Loading preview...</span>
                        </div>
                    ) : (
                        <div className="max-w-none agent-markdown">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || ''}</ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}


/* ─────────────────────────────────────────
   Generated Files
───────────────────────────────────────── */
function GeneratedFiles({ taskTitle }: { taskTitle: string }) {
    const [files, setFiles] = useState<OutputFile[]>([])
    const [previewFile, setPreviewFile] = useState<string | null>(null)

    // Build a safe-title slug matching the backend's naming convention
    const safeTitle = taskTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)

    useEffect(() => {
        fetch('/api/outputs').then(r => r.json()).then(d => { if (d.files) setFiles(d.files) }).catch(() => {})
    }, [])

    // Only show files whose name contains the task's safe title
    const taskFiles = safeTitle
        ? files.filter(f => f.filename.toLowerCase().includes(safeTitle))
        : files

    if (taskFiles.length === 0) return null

    const isPreviewable = (filename: string) => /\.(md|txt|csv|json|html)$/i.test(filename)

    return (
        <>
            <div className="flex items-start gap-3 relative">
                <TimelineDot type="tool_result" />
                <div className="flex-1 min-w-0 pt-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--success)' }}>
                        <i className="fa-solid fa-folder-open mr-1"></i> Generated Artifacts
                    </div>
                    <div className="flex flex-wrap gap-2 overflow-hidden">
                        {taskFiles.map(f => (
                            <div key={f.filename} className="flex items-center gap-0">
                                <button
                                    onClick={() => isPreviewable(f.filename) ? setPreviewFile(f.filename) : window.open(`/api/outputs/${f.filename}`, '_blank')}
                                    className="flex items-center gap-2 px-3 py-2 transition-all duration-200 cursor-pointer"
                                    style={{
                                        borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
                                        background: 'var(--panel)',
                                        border: '1px solid var(--border)',
                                        borderRight: 'none',
                                        color: 'var(--text-main)',
                                    }}
                                    onMouseEnter={e => { (e.currentTarget).style.borderColor = 'rgba(var(--success-rgb), 0.3)' }}
                                    onMouseLeave={e => { (e.currentTarget).style.borderColor = 'var(--border)' }}
                                >
                                    <i className="fa-solid fa-file-lines text-[11px]" style={{ color: 'var(--success)' }}></i>
                                    <span className="text-[12px] font-medium">{f.filename}</span>
                                    <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>{(f.size / 1024).toFixed(1)}KB</span>
                                </button>
                                <a
                                    href={`/api/outputs/${f.filename}`}
                                    download
                                    className="flex items-center justify-center px-2 py-2 transition-all duration-200 no-underline self-stretch"
                                    style={{
                                        borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                                        background: 'var(--panel)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-muted)',
                                    }}
                                    title="Download"
                                    onMouseEnter={e => { (e.currentTarget).style.color = 'var(--success)'; (e.currentTarget).style.borderColor = 'rgba(var(--success-rgb), 0.3)' }}
                                    onMouseLeave={e => { (e.currentTarget).style.color = 'var(--text-muted)'; (e.currentTarget).style.borderColor = 'var(--border)' }}
                                >
                                    <i className="fa-solid fa-download text-[10px]"></i>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {previewFile && <MarkdownPreview filename={previewFile} onClose={() => setPreviewFile(null)} />}
        </>
    )
}


/* ─────────────────────────────────────────
   Task View — Timeline Message Stream
───────────────────────────────────────── */
function TaskView({ activeTask }: { activeTask: Task }) {
    const [messages, setMessages] = useState<Message[]>([])
    const [isApproving, setIsApproving] = useState(false)
    const [liveTask, setLiveTask] = useState<Task>(activeTask)
    const [followUp, setFollowUp] = useState('')
    const [isSending, setIsSending] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setMessages([])
        setLiveTask(activeTask)
        const fetchData = async () => {
            try {
                const [msgRes, taskRes] = await Promise.all([
                    fetch(`/api/tasks/${activeTask.id}/messages`),
                    fetch('/api/tasks'),
                ])
                const msgData = await msgRes.json()
                setMessages(msgData.messages || [])
                const taskData = await taskRes.json()
                const updated = taskData.tasks?.find((t: Task) => t.id === activeTask.id)
                if (updated) setLiveTask(updated)
            } catch { /* silent */ }
        }
        fetchData()
        const iv = setInterval(fetchData, 3000)
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
        } catch (e) { console.error(e) }
        finally { setIsApproving(false) }
    }

    const sendFollowUp = async () => {
        const text = followUp.trim()
        if (!text || isSending) return
        setIsSending(true)
        try {
            await fetch(`/api/tasks/${activeTask.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: text, is_approval: false }),
            })
            setFollowUp('')
        } catch (e) { console.error(e) }
        finally { setIsSending(false) }
    }

    const sc = STATUS_CONFIG[liveTask.status] ?? STATUS_CONFIG.queued
    const dc = DOMAIN_CONFIG[liveTask.category] || DOMAIN_CONFIG.custom
    const isRunning = liveTask.status === 'running'
    const isWaiting = liveTask.status === 'waiting_for_user'
    const isComplete = liveTask.status === 'completed'
    const isPipeline = liveTask.execution_mode === 'pipeline'
    const tokensUsed = liveTask.tokens_used || 0
    const tokenPct = liveTask.budget > 0 ? Math.min((tokensUsed / liveTask.budget) * 100, 100) : 0

    return (
        <div className="h-full flex flex-col" style={{ animation: 'fadeIn 0.3s ease' }}>

            {/* ── Header ── */}
            <div className="shrink-0" style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between px-8 py-4 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className="w-8 h-8 flex items-center justify-center shrink-0"
                            style={{ borderRadius: 'var(--radius-md)', background: `${dc.color}14`, color: dc.color }}
                        >
                            <i className={`fa-solid ${dc.icon} text-[12px]`}></i>
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-[15px] font-bold truncate" style={{ color: 'var(--text-main)' }}>{liveTask.title}</h2>
                                <span className="text-[9px] font-mono shrink-0" style={{ color: 'var(--text-subtle)' }}>#{liveTask.id}</span>
                            </div>
                            {liveTask.description && (
                                <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{liveTask.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {/* Pipeline badge or Token bar */}
                        {isPipeline ? (
                            <span
                                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold"
                                style={{ borderRadius: 'var(--radius-sm)', color: 'var(--success)', background: 'rgba(var(--success-rgb), 0.08)', border: '1px solid rgba(var(--success-rgb), 0.2)' }}
                            >
                                <i className="fa-solid fa-bolt text-[9px]"></i>
                                Autopilot &middot; 0 tokens
                            </span>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                            width: `${tokenPct}%`,
                                            background: tokenPct > 85 ? 'var(--warning)' : dc.color,
                                        }}
                                    />
                                </div>
                                <span className="text-[10px] font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                    {tokensUsed.toLocaleString()}<span style={{ opacity: 0.4 }}>/{liveTask.budget.toLocaleString()}</span>
                                </span>
                            </div>
                        )}

                        {/* Status badge */}
                        <span
                            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold"
                            style={{ borderRadius: 'var(--radius-sm)', color: sc.color, background: sc.bg, border: `1px solid ${sc.color}25` }}
                        >
                            <i className={`fa-solid ${sc.icon} text-[9px] ${isRunning ? 'fa-spin' : ''}`}></i>
                            {sc.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Message Stream (Timeline) ── */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                        <div
                            className="w-12 h-12 flex items-center justify-center"
                            style={{ borderRadius: 'var(--radius-lg)', background: 'var(--accent)', color: 'var(--primary)' }}
                        >
                            <i className="fa-solid fa-satellite-dish text-[18px]" style={{ animation: 'breathe 2s infinite' }}></i>
                        </div>
                        <div className="text-center">
                            <p className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>Initializing agent...</p>
                            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Logs will appear as the agent works.</p>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto px-8 py-8 flex flex-col gap-5 relative">
                        {/* Timeline connector line */}
                        <div
                            className="absolute left-[54px] top-8 bottom-8 w-px"
                            style={{ background: 'var(--border)' }}
                        />

                        {messages.map((m, i) => {
                            const isUser = m.sender === 'user'
                            const msgType = (m.msg_type || 'agent') as string

                            // ── Tool Call Block ──
                            if (msgType === 'tool_call') {
                                return (
                                    <div key={m.id ?? i} className="flex items-start gap-3 relative" style={{ animation: `fadeInUp 0.25s ease ${Math.min(i * 0.03, 0.2)}s both` }}>
                                        <TimelineDot type="tool_call" />
                                        <div className="flex-1 min-w-0 exec-block mt-0.5">
                                            <div className="exec-block-header">
                                                <i className="fa-solid fa-terminal text-[9px]" style={{ color: 'var(--primary)' }}></i>
                                                <span style={{ color: 'var(--primary)' }}>Tool Call</span>
                                            </div>
                                            <div className="exec-block-body" style={{ color: 'var(--text-secondary)' }}>
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }

                            // ── Tool Result Block ──
                            if (msgType === 'tool_result') {
                                return (
                                    <div key={m.id ?? i} className="flex items-start gap-3 relative" style={{ animation: `fadeInUp 0.25s ease ${Math.min(i * 0.03, 0.2)}s both` }}>
                                        <TimelineDot type="tool_result" />
                                        <div className="flex-1 min-w-0 exec-block mt-0.5">
                                            <div className="exec-block-header">
                                                <i className="fa-solid fa-arrow-down text-[9px]" style={{ color: 'var(--success)' }}></i>
                                                <span style={{ color: 'var(--success)' }}>Result</span>
                                            </div>
                                            <div className="exec-block-body" style={{ color: 'var(--text-secondary)', maxHeight: 150, overflow: 'auto' }}>
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }

                            // ── User message ──
                            if (isUser) {
                                return (
                                    <div key={m.id ?? i} className="flex items-start gap-3 relative" style={{ animation: `fadeInUp 0.25s ease ${Math.min(i * 0.03, 0.2)}s both` }}>
                                        <TimelineDot type="user" />
                                        <div className="flex-1 min-w-0 mt-0.5">
                                            <span className="text-[10px] font-semibold" style={{ color: 'var(--primary)' }}>You</span>
                                            <div
                                                className="mt-1 px-4 py-3 text-[13px] leading-relaxed"
                                                style={{
                                                    borderRadius: 'var(--radius-md)',
                                                    background: 'rgba(var(--primary-rgb), 0.06)',
                                                    border: '1px solid rgba(var(--primary-rgb), 0.15)',
                                                    color: 'var(--text-main)',
                                                }}
                                            >
                                                {m.content}
                                            </div>
                                        </div>
                                    </div>
                                )
                            }

                            // ── Agent message (with optional HITL) ──
                            return (
                                <div key={m.id ?? i} className="flex items-start gap-3 relative" style={{ animation: `fadeInUp 0.25s ease ${Math.min(i * 0.03, 0.2)}s both` }}>
                                    <TimelineDot type={m.is_approval_request ? 'approval' : 'agent'} />
                                    <div className="flex-1 min-w-0 mt-0.5">
                                        <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>OPAS</span>
                                        <div
                                            className="mt-1 px-4 py-3 text-[13px] leading-relaxed"
                                            style={{
                                                borderRadius: 'var(--radius-md)',
                                                background: 'var(--panel)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--text-main)',
                                            }}
                                        >
                                            <div className="prose prose-invert max-w-none agent-markdown overflow-hidden">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                            </div>

                                            {/* HITL Approval Gate */}
                                            {!!m.is_approval_request && (
                                                <div
                                                    className="mt-4 p-4 flex flex-col gap-3 relative overflow-hidden"
                                                    style={{
                                                        borderRadius: 'var(--radius-md)',
                                                        background: 'rgba(var(--warning-rgb), 0.04)',
                                                        border: '1px solid rgba(var(--warning-rgb), 0.25)',
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <i className="fa-solid fa-shield-halved text-[11px]" style={{ color: 'var(--warning)' }}></i>
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--warning)' }}>
                                                            Authorization Required
                                                        </span>
                                                    </div>
                                                    <p className="text-[12px] m-0" style={{ color: 'var(--text-secondary)' }}>
                                                        The agent needs your approval to execute a high-impact action. Review the details above.
                                                    </p>
                                                    <button
                                                        onClick={approveAction}
                                                        disabled={isApproving}
                                                        className="self-start flex items-center gap-2 px-4 py-2 text-[11px] font-semibold transition-all disabled:opacity-50"
                                                        style={{
                                                            borderRadius: 'var(--radius-md)',
                                                            background: 'var(--warning)',
                                                            color: '#000',
                                                            border: 'none',
                                                        }}
                                                        onMouseEnter={e => { if (!isApproving) (e.currentTarget).style.opacity = '0.88' }}
                                                        onMouseLeave={e => { (e.currentTarget).style.opacity = '1' }}
                                                    >
                                                        {isApproving
                                                            ? <><i className="fa-solid fa-spinner fa-spin text-[10px]"></i> Authorizing...</>
                                                            : <><i className="fa-solid fa-fingerprint text-[10px]"></i> Authorize</>
                                                        }
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Thinking indicator */}
                        {isRunning && messages.length > 0 && (
                            <div className="flex items-start gap-3 relative">
                                <TimelineDot type="agent" />
                                <div className="flex-1 min-w-0 mt-0.5">
                                    <div
                                        className="inline-flex items-center gap-1.5 px-4 py-3"
                                        style={{
                                            borderRadius: 'var(--radius-md)',
                                            background: 'var(--panel)',
                                            border: '1px solid var(--border)',
                                        }}
                                    >
                                        {[0, 0.15, 0.3].map((d, i) => (
                                            <div
                                                key={i}
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{
                                                    background: 'var(--text-muted)',
                                                    animation: `dotPulse 1.2s ease-in-out ${d}s infinite`,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Waiting banner */}
                        {isWaiting && (
                            <div
                                className="flex items-center gap-2.5 px-4 py-3 text-[12px] font-medium"
                                style={{
                                    borderRadius: 'var(--radius-md)',
                                    background: 'rgba(var(--warning-rgb), 0.05)',
                                    border: '1px solid rgba(var(--warning-rgb), 0.2)',
                                    color: 'var(--warning)',
                                }}
                            >
                                <i className="fa-solid fa-shield-halved text-[12px]"></i>
                                Waiting for your authorization to continue.
                            </div>
                        )}

                        {/* Files panel */}
                        {isComplete && <GeneratedFiles taskTitle={liveTask.title} />}

                        <div ref={bottomRef} />
                    </div>
                )}
            </div>

            {/* ── Follow-up Input ── */}
            <div
                className="shrink-0 px-8 py-3"
                style={{ borderTop: '1px solid var(--border)', background: 'var(--panel)' }}
            >
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                    <input
                        type="text"
                        value={followUp}
                        onChange={e => setFollowUp(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendFollowUp() } }}
                        placeholder="Ask a follow-up or request changes..."
                        disabled={isSending}
                        className="flex-1 min-w-0 px-4 py-2.5 text-[13px] outline-none transition-all"
                        style={{
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-main)',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(var(--primary-rgb), 0.4)'; e.currentTarget.style.background = 'var(--input-bg-focus)' }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--input-bg)' }}
                    />
                    <button
                        onClick={sendFollowUp}
                        disabled={isSending || !followUp.trim()}
                        className="shrink-0 flex items-center justify-center w-9 h-9 transition-all disabled:opacity-30"
                        style={{
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--primary)',
                            color: '#fff',
                            border: 'none',
                        }}
                        onMouseEnter={e => { if (!isSending && followUp.trim()) (e.currentTarget).style.opacity = '0.85' }}
                        onMouseLeave={e => { (e.currentTarget).style.opacity = '1' }}
                        title="Send (Enter)"
                    >
                        {isSending
                            ? <i className="fa-solid fa-spinner fa-spin text-[12px]"></i>
                            : <i className="fa-solid fa-paper-plane text-[12px]"></i>
                        }
                    </button>
                </div>
            </div>
        </div>
    )
}


/* ─────────────────────────────────────────
   Main Export
───────────────────────────────────────── */
export default function Dashboard({ activeTask, setActiveTask }: DashboardProps) {
    if (!activeTask) return <LandingView setActiveTask={setActiveTask} />
    return <TaskView activeTask={activeTask} />
}
