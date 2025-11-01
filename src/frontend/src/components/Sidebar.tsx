'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from './Logo';

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
                const res = await fetch('/api/tasks')
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
            <aside className="w-[350px] flex flex-col p-6 animate-[slideInLeft_0.5s_ease] relative glass border-t border-l border-white/5">
                <div className="flex items-center gap-3 text-2xl font-bold mb-8 tracking-wide">
                    <Logo size={40} className="drop-shadow-[0_0_10px_rgba(0,242,254,0.4)]" />
                    OPAS
                </div>

                {/* Navigation Links */}
                <div className="flex flex-col gap-2 mb-8 font-medium">
                    <Link href="/" className={`p-3 rounded-lg flex items-center gap-3 transition-all duration-300 ${pathname === '/' ? 'bg-[#00f2fe]/10 border border-[#4facfe]/50 text-white drop-shadow-[0_0_8px_rgba(0,242,254,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                        <i className={`fa-solid fa-satellite-dish w-5 text-center ${pathname === '/' ? 'text-[#00f2fe]' : ''}`}></i> Operations Board
                    </Link>
                    <Link href="/integrations" className={`p-3 rounded-lg flex items-center gap-3 transition-all duration-300 ${pathname === '/integrations' ? 'bg-[#00f2fe]/10 border border-[#4facfe]/50 text-white drop-shadow-[0_0_8px_rgba(0,242,254,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                        <i className={`fa-solid fa-key w-5 text-center ${pathname === '/integrations' ? 'text-[#00f2fe]' : ''}`}></i> API & Integrations
                    </Link>
                    <Link href="/memory" className={`p-3 rounded-lg flex items-center gap-3 transition-all duration-300 ${pathname === '/memory' ? 'bg-[#00f2fe]/10 border border-[#4facfe]/50 text-white drop-shadow-[0_0_8px_rgba(0,242,254,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                        <i className={`fa-solid fa-brain w-5 text-center ${pathname === '/memory' ? 'text-[#00f2fe]' : ''}`}></i> Memory & Directives
                    </Link>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full p-4 bg-transparent border border-dashed border-[#4facfe] text-[#00f2fe] font-semibold rounded-xl hover:bg-[#00f2fe]/10 hover:border-solid hover:shadow-[0_0_20px_rgba(0,242,254,0.2)] transition-all mb-6 flex items-center justify-center gap-2"
                >
                    <i className="fa-solid fa-plus drop-shadow-[0_0_8px_rgba(0,242,254,0.8)]"></i> Delegate Task
                </button>

                <div className="text-xs text-gray-500 mb-3 font-bold uppercase tracking-widest pl-1">Active Queue</div>

                <div className="flex-grow overflow-y-auto hide-scrollbar flex flex-col gap-3 pr-2">
                    {tasks.length === 0 ? (
                        <div className="text-center p-8 text-gray-600 text-sm">Queue is empty.</div>
                    ) : (
                        tasks.map(t => (
                            <div
                                key={t.id}
                                className={`p-4 rounded-xl bg-black/40 border-l-4 cursor-pointer hover:bg-black/60 transition-all shadow-md
                  ${t.status === 'queued' ? 'border-gray-600' :
                                        t.status === 'running' ? 'border-[#00f2fe] bg-[#00f2fe]/5' :
                                            t.status === 'waiting_for_user' ? 'border-[#f39c12] bg-[#f39c12]/5' :
                                                'border-[#10a37f] bg-[#10a37f]/5'}`
                                }
                            >
                                <div className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded bg-white/5 mb-3 inline-block text-gray-300">
                                    <i className={`fa-solid mr-1.5 ${t.status === 'running' ? 'fa-spinner fa-spin text-[#00f2fe]' : t.status === 'waiting_for_user' ? 'fa-hand-paper text-[#f39c12]' : t.status === 'completed' ? 'fa-check text-[#10a37f]' : 'fa-clock'}`}></i>
                                    {t.status.replace(/_/g, ' ')}
                                </div>
                                <div className="font-semibold text-[15px] mb-2 leading-snug">{t.title}</div>
                                <div className="text-xs text-gray-500 flex justify-between font-mono">
                                    <span><i className="fa-solid fa-microchip mr-1 border-b border-gray-600 pb-0.5"></i> {t.budget}</span>
                                    <span><i className="fa-regular fa-calendar mr-1 border-b border-gray-600 pb-0.5"></i> {t.deadline || '--/--/--'}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* NEW TASK MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-[#05050A]/90 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="glass w-[550px] p-8 flex flex-col gap-6 animate-[popIn_0.3s_ease] border border-white/10 shadow-[0_0_50px_rgba(0,242,254,0.1)]">
                        <div>
                            <h2 className="text-2xl font-bold m-0 flex items-center gap-2"><i className="fa-solid fa-bolt text-[#00f2fe] drop-shadow-[0_0_8px_rgba(0,242,254,0.8)]"></i> Agentic Delegation</h2>
                            <p className="text-sm text-gray-400 mt-2">
                                Specify the objectives. OPAS will queue this, equip skills, and execute asynchronously. It will halt when HITL approval is required.
                            </p>
                        </div>

                        <form className="flex flex-col gap-5" onSubmit={async (e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            await fetch('/api/tasks', {
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
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Operation Title</label>
                                <input name="title" required type="text" className="p-3 bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-[#00f2fe] transition-colors" placeholder="e.g. University Applications" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Detailed Objective & Payload</label>
                                <textarea name="description" required rows={4} className="p-3 bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-[#00f2fe] transition-colors resize-none" placeholder="Provide context, URLs, and overall goals..."></textarea>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Deadline</label>
                                    <input name="deadline" type="date" className="p-3 bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-[#00f2fe] transition-colors font-mono text-sm" />
                                </div>
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Token Budget Limit</label>
                                    <input name="budget" required type="number" defaultValue={50000} className="p-3 bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-[#00f2fe] transition-colors font-mono text-sm" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-lg bg-transparent border border-white/20 text-white font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-black font-bold hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(0,242,254,0.4)]">Launch Operation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
