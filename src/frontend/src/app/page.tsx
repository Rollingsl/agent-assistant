'use client'

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

  // This is a simplified version; in a real app, Sidebar would pass the activeTask via Context or URL params.
  // We'll fetch the most recently active task instead.
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/tasks')
        const data = await res.json()
        if (data.tasks && data.tasks.length > 0) {
          // If no active task selected, pick the first
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
        const res = await fetch(`http://localhost:8000/api/tasks/${activeTask.id}/messages`)
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
    await fetch(`http://localhost:8000/api/tasks/${activeTask.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: "ACTION: APPROVED", is_approval: true })
    });
    // Optimistic update handled by polling
  }

  if (!activeTask) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-gray-500 gap-4">
        <i className="fa-solid fa-satellite-dish text-6xl opacity-50"></i>
        <h2 className="text-2xl font-semibold">No Task Selected</h2>
        <p>Select an ongoing operation from the sidebar, or delegate a new one.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.8s_ease]">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
        <h2 className="text-xl font-semibold flex items-center gap-3">
          <i className="fa-solid fa-microchip text-[#6c5ce7]"></i> {activeTask.title}
        </h2>
        <span className="text-gray-400 font-mono text-sm py-1 px-3 bg-white/5 rounded-lg border border-white/10">ID: OP-{activeTask.id}</span>
      </div>

      {/* Message List */}
      <div className="flex-grow overflow-y-auto hide-scrollbar p-6 flex flex-col gap-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex w-full items-end ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] p-4 rounded-2xl whitespace-pre-wrap shadow-lg ${m.sender === 'user' ? 'bg-[#6c5ce7]/80 rounded-br-sm' : 'bg-[#2f3542]/80 rounded-bl-sm'
              }`}>
              {m.content}

              {m.is_approval_request && (
                <div className="mt-4 p-5 bg-[#f39c12]/15 border border-[#f39c12] rounded-xl flex flex-col gap-3">
                  <h4 className="text-[#f39c12] font-semibold m-0 flex items-center gap-2">
                    <i className="fa-solid fa-triangle-exclamation"></i> ACTION REQUIRED
                  </h4>
                  <p className="text-sm">To proceed with background execution, please review and grant cryptographic override.</p>
                  <button onClick={approveAction} className="self-start mt-2 px-6 py-2.5 bg-[#00cec9] text-black font-extrabold rounded-lg hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,206,201,0.4)]">
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
