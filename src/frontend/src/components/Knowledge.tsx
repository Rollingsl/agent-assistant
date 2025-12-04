'use client'

import { useEffect, useRef, useState } from 'react'

export default function Knowledge() {
    const [content, setContent]     = useState('')
    const [isSaving, setIsSaving]   = useState(false)
    const [savedOk, setSavedOk]     = useState(false)
    const [loading, setLoading]     = useState(true)
    const textareaRef               = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        fetch('/api/knowledge')
            .then(r => r.json())
            .then(d => { setContent(d.content || ''); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

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
        } catch { /* silent */ } finally {
            setIsSaving(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault()
            handleSave()
        }
        // Tab indentation
        if (e.key === 'Tab') {
            e.preventDefault()
            const ta = textareaRef.current
            if (!ta) return
            const start = ta.selectionStart
            const end   = ta.selectionEnd
            const next  = content.substring(0, start) + '  ' + content.substring(end)
            setContent(next)
            requestAnimationFrame(() => {
                ta.selectionStart = ta.selectionEnd = start + 2
            })
        }
    }

    const lines    = content.split('\n').length
    const chars    = content.length
    const words    = content.trim() ? content.trim().split(/\s+/).length : 0

    return (
        <div
            className="flex flex-col h-full overflow-hidden"
            style={{ animation: 'fadeIn 0.4s ease' }}
        >
            {/* ── Toolbar ── */}
            <div
                className="shrink-0 flex items-center justify-between px-7 py-4 gap-4"
                style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}
            >
                <div>
                    <h2
                        className="text-[18px] font-black tracking-tight flex items-center gap-2.5 m-0"
                        style={{ color: 'var(--text-main)' }}
                    >
                        <i className="fa-solid fa-brain text-[15px]" style={{ color: 'var(--primary)' }}></i>
                        Knowledge Base
                    </h2>
                    <p className="text-[12px] mt-0.5 m-0" style={{ color: 'var(--text-muted)' }}>
                        OPAS injects this memory into every prompt before skill invocation or task execution.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {/* Stats chips */}
                    {!loading && (
                        <div
                            className="hidden md:flex items-center gap-3 px-3 py-2 text-[10px] font-mono"
                            style={{ color: 'var(--text-muted)', background: 'var(--input-bg)', border: '1px solid var(--border)' }}
                        >
                            <span title="Lines">{lines.toLocaleString()} <span style={{ opacity: 0.5 }}>ln</span></span>
                            <span style={{ opacity: 0.3 }}>·</span>
                            <span title="Words">{words.toLocaleString()} <span style={{ opacity: 0.5 }}>w</span></span>
                            <span style={{ opacity: 0.3 }}>·</span>
                            <span title="Characters">{chars.toLocaleString()} <span style={{ opacity: 0.5 }}>ch</span></span>
                        </div>
                    )}

                    {/* Save button */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving || loading}
                        className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                            background: savedOk ? 'var(--success)' : 'transparent',
                            color: savedOk ? '#fff' : 'var(--primary)',
                            border: `1px solid ${savedOk ? 'var(--success)' : 'rgba(var(--primary-rgb), 0.4)'}`,
                        }}
                        onMouseEnter={e => { if (!isSaving && !savedOk) { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(var(--primary-rgb),0.7)'; } }}
                        onMouseLeave={e => { if (!savedOk) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(var(--primary-rgb),0.4)'; } }}
                        title="Save (Ctrl+S)"
                    >
                        {isSaving
                            ? <><i className="fa-solid fa-spinner fa-spin text-[10px]"></i> Syncing...</>
                            : savedOk
                                ? <><i className="fa-solid fa-check text-[10px]"></i> Committed!</>
                                : <><i className="fa-solid fa-floppy-disk text-[10px]"></i> Commit</>
                        }
                    </button>
                </div>
            </div>

            {/* ── Editor Area ── */}
            <div className="flex-grow overflow-hidden flex min-h-0 relative">

                {loading ? (
                    <div className="flex-grow flex items-center justify-center gap-3" style={{ color: 'var(--text-muted)' }}>
                        <i className="fa-solid fa-spinner fa-spin text-xl" style={{ color: 'var(--primary)' }}></i>
                        <span className="text-[13px]">Loading memory...</span>
                    </div>
                ) : (
                    <>
                        {/* Line number gutter */}
                        <div
                            className="hidden md:flex flex-col overflow-hidden shrink-0 select-none pt-5 pb-5 px-0 w-12 text-right"
                            style={{
                                background: 'var(--panel)',
                                borderRight: '1px solid var(--border)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '12px',
                                lineHeight: '1.75rem',
                                color: 'var(--text-subtle)',
                            }}
                            aria-hidden="true"
                        >
                            {Array.from({ length: Math.max(lines, 1) }, (_, i) => (
                                <div key={i} className="pr-3 leading-7 text-[11px]">
                                    {i + 1}
                                </div>
                            ))}
                        </div>

                        {/* Textarea */}
                        <div className="flex-grow relative overflow-hidden">
                            {/* Dot grid texture */}
                            <div className="absolute inset-0 dot-grid opacity-[0.3] pointer-events-none" />

                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                spellCheck={false}
                                placeholder={`# OPAS Neural Knowledge Base\n\nEnter permanent rules, constraints, API docs, or contextual memory here.\nThis content is injected into every agent prompt automatically.\n\n## Example directives:\n- Always request HITL approval before sending emails\n- Prefer concise responses under 200 words\n- Use markdown formatting in all agent outputs`}
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

            {/* ── Status Bar ── */}
            <div
                className="shrink-0 flex items-center justify-between px-5 py-2"
                style={{
                    background: 'var(--panel)',
                    borderTop: '1px solid var(--border)',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    opacity: 0.7,
                }}
            >
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-file-code text-[9px]"></i>
                    <span>data/knowledge/knowledge.md</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>Markdown</span>
                </div>
                <div className="flex items-center gap-3">
                    {savedOk && (
                        <span style={{ color: 'var(--success)', opacity: 1 }}>
                            <i className="fa-solid fa-circle-check mr-1 text-[9px]"></i>
                            Saved
                        </span>
                    )}
                    <span>Ctrl+S to save</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>Tab for indent</span>
                </div>
            </div>
        </div>
    )
}
