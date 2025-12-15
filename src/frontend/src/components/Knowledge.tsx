'use client'

import { useEffect, useRef, useState } from 'react'

interface Memory {
    id: number
    task_id: number
    source: string
    content: string
    created_at: string
}

export default function Knowledge() {
    const [tab, setTab] = useState<'kb' | 'learned'>('kb')

    // Knowledge Base state
    const [content, setContent] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [savedOk, setSavedOk] = useState(false)
    const [loading, setLoading] = useState(true)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Learned memories state
    const [memories, setMemories] = useState<Memory[]>([])
    const [memoriesLoading, setMemoriesLoading] = useState(false)

    useEffect(() => {
        fetch('/api/knowledge')
            .then(r => r.json())
            .then(d => { setContent(d.content || ''); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    useEffect(() => {
        if (tab === 'learned') {
            setMemoriesLoading(true)
            fetch('/api/memories')
                .then(r => r.json())
                .then(d => { setMemories(d.memories || []); setMemoriesLoading(false) })
                .catch(() => setMemoriesLoading(false))
        }
    }, [tab])

    const handleSave = async () => {
        if (isSaving) return
        setIsSaving(true)
        setSavedOk(false)
        try {
            await fetch('/api/knowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            })
            setSavedOk(true)
            setTimeout(() => setSavedOk(false), 2500)
        } catch { /* silent */ } finally { setIsSaving(false) }
    }

    const handleDeleteMemory = async (id: number) => {
        try {
            const res = await fetch(`/api/memories/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) {
                setMemories(prev => prev.filter(m => m.id !== id))
            }
        } catch { /* silent */ }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault()
            handleSave()
        }
        if (e.key === 'Tab') {
            e.preventDefault()
            const ta = textareaRef.current
            if (!ta) return
            const start = ta.selectionStart
            const end = ta.selectionEnd
            const next = content.substring(0, start) + '  ' + content.substring(end)
            setContent(next)
            requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2 })
        }
    }

    const lines = content.split('\n').length
    const words = content.trim() ? content.trim().split(/\s+/).length : 0
    const chars = content.length

    return (
        <div className="flex flex-col h-full overflow-hidden" style={{ animation: 'fadeIn 0.3s ease' }}>

            {/* Header */}
            <div className="shrink-0 px-8 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <div>
                    <h2 className="text-[16px] font-bold flex items-center gap-2.5 m-0" style={{ color: 'var(--text-main)' }}>
                        <i className="fa-solid fa-database text-[14px]" style={{ color: 'var(--primary)' }}></i>
                        Memory
                    </h2>
                    <p className="text-[12px] mt-0.5 m-0" style={{ color: 'var(--text-muted)' }}>
                        {tab === 'kb' ? 'Persistent memory injected into every agent prompt.' : 'Auto-extracted learnings from completed tasks.'}
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {/* Tab switcher */}
                    <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                        <button
                            onClick={() => setTab('kb')}
                            className="px-3 py-1.5 text-[11px] font-semibold transition-all"
                            style={{
                                background: tab === 'kb' ? 'var(--accent)' : 'transparent',
                                color: tab === 'kb' ? 'var(--primary)' : 'var(--text-muted)',
                                borderRight: '1px solid var(--border)',
                            }}
                        >
                            Knowledge Base
                        </button>
                        <button
                            onClick={() => setTab('learned')}
                            className="px-3 py-1.5 text-[11px] font-semibold transition-all flex items-center gap-1.5"
                            style={{
                                background: tab === 'learned' ? 'var(--accent)' : 'transparent',
                                color: tab === 'learned' ? 'var(--primary)' : 'var(--text-muted)',
                            }}
                        >
                            Learned
                            {memories.length > 0 && (
                                <span
                                    className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                                    style={{
                                        background: tab === 'learned' ? 'var(--primary)' : 'var(--border)',
                                        color: tab === 'learned' ? '#fff' : 'var(--text-muted)',
                                    }}
                                >
                                    {memories.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Stats + Save — only on KB tab */}
                    {tab === 'kb' && (
                        <>
                            {!loading && (
                                <div className="hidden md:flex items-center gap-2 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                                    <span>{lines} ln</span>
                                    <span style={{ opacity: 0.3 }}>/</span>
                                    <span>{words} w</span>
                                    <span style={{ opacity: 0.3 }}>/</span>
                                    <span>{chars} ch</span>
                                </div>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={isSaving || loading}
                                className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold transition-all disabled:opacity-30"
                                style={{
                                    borderRadius: 'var(--radius-md)',
                                    background: savedOk ? 'var(--success)' : 'transparent',
                                    color: savedOk ? '#fff' : 'var(--primary)',
                                    border: `1px solid ${savedOk ? 'var(--success)' : 'rgba(var(--primary-rgb), 0.3)'}`,
                                }}
                                onMouseEnter={e => { if (!isSaving && !savedOk) (e.currentTarget).style.background = 'var(--accent)' }}
                                onMouseLeave={e => { if (!savedOk) (e.currentTarget).style.background = 'transparent' }}
                                title="Save (Ctrl+S)"
                            >
                                {isSaving ? <><i className="fa-solid fa-spinner fa-spin text-[10px]"></i> Saving...</>
                                    : savedOk ? <><i className="fa-solid fa-check text-[10px]"></i> Saved!</>
                                        : <><i className="fa-solid fa-floppy-disk text-[10px]"></i> Save</>}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content area */}
            {tab === 'kb' ? (
                /* ── Knowledge Base Editor ── */
                <>
                    <div className="flex-1 overflow-hidden flex min-h-0">
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center gap-3" style={{ color: 'var(--text-muted)' }}>
                                <i className="fa-solid fa-spinner fa-spin text-lg" style={{ color: 'var(--primary)' }}></i>
                                <span className="text-[13px]">Loading...</span>
                            </div>
                        ) : (
                            <>
                                {/* Line numbers */}
                                <div
                                    className="hidden md:flex flex-col overflow-hidden shrink-0 select-none pt-5 pb-5 w-12 text-right"
                                    style={{
                                        borderRight: '1px solid var(--border)',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '12px',
                                        lineHeight: '1.75rem',
                                        color: 'var(--text-subtle)',
                                    }}
                                >
                                    {Array.from({ length: Math.max(lines, 1) }, (_, i) => (
                                        <div key={i} className="pr-3 leading-7 text-[11px]">{i + 1}</div>
                                    ))}
                                </div>

                                {/* Textarea */}
                                <div className="flex-1 relative overflow-hidden">
                                    <textarea
                                        ref={textareaRef}
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        spellCheck={false}
                                        placeholder="# Knowledge Base&#10;&#10;Write rules, constraints, and context here.&#10;This is injected into every agent prompt."
                                        className="w-full h-full resize-none outline-none hide-scrollbar relative z-10"
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--text-main)',
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '13px',
                                            lineHeight: '1.75rem',
                                            padding: '20px 28px',
                                            caretColor: 'var(--primary)',
                                        }}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Status bar */}
                    <div
                        className="shrink-0 flex items-center justify-between px-5 py-2"
                        style={{
                            borderTop: '1px solid var(--border)',
                            fontSize: '10px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-subtle)',
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-file-code text-[9px]"></i>
                            <span>knowledge.md</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {savedOk && <span style={{ color: 'var(--success)' }}><i className="fa-solid fa-check mr-0.5"></i> Saved</span>}
                            <span>Ctrl+S</span>
                        </div>
                    </div>
                </>
            ) : (
                /* ── Learned Memories Tab ── */
                <div className="flex-1 overflow-auto min-h-0">
                    {memoriesLoading ? (
                        <div className="flex items-center justify-center gap-3 py-20" style={{ color: 'var(--text-muted)' }}>
                            <i className="fa-solid fa-spinner fa-spin text-lg" style={{ color: 'var(--primary)' }}></i>
                            <span className="text-[13px]">Loading memories...</span>
                        </div>
                    ) : memories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-20" style={{ color: 'var(--text-muted)' }}>
                            <i className="fa-solid fa-brain text-3xl" style={{ opacity: 0.3 }}></i>
                            <p className="text-[13px] m-0">No learned memories yet.</p>
                            <p className="text-[11px] m-0" style={{ color: 'var(--text-subtle)' }}>
                                Memories are auto-extracted after each completed task.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-0">
                            {memories.map(m => (
                                <div
                                    key={m.id}
                                    className="group flex items-start gap-3 px-8 py-3.5 transition-colors"
                                    style={{ borderBottom: '1px solid var(--border)' }}
                                    onMouseEnter={e => (e.currentTarget).style.background = 'var(--accent)'}
                                    onMouseLeave={e => (e.currentTarget).style.background = 'transparent'}
                                >
                                    {/* Source badge */}
                                    <span
                                        className="shrink-0 mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                                        style={{
                                            background: m.source === 'agent'
                                                ? 'rgba(var(--primary-rgb), 0.15)'
                                                : 'rgba(var(--warning-rgb, 255, 170, 0), 0.15)',
                                            color: m.source === 'agent' ? 'var(--primary)' : 'var(--warning, #fa0)',
                                        }}
                                    >
                                        {m.source === 'agent' ? 'AI' : 'AUTO'}
                                    </span>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] m-0 leading-relaxed" style={{ color: 'var(--text-main)' }}>
                                            {m.content}
                                        </p>
                                        <p className="text-[10px] mt-1 m-0 font-mono" style={{ color: 'var(--text-subtle)' }}>
                                            {new Date(m.created_at).toLocaleDateString()} &middot; Task #{m.task_id}
                                        </p>
                                    </div>

                                    {/* Delete button — visible on hover */}
                                    <button
                                        onClick={() => handleDeleteMemory(m.id)}
                                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded"
                                        style={{ color: 'var(--text-muted)' }}
                                        onMouseEnter={e => (e.currentTarget).style.color = 'var(--danger, #e55)'}
                                        onMouseLeave={e => (e.currentTarget).style.color = 'var(--text-muted)'}
                                        title="Delete memory"
                                    >
                                        <i className="fa-solid fa-trash-can text-[11px]"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
