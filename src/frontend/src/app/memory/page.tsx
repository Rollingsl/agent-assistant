'use client'

import { useEffect, useState } from 'react'

export default function MemoryBank() {
    const [memoryContent, setMemoryContent] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const fetchMemory = async () => {
            try {
                const res = await fetch('/api/memory')
                const data = await res.json()
                setMemoryContent(data.content || '')
            } catch (e) {
                console.error("Failed to load memory")
            }
        }
        fetchMemory()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await fetch('/api/memory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: memoryContent })
            })
            setTimeout(() => setIsSaving(false), 800)
        } catch (e) {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col h-full p-10 animate-[fadeIn_0.5s_ease]">
            <div className="mb-8 flex justify-between items-end border-b border-white/10 pb-6 shrink-0">
                <div>
                    <h2 className="text-4xl font-bold m-0 flex items-center gap-4 tracking-wide">
                        <i className="fa-solid fa-brain text-[#00f2fe] drop-shadow-[0_0_10px_rgba(0,242,254,0.6)]"></i> Memory Directives
                    </h2>
                    <p className="text-gray-400 mt-4 max-w-2xl text-lg leading-relaxed">This neural vault stores your long-term context, boundaries, and learned preferences. OPAS integrates these instructions before equipping any skill or executing any subroutine.</p>
                </div>

                <button
                    onClick={handleSave}
                    className={`px-8 py-3.5 font-bold uppercase tracking-widest text-sm rounded transition-all shadow-lg flex items-center gap-3 border ${isSaving
                        ? 'bg-[#10a37f] border-[#10a37f] text-black shadow-[0_0_20px_rgba(16,163,127,0.5)]'
                        : 'bg-black/50 border-[#00f2fe]/50 text-[#00f2fe] hover:bg-[#00f2fe]/10 hover:border-[#00f2fe] hover:shadow-[0_0_25px_rgba(0,242,254,0.3)]'
                        }`}
                >
                    {isSaving ? <><i className="fa-solid fa-check text-lg"></i> Engram Synced</> : <><i className="fa-solid fa-download text-lg"></i> Commit to Memory</>}
                </button>
            </div>

            <div className="flex-grow flex flex-col relative group pb-4">
                <textarea
                    value={memoryContent}
                    onChange={(e) => setMemoryContent(e.target.value)}
                    className="flex-grow w-full bg-black/40 border border-white/5 p-8 text-lg font-mono text-[#f8f9fa] rounded-2xl outline-none focus:border-[#00f2fe]/50 resize-none hide-scrollbar transition-all leading-loose shadow-inner"
                    placeholder="Enter cross-session constraints or rules here..."
                    spellCheck="false"
                />
                <div className="absolute right-8 bottom-10 text-[11px] text-[#00f2fe] font-bold uppercase tracking-widest bg-[#00f2fe]/10 border border-[#00f2fe]/20 px-3 py-1.5 rounded-md backdrop-blur-sm">
                    sys/memory.md
                </div>
            </div>
        </div>
    )
}
