'use client'

import Logo from '@/components/Logo';
import { useEffect, useState } from 'react';

interface Message {
  id: number;
  task_id: number;
  sender: string;
  content: string;
  is_approval_request: boolean;
}

interface Task {
  id: number;
  title: string;
  status: string;
  deadline: string;
  budget: number;
}

export default function Dashboard() {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/tasks')
        const data = await res.json()
        if (data.tasks && data.tasks.length > 0) {
          if (!activeTask) setActiveTask(data.tasks[0])
        }
      } catch (e) { }
    }
    fetchLatest()
  }, [activeTask])

  useEffect(() => {
    if (!activeTask) return;
    const fetchMsgs = async () => {
      try {
        const res = await fetch(`/api/tasks/${activeTask.id}/messages`)
        const data = await res.json()
        setMessages(data.messages || [])
      } catch (e) { }
    }
    fetchMsgs()
    const interval = setInterval(fetchMsgs, 3000)
    return () => clearInterval(interval)
  }, [activeTask])

  const approveAction = async () => {
    if (!activeTask) return;
    await fetch(`/api/tasks/${activeTask.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: "ACTION: APPROVED", is_approval: true })
    });
  }

  if (!activeTask) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-gray-500 gap-4">
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Logo size={64} className="opacity-40" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-wide">No Task Selected</h2>
        <p className="text-gray-400">Select an ongoing operation from the sidebar, or delegate a new one.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 animate-[fadeIn_0.5s_ease]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-md sticky top-0 z-10">
        <h2 className="text-xl font-bold flex items-center gap-3 tracking-wide text-white">
          <Logo size={24} className="drop-shadow-[0_0_8px_rgba(0,242,254,0.6)]" /> {activeTask.title}
        </h2>
        <span className="text-[#00f2fe] font-mono text-xs font-bold tracking-widest py-1.5 px-3 bg-[#00f2fe]/10 rounded border border-[#00f2fe]/30">ID: OP-{activeTask.id}</span>
      </div>

      {/* Message List */}
      <div className="flex-grow overflow-y-auto hide-scrollbar p-8 flex flex-col gap-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex w-full items-end ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-6 py-4 rounded-2xl whitespace-pre-wrap leading-relaxed ${m.sender === 'user'
              ? 'bg-gradient-to-r from-[#00f2fe]/10 to-[#4facfe]/20 border border-[#00f2fe]/30 text-white rounded-br-sm shadow-[0_4px_20px_rgba(0,242,254,0.05)]'
              : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-sm drop-shadow-md backdrop-blur-sm'
              }`}>
              {m.content}

              {m.is_approval_request && (
                <div className="mt-5 p-6 bg-[#f39c12]/10 border border-[#f39c12]/50 rounded-xl flex flex-col gap-4 shadow-[0_0_15px_rgba(243,156,18,0.1)]">
                  <h4 className="text-[#f39c12] font-bold text-sm tracking-widest uppercase m-0 flex items-center gap-2">
                    <i className="fa-solid fa-triangle-exclamation"></i> ACTION REQUIRED
                  </h4>
                  <p className="text-sm text-gray-300">To proceed with background execution, please review and grant cryptographic override.</p>
                  <button onClick={approveAction} className="self-start mt-2 px-6 py-2.5 bg-gradient-to-r from-[#f39c12] to-[#e67e22] text-black font-bold uppercase tracking-wider text-xs rounded shadow-[0_0_15px_rgba(243,156,18,0.4)] hover:shadow-[0_0_25px_rgba(243,156,18,0.6)] hover:scale-105 transition-all">
                    <i className="fa-solid fa-fingerprint mr-2 text-sm"></i> Grant Execution Override
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
