'use client'

import { useEffect, useState } from 'react'

// Matches CONFIG_SCHEMA on the backend
interface ConfigEntry {
    key: string
    label: string
    group: string
    is_secret: boolean
    placeholder: string
    source: 'env' | 'override' | 'unset'
    display: string   // masked or plain value safe for display
    is_set: boolean
}

// Group metadata: icon, brand color, description
const GROUP_META: Record<string, { icon: string; color: string; desc: string }> = {
    LLM: { icon: 'fa-solid fa-brain', color: '#10a37f', desc: 'Core language model used by the OPAS inference engine for all reasoning and generation.' },
    Email: { icon: 'fa-brands fa-google', color: '#ea4335', desc: 'Allows OPAS to draft and dispatch emails on your behalf, subject to HITL approval.' },
    Telegram: { icon: 'fa-brands fa-telegram', color: '#2AABEE', desc: 'Remote Telegram bot access. OPAS can send notifications and receive commands from any device.' },
    Slack: { icon: 'fa-brands fa-slack', color: '#E01E5A', desc: 'Equip OPAS to read channels, summarize threads, and auto-reply to team queries.' },
    Discord: { icon: 'fa-brands fa-discord', color: '#5865F2', desc: 'Deploy OPAS as a Discord sentinel to receive commands and moderate servers autonomously.' },
}

const ALL_GROUPS = ['LLM', 'Email', 'Telegram', 'Slack', 'Discord']

function SourceBadge({ source }: { source: string }) {
    const styles = {
        env: 'text-[#10a37f] border-[#10a37f]/40 bg-[#10a37f]/10',
        override: 'text-[var(--primary)] border-[var(--primary)]/40 bg-[var(--accent)]',
        unset: 'text-[#f39c12] border-[#f39c12]/40 bg-[#f39c12]/10',
    }[source] ?? 'text-[var(--text-muted)] border-[var(--border)]'

    const label = { env: '● .env file', override: '● UI override', unset: '○ Not set' }[source] ?? source

    return (
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border ${styles}`}>
            {label}
        </span>
    )
}

export default function Integrations() {
    const [config, setConfig] = useState<ConfigEntry[]>([])
    const [overrides, setOverrides] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [loading, setLoading] = useState(true)

    // Load config from backend on mount
    useEffect(() => {
        fetch('/api/config')
            .then(r => r.json())
            .then(d => {
                setConfig(d.config || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const handleChange = (key: string, value: string) => {
        setOverrides(prev => ({ ...prev, [key]: value }))
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            // Only send keys that were actually typed (non-empty)
            const payload = Object.fromEntries(
                Object.entries(overrides).filter(([_, v]) => v.trim() !== '')
            )
            if (Object.keys(payload).length > 0) {
                await fetch('/api/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ values: payload })
                })
                // Refresh config to get updated sources/display values
                const refreshed = await fetch('/api/config').then(r => r.json())
                setConfig(refreshed.config || [])
                setOverrides({})  // Clear local overrides after save
            }
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } catch (e) { } finally {
            setSaving(false)
        }
    }

    // Group entries by group name
    const byGroup = config.reduce<Record<string, ConfigEntry[]>>((acc, entry) => {
        acc[entry.group] = [...(acc[entry.group] || []), entry]
        return acc
    }, {})

    return (
        <div className="flex flex-col flex-1 p-10 animate-[fadeIn_0.5s_ease] overflow-y-auto hide-scrollbar">

            {/* Page Header */}
            <div className="flex justify-between items-end mb-10 pb-6 border-b border-[var(--border)] shrink-0 transition-colors duration-500">
                <div>
                    <h2 className="text-4xl font-bold m-0 flex items-center gap-4 tracking-wide text-[var(--text-main)]">
                        <i className="fa-solid fa-server text-[var(--primary)]"></i>
                        Integrations & APIs
                    </h2>
                    <p className="text-[var(--text-muted)] mt-3 text-base max-w-3xl">
                        All credentials are read from your <code className="font-mono text-[var(--primary)] text-xs bg-[var(--accent)] px-1.5 py-0.5">.env</code> file at startup.
                        Values set here override the environment for the current session without modifying the file.
                        Secrets are never sent back to the browser.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || Object.keys(overrides).filter(k => overrides[k].trim()).length === 0}
                    className={`px-8 py-3.5 font-bold uppercase tracking-widest text-sm transition-all flex items-center gap-2 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${saved ? 'bg-[#10a37f] text-black' : 'bg-[var(--primary)] text-black hover:opacity-90'}`}
                >
                    {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Applying...</> :
                        saved ? <><i className="fa-solid fa-check"></i> Applied!</> :
                            <><i className="fa-solid fa-upload"></i> Apply Overrides</>}
                </button>
            </div>

            {loading && (
                <div className="flex items-center justify-center gap-3 text-[var(--text-muted)] mt-16">
                    <i className="fa-solid fa-spinner fa-spin text-[var(--primary)] text-xl"></i>
                    Loading configuration...
                </div>
            )}

            <form onSubmit={handleSave} className="flex flex-col gap-8 pb-10">

                {ALL_GROUPS.map(groupName => {
                    const meta = GROUP_META[groupName]
                    const entries = byGroup[groupName] || []
                    return (
                        <div key={groupName} className="border border-[var(--border)] border-l-4 transition-colors duration-500" style={{ borderLeftColor: meta.color }}>
                            <div className="px-8 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--panel)]">
                                <div className="flex items-center gap-4">
                                    <i className={`${meta.icon} text-2xl`} style={{ color: meta.color }}></i>
                                    <div>
                                        <h3 className="text-lg font-bold text-[var(--text-main)] m-0">{groupName}</h3>
                                        <p className="text-[var(--text-muted)] text-sm m-0 mt-0.5">{meta.desc}</p>
                                    </div>
                                </div>
                                {/* Group status summary */}
                                <div className="flex items-center gap-2">
                                    {entries.filter(e => e.is_set).length === entries.length && entries.length > 0 && (
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#10a37f] border border-[#10a37f]/40 bg-[#10a37f]/10 px-2 py-1">
                                            <i className="fa-solid fa-circle-check mr-1"></i> Configured
                                        </span>
                                    )}
                                    {entries.some(e => !e.is_set) && (
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#f39c12] border border-[#f39c12]/40 bg-[#f39c12]/10 px-2 py-1">
                                            <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                                            {entries.filter(e => !e.is_set).length} missing
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 grid grid-cols-1 xl:grid-cols-2 gap-6 bg-[var(--bg)]">
                                {entries.map(entry => {
                                    const hasOverride = overrides[entry.key]?.trim()
                                    return (
                                        <div key={entry.key} className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[11px] text-[var(--text-muted)] uppercase font-bold tracking-widest">
                                                    {entry.label}
                                                </label>
                                                <SourceBadge source={hasOverride ? 'override' : entry.source} />
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type={entry.is_secret ? 'password' : 'text'}
                                                    value={overrides[entry.key] ?? ''}
                                                    onChange={e => handleChange(entry.key, e.target.value)}
                                                    className="w-full p-4 bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-main)] outline-none font-mono text-sm transition-all focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]/50"
                                                    placeholder={
                                                        entry.is_set
                                                            ? entry.display
                                                            : entry.placeholder
                                                    }
                                                    autoComplete="off"
                                                />
                                                {entry.is_set && !overrides[entry.key] && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--text-muted)] font-mono pointer-events-none">
                                                        {entry.display}
                                                    </div>
                                                )}
                                            </div>
                                            {entry.is_set && !overrides[entry.key] && (
                                                <p className="text-[11px] text-[var(--text-muted)] pl-1">
                                                    Set via <strong>{entry.source === 'env' ? '.env file' : 'UI override'}</strong>. Type a new value to override.
                                                </p>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}

            </form>
        </div>
    )
}
