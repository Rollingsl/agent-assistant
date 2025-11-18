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

interface DashboardProps {
  activeTask: Task | null;
  setActiveTask: (task: Task) => void;
}

export default function Dashboard({ activeTask, setActiveTask }: DashboardProps) {
  const [messages, setMessages] = useState<Message[]>([])

  // Auto-select first queued/running task if none chosen yet
  useEffect(() => {
    if (activeTask) return;
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/tasks')
        const data = await res.json()
        if (data.tasks && data.tasks.length > 0) {
          setActiveTask(data.tasks[0])
        }
      } catch (e) { }
    }
    fetchLatest()
  }, [activeTask, setActiveTask])

  // Poll messages for the active task every 3 seconds
  useEffect(() => {
    if (!activeTask) return;
    setMessages([]) // Clear on task switch
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
        <div className="w-24 h-24 bg-[var(--panel)] border border-[var(--border)] flex items-center justify-center mb-4">
          <Logo size={64} className="opacity-40 text-[var(--primary)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-main)] tracking-wide">No Task Selected</h2>
        <p className="text-[var(--text-muted)]">Select an ongoing operation from the sidebar, or delegate a new one.</p>
      </div>
    )
  }

  const statusColor = {
    running: 'text-[var(--primary)] border-[var(--primary)]/40 bg-[var(--accent)]',
    completed: 'text-[#10a37f] border-[#10a37f]/40 bg-[#10a37f]/10',
    waiting_for_user: 'text-[#f39c12] border-[#f39c12]/40 bg-[#f39c12]/10',
    queued: 'text-[var(--text-muted)] border-[var(--border)]',
  }[activeTask.status] ?? 'text-[var(--text-muted)] border-[var(--border)]';

  return (
    <div className="h-full w-full flex flex-col animate-[fadeIn_0.5s_ease] overflow-hidden">
      {/* Header */}
      <div className="px-8 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--panel)] shrink-0 transition-colors duration-500">
        <h2 className="text-xl font-bold flex items-center gap-3 tracking-wide text-[var(--text-main)]">
          <Logo size={22} className="text-[var(--primary)]" /> {activeTask.title}
        </h2>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1.5 border ${statusColor}`}>
            <i className={`fa-solid mr-1 ${activeTask.status === 'running' ? 'fa-spinner fa-spin' : activeTask.status === 'completed' ? 'fa-check' : activeTask.status === 'waiting_for_user' ? 'fa-hand-paper' : 'fa-clock'}`}></i>
            {activeTask.status.replace(/_/g, ' ')}
          </span>
          <span className="text-[var(--primary)] font-mono text-xs font-bold tracking-widest py-1.5 px-3 bg-[var(--accent)] border border-[var(--primary)]/30">
            OP-{activeTask.id}
          </span>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-grow overflow-y-auto hide-scrollbar p-8 flex flex-col gap-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)] gap-3">
            <i className="fa-solid fa-hourglass-half text-2xl text-[var(--primary)] animate-pulse"></i>
            <p className="text-sm">Waiting for agent to pick up this task...</p>
            <p className="text-xs opacity-60">Messages will appear here as the agent processes the operation.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex w-full items-end ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-6 py-4 rounded-2xl whitespace-pre-wrap leading-relaxed text-sm ${m.sender === 'user'
              ? 'bg-[var(--accent)] border border-[var(--primary)]/30 text-[var(--text-main)] rounded-br-sm'
              : 'bg-[var(--panel)] border border-[var(--border)] text-[var(--text-main)] rounded-bl-sm'
              }`}>
              {m.content}

              {m.is_approval_request && (
                <div className="mt-5 p-5 bg-[#f39c12]/10 border border-[#f39c12]/50 flex flex-col gap-3">
                  <h4 className="text-[#f39c12] font-bold text-xs tracking-widest uppercase m-0 flex items-center gap-2">
                    <i className="fa-solid fa-triangle-exclamation"></i> ACTION REQUIRED
                  </h4>
                  <p className="text-sm text-[var(--text-muted)]">To proceed with background execution, please review and grant cryptographic override.</p>
                  <button onClick={approveAction} className="self-start px-5 py-2 bg-[#f39c12] text-black font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-all">
                    <i className="fa-solid fa-fingerprint mr-2"></i> Grant Execution Override
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
