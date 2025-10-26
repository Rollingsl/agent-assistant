'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Task {
    id: number;
    title: string;
    status: string;
    deadline: string;
    budget: number;
}

export default function Sidebar() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const pathname = usePathname()

    // Polling for tasks
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/tasks')
                const data = await res.json()
                if (data.tasks) setTasks(data.tasks)
            } catch (err) {
                console.error("Failed to fetch tasks")
            }
        }
        fetchTasks()
        const interval = setInterval(fetchTasks, 3000)
        return () => clearInterval(interval)
    }, [])

    return (
        <>
            <aside className="w-[350px] flex flex-col p-6 animate-[slideInLeft_0.5s_ease] relative glass">
                <div className="flex items-center gap-3 text-2xl font-semibold mb-8">
                    <i className="fa-solid fa-network-wired text-[#6c5ce7]"></i>
                    Synapse Layer
                </div>

                {/* Navigation Links */}
                <div className="flex flex-col gap-2 mb-8">
                    <Link href="/" className={`p-3 rounded-lg flex items-center gap-3 transition-colors ${pathname === '/' ? 'bg-[#6c5ce7]/20 border border-[#6c5ce7]' : 'hover:bg-white/5 border border-transparent'}`}>
                        <i className="fa-solid fa-satellite-dish w-5 text-center"></i> Operations Board
                    </Link>
                    <Link href="/integrations" className={`p-3 rounded-lg flex items-center gap-3 transition-colors ${pathname === '/integrations' ? 'bg-[#6c5ce7]/20 border border-[#6c5ce7]' : 'hover:bg-white/5 border border-transparent'}`}>
                        <i className="fa-solid fa-key w-5 text-center"></i> API & Integrations
                    </Link>
                    <Link href="/memory" className={`p-3 rounded-lg flex items-center gap-3 transition-colors ${pathname === '/memory' ? 'bg-[#6c5ce7]/20 border border-[#6c5ce7]' : 'hover:bg-white/5 border border-transparent'}`}>
                        <i className="fa-solid fa-brain w-5 text-center"></i> Memory & Directives
                    </Link>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full p-4 bg-transparent border border-dashed border-[#6c5ce7] text-white rounded-xl hover:bg-[#6c5ce7]/20 hover:border-solid transition-all mb-6 flex items-center justify-center gap-2"
                >
                    <i className="fa-solid fa-plus"></i> Delegate New Task
                </button>

                <div className="text-sm text-gray-400 mb-3 font-semibold uppercase tracking-wider">Active Queue</div>

                <div className="flex-grow overflow-y-auto hide-scrollbar flex flex-col gap-3 pr-2">
                    {tasks.length === 0 ? (
                        <div className="text-center p-8 text-gray-500 text-sm">Queue is empty.</div>
                    ) : (
                        tasks.map(t => (
                            <div
                                key={t.id}
                                className={`p-4 rounded-lg bg-white/5 border-l-4 cursor-pointer hover:bg-white/10 transition-colors
                  ${t.status === 'queued' ? 'border-gray-500' :
                                        t.status === 'running' ? 'border-[#6c5ce7]' :
                                            t.status === 'waiting_for_user' ? 'border-[#f39c12] bg-[#f39c12]/10' :
                                                'border-[#00cec9]'}`
                                }
                            >
                                <div className="text-xs uppercase px-2 py-1 rounded-full bg-white/10 mb-2 inline-block">
                                    <i className={`fa-solid mr-1 ${t.status === 'running' ? 'fa-spinner fa-spin' : t.status === 'waiting_for_user' ? 'fa-hand-paper text-[#f39c12]' : t.status === 'completed' ? 'fa-check text-[#00cec9]' : 'fa-clock'}`}></i>
                                    {t.status.replace(/_/g, ' ')}
                                </div>
                                <div className="font-semibold text-lg mb-1">{t.title}</div>
                                <div className="text-sm text-gray-400 flex justify-between">
                                    <span><i className="fa-solid fa-coins mr-1"></i> {t.budget}</span>
                                    <span><i className="fa-regular fa-calendar mr-1"></i> {t.deadline || 'No deadline'}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* NEW TASK MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="glass w-[500px] p-8 flex flex-col gap-4 animate-[popIn_0.3s_ease]">
                        <h2 className="text-2xl font-semibold m-0"><i className="fa-solid fa-bolt text-[#00cec9] mr-2"></i> Agentic Delegation</h2>
                        <p className="text-sm text-gray-400">
                            Specify the objectives. The Autonomous Engine will queue this, equip skills, and run in the background. It will halt when Human-In-The-Loop approval is required.
                        </p>

                        <form className="flex flex-col gap-4" onSubmit={async (e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            await fetch('http://localhost:8000/api/tasks', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    title: fd.get('title'),
                                    description: fd.get('description'),
                                    deadline: fd.get('deadline'),
                                    budget: parseInt(fd.get('budget') as string, 10)
                                })
                            });
                            setIsModalOpen(false);
                        }}>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-400">Operation Title (e.g. University Applications)</label>
                                <input name="title" required type="text" className="p-3 bg-black/30 border border-white/10 rounded-lg text-white outline-none focus:border-[#6c5ce7]" placeholder="Short identifier" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-400">Detailed Objective & Links</label>
                                <textarea name="description" required rows={4} className="p-3 bg-black/30 border border-white/10 rounded-lg text-white outline-none focus:border-[#6c5ce7]" placeholder="Give me the tasks, context, urls, and overall goals..."></textarea>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex flex-col gap-1 flex-1">
                                    <label className="text-sm text-gray-400">Deadline</label>
                                    <input name="deadline" type="date" className="p-3 bg-black/30 border border-white/10 rounded-lg text-white outline-none focus:border-[#6c5ce7]" />
                                </div>
                                <div className="flex flex-col gap-1 flex-1">
                                    <label className="text-sm text-gray-400">Token Budget Limit</label>
                                    <input name="budget" required type="number" defaultValue={50000} className="p-3 bg-black/30 border border-white/10 rounded-lg text-white outline-none focus:border-[#6c5ce7]" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-lg bg-[#6c5ce7] text-white font-semibold hover:bg-[#a29bfe] transition-colors shadow-[0_0_15px_rgba(108,92,231,0.4)]">Launch Operation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
