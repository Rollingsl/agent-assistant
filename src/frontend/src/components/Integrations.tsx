'use client'

import { useEffect, useState } from 'react'

export default function Integrations() {
    const [openAiKey, setOpenAiKey] = useState('')
    const [emailPass, setEmailPass] = useState('')
    const [keyStatus, setKeyStatus] = useState<{ has_key: boolean; source: string } | null>(null)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    // On mount, check if a key is already configured in the backend (.env)
    useEffect(() => {
        fetch('/api/config/openai')
            .then(r => r.json())
            .then(d => setKeyStatus(d))
            .catch(() => { })
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            if (openAiKey.trim()) {
                await fetch('/api/config/openai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ api_key: openAiKey })
                })
                setKeyStatus({ has_key: true, source: 'override' })
            }
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (e) { } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col flex-1 p-10 animate-[fadeIn_0.5s_ease] overflow-y-auto hide-scrollbar">
            <div className="flex justify-between items-end mb-10 pb-6 border-b border-[var(--border)] shrink-0 transition-colors duration-500">
                <div>
                    <h2 className="text-4xl font-bold m-0 flex items-center gap-4 tracking-wide text-[var(--text-main)] transition-colors duration-500">
                        <i className="fa-solid fa-server text-[var(--primary)] transition-all duration-500"></i>
                        Integrations & APIs
                    </h2>
                    <p className="text-[var(--text-muted)] mt-4 text-lg max-w-3xl transition-colors duration-500">Manage your cryptographic keys and external app connections. Keys are stored locally inside your vault and never transmitted externally without explicit consent.</p>

                    {/* Key status badge */}
                    {keyStatus && (
                        <div className={`mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 border ${keyStatus.has_key ? 'text-[#10a37f] border-[#10a37f]/40 bg-[#10a37f]/10' : 'text-[#f39c12] border-[#f39c12]/40 bg-[#f39c12]/10'}`}>
                            <i className={`fa-solid ${keyStatus.has_key ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                            {keyStatus.has_key
                                ? `OpenAI key active · source: ${keyStatus.source === 'override' ? 'UI override' : '.env file'}`
                                : 'No OpenAI key configured — add one below or in your .env file'}
                        </div>
                    )}
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-8 py-3.5 font-bold uppercase tracking-widest text-sm transition-all flex items-center gap-2 ${saved ? 'bg-[#10a37f] text-black' : 'bg-[var(--primary)] text-black hover:opacity-90 hover:scale-[1.02]'}`}
                >
                    {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving...</> :
                        saved ? <><i className="fa-solid fa-check"></i> Synced!</> :
                            <><i className="fa-solid fa-lock text-lg"></i> Sync to Vault</>}
                </button>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-10">

                {/* OpenAI Card */}
                <div className="bg-[var(--panel)] p-8 border border-[var(--border)] border-l-4 border-l-[#10a37f] relative overflow-hidden group flex flex-col justify-between transition-colors duration-500">
                    <div>
                        <h3 className="text-2xl font-bold mb-2 flex items-center gap-3 tracking-wide text-[var(--text-main)] transition-colors duration-500">
                            <i className="fa-brands fa-neos text-[#10a37f]"></i> OpenAI LLM Core
                        </h3>
                        <p className="text-[var(--text-muted)] mb-6 font-medium leading-relaxed transition-colors duration-500">Required for the OPAS inference engine to process advanced logical subroutines and parsing. The key in your <code className="font-mono text-[var(--primary)] text-xs bg-[var(--accent)] px-1">.env</code> file is used by default; paste a key below to override it for this session.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] text-[var(--text-muted)] uppercase font-bold tracking-widest pl-1">
                            Override Key <span className="normal-case font-normal">(leave blank to use .env)</span>
                        </label>
                        <input
                            type="password"
                            value={openAiKey}
                            onChange={(e) => setOpenAiKey(e.target.value)}
                            className="p-4 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-main)] outline-none focus:border-[#10a37f] transition-all font-mono"
                            placeholder="sk-... (optional override)"
                        />
                    </div>
                </div>

                {/* Email Card */}
                <div className="bg-[var(--panel)] p-8 border border-[var(--border)] border-l-4 border-l-[#ea4335] relative overflow-hidden flex flex-col justify-between transition-colors duration-500">
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
                            className="p-4 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-main)] outline-none focus:border-[#ea4335] transition-all font-mono"
                            placeholder="16-character app password"
                        />
                    </div>
                </div>

                {/* Telegram Card */}
                <div className="bg-[var(--panel)] p-8 border border-[var(--border)] border-l-4 border-l-[#2AABEE] relative overflow-hidden cursor-not-allowed opacity-60 transition-colors duration-500">
                    <div className="absolute top-8 right-8 text-[10px] font-bold uppercase tracking-widest bg-[var(--text-main)]/10 px-3 py-1.5 text-[var(--text-main)]">Pending Update</div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-3 tracking-wide text-[var(--text-main)] transition-colors duration-500">
                        <i className="fa-brands fa-telegram text-[#2AABEE]"></i> Telegram Bot
                    </h3>
                    <p className="text-[var(--text-muted)] font-medium transition-colors duration-500">Remote neural access to OPAS via your mobile device.</p>
                </div>

                {/* Slack Card */}
                <div className="bg-[var(--panel)] p-8 border border-[var(--border)] border-l-4 border-l-[#E01E5A] relative overflow-hidden cursor-not-allowed opacity-60 transition-colors duration-500">
                    <div className="absolute top-8 right-8 text-[10px] font-bold uppercase tracking-widest bg-[var(--text-main)]/10 px-3 py-1.5 text-[var(--text-main)]">Pending Update</div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-3 tracking-wide text-[var(--text-main)] transition-colors duration-500">
                        <i className="fa-brands fa-slack text-[#E01E5A]"></i> Slack Integration
                    </h3>
                    <p className="text-[var(--text-muted)] font-medium transition-colors duration-500">Equip OPAS to read channels, summarize threads, and auto-reply to team queries.</p>
                </div>

                {/* Discord Card */}
                <div className="bg-[var(--panel)] p-8 border border-[var(--border)] border-l-4 border-l-[#5865F2] relative overflow-hidden cursor-not-allowed opacity-60 transition-colors duration-500">
                    <div className="absolute top-8 right-8 text-[10px] font-bold uppercase tracking-widest bg-[var(--text-main)]/10 px-3 py-1.5 text-[var(--text-main)]">Pending Update</div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-3 tracking-wide text-[var(--text-main)] transition-colors duration-500">
                        <i className="fa-brands fa-discord text-[#5865F2]"></i> Discord Sentinel
                    </h3>
                    <p className="text-[var(--text-muted)] font-medium transition-colors duration-500">Deploy OPAS to moderate servers and manage community queues autonomously.</p>
                </div>
            </form>
        </div>
    )
}
