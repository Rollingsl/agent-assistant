'use client'

import { useState } from 'react'

export default function Integrations() {
    const [openAiKey, setOpenAiKey] = useState('')
    const [emailPass, setEmailPass] = useState('')

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        alert('Credentials synced to the local OPAS vault.')
    }

    return (
        <div className="flex flex-col flex-1 p-10 animate-[fadeIn_0.5s_ease] overflow-y-auto hide-scrollbar">
            <div className="flex justify-between items-end mb-10 pb-6 border-b border-[var(--border)] shrink-0 transition-colors duration-500">
                <div>
                    <h2 className="text-4xl font-bold m-0 flex items-center gap-4 tracking-wide text-[var(--text-main)] transition-colors duration-500">
                        <i className="fa-solid fa-server text-[var(--primary)] drop-shadow-[0_0_10px_var(--primary)] transition-all duration-500"></i>
                        Integrations & APIs
                    </h2>
                    <p className="text-[var(--text-muted)] mt-4 text-lg max-w-3xl transition-colors duration-500">Manage your cryptographic keys and external app connections. These dictate the skills OPAS can equip. Keys are stored locally inside your vault and never transmitted externally without explicit consent.</p>
                </div>
                <button onClick={handleSave} className="px-8 py-3.5 bg-[var(--primary)] text-black font-bold uppercase tracking-widest text-sm rounded transition-all shadow-[0_0_20px_var(--accent)] hover:shadow-[0_0_30px_var(--primary)] hover:scale-105 flex items-center gap-2">
                    <i className="fa-solid fa-lock text-lg"></i> Sync to Vault
                </button>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-10">

                {/* OpenAI Card */}
                <div className="bg-[var(--panel)] p-8 rounded-2xl border border-[var(--border)] relative overflow-hidden group shadow-lg flex flex-col justify-between transition-colors duration-500">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#10a37f]"></div>
                    <div>
                        <h3 className="text-2xl font-bold mb-2 flex items-center gap-3 tracking-wide text-[var(--text-main)] transition-colors duration-500">
                            <i className="fa-brands fa-neos text-[#10a37f]"></i> OpenAI LLM Core
                        </h3>
                        <p className="text-[var(--text-muted)] mb-6 font-medium leading-relaxed transition-colors duration-500">Required for the OPAS inference engine to process advanced logical subroutines and parsing.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] text-[var(--text-muted)] uppercase font-bold tracking-widest pl-1">Secret API Key</label>
                        <input
                            type="password"
                            value={openAiKey}
                            onChange={(e) => setOpenAiKey(e.target.value)}
                            className="p-4 bg-black/20 border border-[var(--border)] rounded-xl text-[var(--text-main)] outline-none focus:border-[#10a37f] transition-all font-mono shadow-inner"
                            placeholder="sk-..."
                        />
                    </div>
                </div>

                {/* Email Card */}
                <div className="bg-[var(--panel)] p-8 rounded-2xl border border-[var(--border)] relative overflow-hidden shadow-lg flex flex-col justify-between transition-colors duration-500">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ea4335]"></div>
                    <div>
                        <h3 className="text-2xl font-bold mb-2 flex items-center gap-3 tracking-wide text-[var(--text-main)] transition-colors duration-500">
                            <i className="fa-brands fa-google text-[#ea4335]"></i> Gmail Operator
                        </h3>
                        <p className="text-[var(--text-muted)] mb-6 font-medium leading-relaxed transition-colors duration-500">Permits the agent to orchestrate the drafting and issuing of emails upon HITL cryptographic approval.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] text-[var(--text-muted)] uppercase font-bold tracking-widest pl-1">App Password</label>
                        <input
                            type="password"
                            value={emailPass}
                            onChange={(e) => setEmailPass(e.target.value)}
                            className="p-4 bg-black/20 border border-[var(--border)] rounded-xl text-[var(--text-main)] outline-none focus:border-[#ea4335] transition-all font-mono shadow-inner"
                            placeholder="16-character app password"
                        />
                    </div>
                </div>

                {/* Telegram Card */}
                <div className="bg-[var(--panel)] p-8 rounded-2xl border border-[var(--border)] relative overflow-hidden backdrop-blur-md cursor-not-allowed transition-colors duration-500">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#2AABEE]"></div>
                    <div className="absolute top-8 right-8 text-[10px] font-bold uppercase tracking-widest bg-[var(--text-main)]/10 px-3 py-1.5 rounded text-[var(--text-main)]">Pending Update</div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-3 tracking-wide text-[var(--text-main)] transition-colors duration-500">
                        <i className="fa-brands fa-telegram text-[#2AABEE]"></i> Telegram Bot
                    </h3>
                    <p className="text-[var(--text-muted)] font-medium transition-colors duration-500">Remote neural access to OPAS via your mobile device.</p>
                </div>

                {/* Slack Card */}
                <div className="bg-[var(--panel)] p-8 rounded-2xl border border-[var(--border)] relative overflow-hidden backdrop-blur-md cursor-not-allowed transition-colors duration-500">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#E01E5A]"></div>
                    <div className="absolute top-8 right-8 text-[10px] font-bold uppercase tracking-widest bg-[var(--text-main)]/10 px-3 py-1.5 rounded text-[var(--text-main)]">Pending Update</div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-3 tracking-wide text-[var(--text-main)] transition-colors duration-500">
                        <i className="fa-brands fa-slack text-[#E01E5A]"></i> Slack Integration
                    </h3>
                    <p className="text-[var(--text-muted)] font-medium transition-colors duration-500">Equip OPAS to read channels, summarize threads, and auto-reply to team queries.</p>
                </div>

                {/* Discord Card */}
                <div className="bg-[var(--panel)] p-8 rounded-2xl border border-[var(--border)] relative overflow-hidden backdrop-blur-md cursor-not-allowed transition-colors duration-500">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#5865F2]"></div>
                    <div className="absolute top-8 right-8 text-[10px] font-bold uppercase tracking-widest bg-[var(--text-main)]/10 px-3 py-1.5 rounded text-[var(--text-main)]">Pending Update</div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-3 tracking-wide text-[var(--text-main)] transition-colors duration-500">
                        <i className="fa-brands fa-discord text-[#5865F2]"></i> Discord Sentinel
                    </h3>
                    <p className="text-[var(--text-muted)] font-medium transition-colors duration-500">Deploy OPAS to moderate servers and manage community queues autonomously.</p>
                </div>
            </form>
        </div>
    )
}
