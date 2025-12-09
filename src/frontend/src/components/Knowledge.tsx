'use client'

import { useEffect, useRef, useState } from 'react'

export default function Knowledge() {
    const [content, setContent] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [savedOk, setSavedOk] = useState(false)
    const [loading, setLoading] = useState(true)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

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
        } catch { /* silent */ } finally { setIsSaving(false) }
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
                        Knowledge Base
                    </h2>
                    <p className="text-[12px] mt-0.5 m-0" style={{ color: 'var(--text-muted)' }}>
                        Persistent memory injected into every agent prompt.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {/* Stats */}
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
                </div>
            </div>

            {/* Editor */}
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
        </div>
    )
}
