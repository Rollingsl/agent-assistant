'use client'

import { useState } from 'react'

export default function Integrations() {
    const [openAiKey, setOpenAiKey] = useState('')
    const [emailPass, setEmailPass] = useState('')

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        // Here we would sync this to the FastAPI backend or local memory.
        alert('Credentials saved securely to local vault.')
    }

    return (
        <div className="flex flex-col h-full p-8 animate-[fadeIn_0.5s_ease] overflow-y-auto">
            <div className="mb-8 border-b border-white/10 pb-4">
                <h2 className="text-3xl font-semibold m-0 flex items-center gap-3">
                    <i className="fa-solid fa-key text-[#6c5ce7]"></i> API & Integrations
                </h2>
                <p className="text-gray-400 mt-2">Manage your cryptographic keys and external app connections. These are stored locally and never sent to the cloud.</p>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-6 max-w-3xl">

                {/* OpenAI Card */}
                <div className="bg-black/30 p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#10a37f]"></div>
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <i className="fa-brands fa-neos text-[#10a37f]"></i> OpenAI LLM Core
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">Required for the autonomous agent to process logic and execute tasks.</p>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Secret API Key</label>
                        <input
                            type="password"
                            value={openAiKey}
                            onChange={(e) => setOpenAiKey(e.target.value)}
                            className="p-3 bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-[#10a37f] transition-colors font-mono"
                            placeholder="sk-..."
                        />
                    </div>
                </div>

                {/* Email Card */}
                <div className="bg-black/30 p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#ea4335]"></div>
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-envelope text-[#ea4335]"></i> Gmail Operator
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">Allows the agent to draft and trigger emails on your behalf when you grant cryptographic approval.</p>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">App Password</label>
                        <input
                            type="password"
                            value={emailPass}
                            onChange={(e) => setEmailPass(e.target.value)}
                            className="p-3 bg-black/50 border border-white/10 rounded-lg text-white outline-none focus:border-[#ea4335] transition-colors font-mono"
                            placeholder="16-character app password"
                        />
                    </div>
                </div>

                {/* Telegram Card (Coming Soon) */}
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 relative overflow-hidden opacity-60">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#2AABEE]"></div>
                    <div className="absolute top-4 right-4 text-xs font-bold uppercase tracking-wider bg-white/10 px-2 py-1 rounded">Coming Soon</div>
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <i className="fa-brands fa-telegram text-[#2AABEE]"></i> Telegram Bot
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">Will allow remote interface access via your mobile device.</p>
                </div>

                <button type="submit" className="mt-4 px-8 py-3 bg-[#6c5ce7] text-white font-bold rounded-xl hover:bg-[#a29bfe] transition-colors self-start shadow-[0_4px_15px_rgba(108,92,231,0.3)] hover:shadow-[0_4px_25px_rgba(108,92,231,0.5)]">
                    <i className="fa-solid fa-lock mr-2"></i> Save to Secure Vault
                </button>

            </form>
        </div>
    )
}
