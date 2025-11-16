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
      <div className="flex-grow flex flex-col items-center justify-center text-[var(--text-muted)] gap-4">
        <div className="w-24 h-24 rounded-full bg-[var(--bg)]/10 border border-[var(--border)] flex items-center justify-center mb-4">
          <Logo size={64} className="opacity-40 text-[var(--primary)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-main)] tracking-wide">No Task Selected</h2>
        <p className="text-[var(--text-muted)]">Select an ongoing operation from the sidebar, or delegate a new one.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 animate-[fadeIn_0.5s_ease]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--panel)] backdrop-blur-md sticky top-0 z-10 transition-colors duration-500">
        <h2 className="text-xl font-bold flex items-center gap-3 tracking-wide text-[var(--text-main)] transition-colors duration-500">
          <Logo size={24} className="drop-shadow-[0_0_8px_var(--primary)] transition-all duration-500" /> {activeTask.title}
        </h2>
        <span className="text-[var(--primary)] font-mono text-xs font-bold tracking-widest py-1.5 px-3 bg-[var(--accent)] rounded border border-[var(--primary)]/30">ID: OP-{activeTask.id}</span>
      </div>

      {/* Message List */}
      <div className="flex-grow overflow-y-auto hide-scrollbar p-8 flex flex-col gap-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex w-full items-end ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-6 py-4 rounded-2xl whitespace-pre-wrap leading-relaxed ${m.sender === 'user'
              ? 'bg-[var(--accent)] border border-[var(--primary)]/30 text-[var(--text-main)] rounded-br-sm shadow-[0_4px_20px_var(--accent)]'
              : 'bg-[var(--panel)] border border-[var(--border)] text-[var(--text-main)] rounded-bl-sm drop-shadow-md backdrop-blur-sm'
              }`}>
              {m.content}

              {m.is_approval_request && (
                <div className="mt-5 p-6 bg-[#f39c12]/10 border border-[#f39c12]/50 rounded-xl flex flex-col gap-4 shadow-[0_0_15px_rgba(243,156,18,0.1)]">
                  <h4 className="text-[#f39c12] font-bold text-sm tracking-widest uppercase m-0 flex items-center gap-2">
                    <i className="fa-solid fa-triangle-exclamation"></i> ACTION REQUIRED
                  </h4>
                  <p className="text-sm text-[var(--text-muted)]">To proceed with background execution, please review and grant cryptographic override.</p>
                  <button onClick={approveAction} className="self-start mt-2 px-6 py-2.5 bg-[#f39c12] text-black font-bold uppercase tracking-wider text-xs rounded shadow-[0_0_15px_rgba(243,156,18,0.4)] hover:shadow-[0_0_25px_rgba(243,156,18,0.6)] hover:scale-105 transition-all">
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
