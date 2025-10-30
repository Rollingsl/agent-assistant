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
        <div className="flex flex-col h-full p-10 animate-[fadeIn_0.5s_ease] overflow-y-auto hide-scrollbar">
            <div className="mb-10 pb-6 border-b border-white/10 h-[120px] shrink-0">
                <h2 className="text-4xl font-bold m-0 flex items-center gap-4 tracking-wide">
                    <i className="fa-solid fa-key text-[#00f2fe] drop-shadow-[0_0_10px_rgba(0,242,254,0.6)]"></i>
                    API & Integrations
                </h2>
                <p className="text-gray-400 mt-4 text-lg">Manage your cryptographic keys and external app connections. These are stored locally and are never transmitted to external servers without explicit consent.</p>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-6 max-w-4xl pb-10">

                {/* OpenAI Card */}
                <div className="bg-black/40 p-8 rounded-2xl border border-white/5 relative overflow-hidden group shadow-lg">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#10a37f] to-[#0d8265]"></div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-3 tracking-wide">
                        <i className="fa-brands fa-neos text-[#10a37f]"></i> OpenAI LLM Core
                    </h3>
                    <p className="text-gray-400 mb-6 font-medium">Required for the OPAS inference engine to process advanced logical subroutines.</p>
                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] text-gray-500 uppercase font-bold tracking-widest pl-1">Secret API Key</label>
                        <input
                            type="password"
                            value={openAiKey}
                            onChange={(e) => setOpenAiKey(e.target.value)}
                            className="p-4 bg-black/60 border border-white/10 rounded-xl text-white outline-none focus:border-[#10a37f] transition-all font-mono"
                            placeholder="sk-..."
                        />
                    </div>
                </div>

                {/* Email Card */}
                <div className="bg-black/40 p-8 rounded-2xl border border-white/5 relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#ea4335] to-[#c5221f]"></div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-3 tracking-wide">
                        <i className="fa-solid fa-envelope text-[#ea4335]"></i> Gmail Operator
                    </h3>
                    <p className="text-gray-400 mb-6 font-medium">Permits the agent to orchestrate the drafting and issuing of emails upon HITL cryptographic approval.</p>
                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] text-gray-500 uppercase font-bold tracking-widest pl-1">App Password</label>
                        <input
                            type="password"
                            value={emailPass}
                            onChange={(e) => setEmailPass(e.target.value)}
                            className="p-4 bg-black/60 border border-white/10 rounded-xl text-white outline-none focus:border-[#ea4335] transition-all font-mono"
                            placeholder="16-character app password"
                        />
                    </div>
                </div>

                {/* Telegram Card (Coming Soon) */}
                <div className="bg-white/5 p-8 rounded-2xl border border-white/5 relative overflow-hidden opacity-50 backdrop-blur-md">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#2AABEE]"></div>
                    <div className="absolute top-6 right-6 text-[10px] font-bold uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded text-gray-300">Pending Integration</div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-3 tracking-wide">
                        <i className="fa-brands fa-telegram text-[#2AABEE]"></i> Telegram Bot
                    </h3>
                    <p className="text-gray-400 font-medium">Remote neural access to OPAS via your mobile device.</p>
                </div>

                <button type="submit" className="mt-6 px-10 py-4 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-black font-bold uppercase tracking-widest text-sm rounded transition-all self-start shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:shadow-[0_0_30px_rgba(0,242,254,0.6)] hover:scale-105">
                    <i className="fa-solid fa-lock mr-2 text-lg"></i> Sync to Vault
                </button>

            </form>
        </div>
    )
}
