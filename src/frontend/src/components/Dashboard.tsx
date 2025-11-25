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
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [stats, setStats] = useState({ active: 0, completed: 0 })

  // Fetch recent tasks + stats when no task is selected (Landing State)
  useEffect(() => {
    if (activeTask) return;
    const fetchSummary = async () => {
      try {
        const res = await fetch('/api/tasks')
        const data = await res.json()
        if (data.tasks) {
          setRecentTasks(data.tasks.slice(0, 4))
          setStats({
            active: data.tasks.filter((t: Task) => t.status !== 'completed').length,
            completed: data.tasks.filter((t: Task) => t.status === 'completed').length
          })
        }
      } catch (e) { }
    }
    fetchSummary()
  }, [activeTask])

  // Poll messages for the active task
  useEffect(() => {
    if (!activeTask) return;
    setMessages([])
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

  // ── LANDING STATE (IMMERIVE "COMMAND CENTER") ──
  if (!activeTask) {
    return (
      <div className="h-full w-full flex flex-col p-12 overflow-y-auto hide-scrollbar animate-[fadeIn_0.6s_ease] bg-[var(--bg)] transition-colors duration-500">

        {/* Visual Backdrop Accent */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--primary)] opacity-[0.03] blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--primary)] opacity-[0.02] blur-[100px] pointer-events-none"></div>

        <div className="max-w-6xl w-full mx-auto flex flex-col gap-12 relative z-10">

          {/* Welcome Header */}
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-[var(--panel)] border border-[var(--primary)]/20 text-[var(--primary)] shadow-[0_0_20px_rgba(0,242,254,0.1)]">
                  <Logo size={32} />
                </div>
                <h1 className="text-5xl font-black tracking-tight text-[var(--text-main)] transition-colors duration-500">Command Center</h1>
              </div>
              <p className="text-[var(--text-muted)] text-lg max-w-xl transition-colors duration-500">Systems operative. Autonomous PERSONAL Assistant is standing by for new tactical delegations.</p>
            </div>
            <div className="flex items-center gap-6 bg-[var(--panel)] px-8 py-5 border border-[var(--border)] transition-colors duration-500">
              <div className="flex flex-col items-center">
                <span className="text-[var(--primary)] text-2xl font-black tabular-nums">{stats.active}</span>
                <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-[var(--text-muted)] mt-1">Active</span>
              </div>
              <div className="w-[1px] h-8 bg-[var(--border)]"></div>
              <div className="flex flex-col items-center">
                <span className="text-[var(--text-main)] text-2xl font-black tabular-nums opacity-60 transition-colors duration-500">{stats.completed}</span>
                <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-[var(--text-muted)] mt-1">Finished</span>
              </div>
            </div>
          </div>

          {/* Operational Status Sub-header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[var(--panel)] border border-[var(--border)] flex items-center gap-4 group hover:border-[var(--primary)]/40 transition-all duration-500">
              <div className="w-10 h-10 flex items-center justify-center bg-[var(--accent)] border border-[var(--primary)]/10 text-[var(--primary)]">
                <i className="fa-solid fa-microchip"></i>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">Neural Load</div>
                <div className="text-sm font-bold text-[var(--text-main)] transition-colors duration-500">Dynamic Balancing</div>
              </div>
            </div>
            <div className="p-6 bg-[var(--panel)] border border-[var(--border)] flex items-center gap-4 group hover:border-[var(--primary)]/40 transition-all duration-500">
              <div className="w-10 h-10 flex items-center justify-center bg-[var(--accent)] border border-[var(--primary)]/10 text-[var(--primary)]">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">Encryption</div>
                <div className="text-sm font-bold text-[var(--text-main)] transition-colors duration-500">AES-256 Active</div>
              </div>
            </div>
            <div className="p-6 bg-[var(--panel)] border border-[var(--border)] flex items-center gap-4 group hover:border-[var(--primary)]/40 transition-all duration-500">
              <i className="fa-solid fa-circle text-[6px] text-[#10a37f] animate-pulse"></i>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">API Status</div>
                <div className="text-sm font-bold text-[var(--text-main)] transition-colors duration-500">OpenAI: Operational</div>
              </div>
            </div>
          </div>

          {/* Recent Tasks Grid */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 transition-colors duration-500">
              <h3 className="text-xl font-bold flex items-center gap-3 text-[var(--text-main)] transition-colors duration-500"><i className="fa-solid fa-list-ul text-[var(--primary)]"></i> Recent Operations</h3>
            </div>

            {recentTasks.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center bg-[var(--panel)]/30 border border-dashed border-[var(--border)] text-[var(--text-muted)] transition-colors duration-500">
                <i className="fa-solid fa-inbox text-4xl mb-4 opacity-20"></i>
                <p className="font-semibold">No recent operations found.</p>
                <p className="text-sm mt-1">Delegate your first task from the sidebar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentTasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setActiveTask(t)}
                    className="bg-[var(--panel)] border border-[var(--border)] p-6 group cursor-pointer hover:border-[var(--primary)]/50 hover:bg-[var(--bg)] transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-[var(--accent)] text-[var(--primary)] text-[10px] font-bold px-2 py-1 border border-[var(--primary)]/20">OP-{t.id}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border ${t.status === 'completed' ? 'text-[#10a37f] border-[#10a37f]/20 bg-[#10a37f]/5' :
                          t.status === 'waiting_for_user' ? 'text-[#f39c12] border-[#f39c12]/20 bg-[#f39c12]/5' :
                            'text-[var(--primary)] border-[var(--primary)]/20 bg-[var(--accent)]'
                        }`}>
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold mb-3 group-hover:text-[var(--primary)] transition-colors text-[var(--text-main)] transition-colors duration-500">{t.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] font-mono transition-colors duration-500">
                      <span className="flex items-center gap-1.5"><i className="fa-solid fa-microchip text-[10px] opacity-60"></i>{t.budget.toLocaleString()}</span>
                      <span className="flex items-center gap-1.5"><i className="fa-regular fa-calendar text-[10px] opacity-60"></i>{t.deadline || '--/--'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── ACTIVE TASK VIEW (WITH LOG/CHAT) ──
  const statusColor = {
    running: 'text-[var(--primary)] border-[var(--primary)]/40 bg-[var(--accent)]',
    completed: 'text-[#10a37f] border-[#10a37f]/40 bg-[#10a37f]/10',
    waiting_for_user: 'text-[#f39c12] border-[#f39c12]/40 bg-[#f39c12]/10',
    queued: 'text-[var(--text-muted)] border-[var(--border)]',
  }[activeTask.status] ?? 'text-[var(--text-muted)] border-[var(--border)]';

  return (
    <div className="h-full w-full flex flex-col animate-[fadeIn_0.5s_ease] overflow-hidden">
      {/* Header */}
      <div className={`px-8 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--panel)] shrink-0 transition-colors duration-500`}>
        <div className="flex items-center gap-4">
          <button onClick={() => { }} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-all">
            <Logo size={22} className="text-[var(--primary)]" />
          </button>
          <h2 className="text-xl font-bold flex items-center gap-3 tracking-wide text-[var(--text-main)] transition-colors duration-500">
            {activeTask.title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1.5 border ${statusColor}`}>
            <i className={`fa-solid mr-1 ${activeTask.status === 'running' ? 'fa-spinner fa-spin' : activeTask.status === 'completed' ? 'fa-check' : activeTask.status === 'waiting_for_user' ? 'fa-hand-paper' : 'fa-clock'}`}></i>
            {activeTask.status.replace(/_/g, ' ')}
          </span>
          <span className="text-[var(--primary)] font-mono text-[10px] font-bold tracking-widest py-1.5 px-3 bg-[var(--accent)] border border-[var(--primary)]/30">
            OP-{activeTask.id}
          </span>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-grow overflow-y-auto hide-scrollbar p-8 flex flex-col gap-8">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)] gap-3 opacity-60">
            <i className="fa-solid fa-hourglass-half text-2xl text-[var(--primary)] animate-pulse"></i>
            <p className="text-sm font-medium">Operation Initialized</p>
            <p className="text-xs">Waiting for tactical updates from the background agent...</p>
          </div>
        )}
        <div className="max-w-4xl w-full mx-auto flex flex-col gap-8">
          {messages.map((m, i) => (
            <div key={i} className={`flex w-full items-start gap-4 ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar/Icon Indicator */}
              <div className={`shrink-0 w-8 h-8 flex items-center justify-center text-[10px] border transform translate-y-1 ${m.sender === 'user' ? 'bg-[var(--primary)] text-black border-[var(--primary)]' : 'bg-[var(--panel)] text-[var(--primary)] border-[var(--border)]'
                }`}>
                <i className={`fa-solid ${m.sender === 'user' ? 'fa-user' : 'fa-robot'}`}></i>
              </div>

              <div className={`max-w-[85%] px-6 py-4 border whitespace-pre-wrap leading-relaxed text-[15px] transition-colors duration-500 ${m.sender === 'user'
                ? 'bg-[var(--accent)] border-[var(--primary)]/30 text-[var(--text-main)] shadow-[0_4px_15px_rgba(0,242,254,0.05)]'
                : 'bg-[var(--panel)] border-[var(--border)] text-[var(--text-main)] shadow-[0_4px_15px_rgba(0,0,0,0.1)]'
                }`}>
                {m.content}

                {m.is_approval_request && (
                  <div className="mt-6 p-6 bg-[#f39c12]/5 border border-[#f39c12] flex flex-col gap-4 animate-[pulse_3s_infinite]">
                    <h4 className="text-[#f39c12] font-black text-xs tracking-[0.2em] uppercase m-0 flex items-center gap-3">
                      <i className="fa-solid fa-shield-halved"></i> Cryptographic Intercept
                    </h4>
                    <p className="text-[15px] text-[var(--text-muted)] leading-relaxed transition-colors duration-500">Autonomous execution has reached a high-consequence boundary. Review the tactical summary above and provide verification to proceed.</p>
                    <button onClick={approveAction} className="self-start px-8 py-3 bg-[#f39c12] text-black font-black uppercase tracking-widest text-[13px] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3">
                      <i className="fa-solid fa-fingerprint text-lg"></i> Grant Verified Approval
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
