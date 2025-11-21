'use client'

import { useEffect, useState } from 'react'

export default function KnowledgeBase() {
    const [knowledgeContent, setKnowledgeContent] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const fetchKnowledge = async () => {
            try {
                const res = await fetch('/api/knowledge')
                const data = await res.json()
                setKnowledgeContent(data.content || '')
            } catch (e) {
                console.error("Failed to load knowledge")
            }
        }
        fetchKnowledge()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await fetch('/api/knowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: knowledgeContent })
            })
            setTimeout(() => setIsSaving(false), 800)
        } catch (e) {
            setIsSaving(false)
        }
    }

    return (
        <div className="h-full w-full flex flex-col p-10 animate-[fadeIn_0.5s_ease] overflow-hidden">
            <div className="mb-8 flex justify-between items-start border-b border-[var(--border)] pb-6 shrink-0 transition-colors duration-500">
                <div>
                    <h2 className="text-4xl font-bold m-0 flex items-center gap-4 tracking-wide text-[var(--text-main)] transition-colors duration-500">
                        <i className="fa-solid fa-book-open-reader text-[var(--primary)] transition-all duration-500"></i> Knowledge Base
                    </h2>
                    <p className="text-[var(--text-muted)] mt-3 max-w-2xl text-base leading-relaxed transition-colors duration-500">Your agent's persistent long-term memory. OPAS automatically references this before every skill invocation or task execution.</p>
                </div>

                <button
                    onClick={handleSave}
                    className={`shrink-0 px-7 py-3 font-bold uppercase tracking-widest text-sm transition-all flex items-center gap-3 border ${isSaving
                        ? 'bg-[#10a37f] border-[#10a37f] text-white'
                        : 'bg-[var(--panel)] border-[var(--border)] text-[var(--primary)] hover:bg-[var(--accent)] hover:border-[var(--primary)]'
                        }`}
                >
                    {isSaving ? <><i className="fa-solid fa-check text-base"></i> Synced!</> : <><i className="fa-solid fa-download text-base"></i> Commit Knowledge</>}
                </button>
            </div>

            <div className="flex-grow flex flex-col relative pb-4 min-h-0">
                <textarea
                    value={knowledgeContent}
                    onChange={(e) => setKnowledgeContent(e.target.value)}
                    className="flex-grow w-full bg-[var(--input-bg)] border border-[var(--border)] p-8 text-sm font-mono text-[var(--text-main)] outline-none focus:border-[var(--primary)] resize-none hide-scrollbar transition-all leading-loose duration-500"
                    placeholder="Enter permanent rules, constraints, API docs, or operational context here..."
                    spellCheck="false"
                />
                <div className="absolute right-6 bottom-8 text-[10px] text-[var(--primary)] font-bold uppercase tracking-widest bg-[var(--accent)] border border-[var(--primary)]/20 px-2.5 py-1 transition-colors duration-500 pointer-events-none">
                    data/knowledge/knowledge.md
                </div>
            </div>
        </div>
    )
}
