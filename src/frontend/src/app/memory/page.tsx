'use client'

import { useEffect, useState } from 'react'

export default function MemoryBank() {
    const [memoryContent, setMemoryContent] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const fetchMemory = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/memory')
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
            await fetch('http://localhost:8000/api/memory', {
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
        <div className="flex flex-col h-full p-8 animate-[fadeIn_0.5s_ease]">
            <div className="mb-6 flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                    <h2 className="text-3xl font-semibold m-0 flex items-center gap-3">
                        <i className="fa-solid fa-brain text-[#6c5ce7]"></i> Memory Directives
                    </h2>
                    <p className="text-gray-400 mt-2 max-w-2xl">This neural vault stores your long-term context, boundaries, and learned preferences. The autonomous agent integrates these instructions before equipping any skill or executing any task.</p>
                </div>

                <button
                    onClick={handleSave}
                    className={`px-6 py-2.5 font-bold rounded-xl transition-all shadow-[0_4px_15px_rgba(108,92,231,0.3)] flex items-center gap-2 ${isSaving ? 'bg-[#00cec9] text-black shadow-[0_4px_15px_rgba(0,206,201,0.5)]' : 'bg-[#6c5ce7] text-white hover:bg-[#a29bfe]'}`}
                >
                    {isSaving ? <><i className="fa-solid fa-check"></i> Engram Synced</> : <><i className="fa-solid fa-download"></i> Commit to Memory</>}
                </button>
            </div>

            <div className="flex-grow flex flex-col relative group">
                <textarea
                    value={memoryContent}
                    onChange={(e) => setMemoryContent(e.target.value)}
                    className="flex-grow w-full bg-black/40 border border-white/10 p-6 text-lg font-mono text-[#f5f6fa] rounded-2xl outline-none focus:border-[#6c5ce7] resize-none hide-scrollbar transition-colors"
                    placeholder="Enter cross-session constraints or rules here..."
                />
                <div className="absolute right-4 bottom-4 text-xs text-gray-500 font-bold uppercase tracking-widest bg-black/50 px-2 py-1 rounded">
                    memory.md
                </div>
            </div>
        </div>
    )
}
