'use client'

import { useEffect, useState } from 'react'

interface ConfigEntry {
    key: string
    label: string
    group: string
    is_secret: boolean
    placeholder: string
    source: 'env' | 'override' | 'unset'
    display: string
    is_set: boolean
}

const GROUP_META: Record<string, { icon: string; color: string; brand: string; desc: string }> = {
    LLM:      { icon: 'fa-solid fa-brain',        color: '#10b981', brand: '#10b981', desc: 'Core inference engine powering all reasoning and task generation.' },
    Email:    { icon: 'fa-brands fa-google',       color: '#ea4335', brand: '#ea4335', desc: 'Send and compose emails autonomously via Gmail, with HITL approval.' },
    Telegram: { icon: 'fa-brands fa-telegram',     color: '#2AABEE', brand: '#2AABEE', desc: 'Receive commands and dispatch notifications via Telegram bot.' },
    Slack:    { icon: 'fa-brands fa-slack',         color: '#E01E5A', brand: '#E01E5A', desc: 'Read channels, summarize threads, and auto-reply to team messages.' },
    Discord:  { icon: 'fa-brands fa-discord',      color: '#5865F2', brand: '#5865F2', desc: 'Deploy OPAS as a Discord bot to moderate and respond to server messages.' },
}

const ALL_GROUPS = ['LLM', 'Email', 'Telegram', 'Slack', 'Discord']

function SourceTag({ source }: { source: 'env' | 'override' | 'unset' }) {
    const cfg = {
        env:      { label: '.env',     color: 'var(--success)',  bg: 'rgba(var(--success-rgb),0.08)',  border: 'rgba(var(--success-rgb),0.2)' },
        override: { label: 'Override', color: 'var(--primary)',  bg: 'var(--accent)',                  border: 'rgba(var(--primary-rgb),0.25)' },
        unset:    { label: 'Not set',  color: 'var(--warning)',  bg: 'rgba(var(--warning-rgb),0.06)',  border: 'rgba(var(--warning-rgb),0.2)' },
    }[source]
    return (
        <span
            className="text-[8px] font-black uppercase tracking-[0.18em] px-1.5 py-0.5"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
            {cfg.label}
        </span>
    )
}

export default function Integrations() {
    const [config, setConfig]       = useState<ConfigEntry[]>([])
    const [overrides, setOverrides] = useState<Record<string, string>>({})
    const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({})
    const [saving, setSaving]       = useState(false)
    const [saved, setSaved]         = useState(false)
    const [loading, setLoading]     = useState(true)
    const [activeGroup, setActiveGroup] = useState<string>('LLM')

    useEffect(() => {
        fetch('/api/config')
            .then(r => r.json())
            .then(d => { setConfig(d.config || []); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const handleChange = (key: string, value: string) => {
        setOverrides(prev => ({ ...prev, [key]: value }))
    }

    const toggleVisible = (key: string) => {
        setVisibleKeys(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const handleSave = async (e?: React.FormEvent) => {
        e?.preventDefault()
        setSaving(true)
        try {
            const payload = Object.fromEntries(
                Object.entries(overrides).filter(([, v]) => v.trim() !== '')
            )
            if (Object.keys(payload).length > 0) {
                await fetch('/api/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ values: payload }),
                })
                const refreshed = await fetch('/api/config').then(r => r.json())
                setConfig(refreshed.config || [])
                setOverrides({})
            }
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } catch { /* silent */ } finally {
            setSaving(false)
        }
    }

    const byGroup = config.reduce<Record<string, ConfigEntry[]>>((acc, entry) => {
        acc[entry.group] = [...(acc[entry.group] || []), entry]
        return acc
    }, {})

    const pendingCount = Object.values(overrides).filter(v => v.trim()).length
    const activeEntries = byGroup[activeGroup] || []
    const activeMeta = GROUP_META[activeGroup]
    const allSet = activeEntries.length > 0 && activeEntries.every(e => e.is_set)
    const missing = activeEntries.filter(e => !e.is_set).length

    return (
        <div
            className="flex flex-col h-full overflow-hidden"
            style={{ animation: 'fadeIn 0.4s ease' }}
        >
            {/* ── Page Header ── */}
            <div
                className="shrink-0 flex items-center justify-between px-8 py-5 gap-4"
                style={{ borderBottom: '1px solid var(--border)', background: 'var(--panel)' }}
            >
                <div>
                    <h2
                        className="text-[18px] font-black tracking-tight flex items-center gap-3 m-0"
                        style={{ color: 'var(--text-main)' }}
                    >
                        <i className="fa-solid fa-plug text-[15px]" style={{ color: 'var(--primary)' }}></i>
                        Integrations
                    </h2>
                    <p className="text-[12px] mt-1 m-0 max-w-xl" style={{ color: 'var(--text-muted)' }}>
                        Credentials are loaded from your <code className="font-mono px-1 py-0.5 text-[11px]" style={{ color: 'var(--primary)', background: 'var(--accent)', border: '1px solid rgba(var(--primary-rgb),0.2)' }}>.env</code> file.
                        UI overrides apply to the current session only — secrets are never sent back to the browser.
                    </p>
                </div>

                <button
                    onClick={() => handleSave()}
                    disabled={saving || pendingCount === 0}
                    className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                        background: saved ? 'var(--success)' : 'var(--primary)',
                        color: 'var(--bg)',
                    }}
                    onMouseEnter={e => { if (pendingCount > 0 && !saving) (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                >
                    {saving
                        ? <><i className="fa-solid fa-spinner fa-spin text-[10px]"></i> Applying...</>
                        : saved
                            ? <><i className="fa-solid fa-check text-[10px]"></i> Applied!</>
                            : <><i className="fa-solid fa-upload text-[10px]"></i> Apply{pendingCount > 0 ? ` (${pendingCount})` : ''}</>
                    }
                </button>
            </div>

            {loading ? (
                <div className="flex-grow flex items-center justify-center gap-3" style={{ color: 'var(--text-muted)' }}>
                    <i className="fa-solid fa-spinner fa-spin text-xl" style={{ color: 'var(--primary)' }}></i>
                    <span className="text-[13px]">Loading configuration...</span>
                </div>
            ) : (
                <div className="flex-grow overflow-hidden flex">

                    {/* ── Group Tab Rail ── */}
                    <div
                        className="shrink-0 w-[200px] flex flex-col py-4 gap-1 overflow-y-auto hide-scrollbar"
                        style={{ borderRight: '1px solid var(--border)', background: 'var(--panel)' }}
                    >
                        <div className="px-4 pb-2 text-[8px] font-black uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                            Services
                        </div>
                        {ALL_GROUPS.map(g => {
                            const meta = GROUP_META[g]
                            const entries = byGroup[g] || []
                            const groupSet = entries.length > 0 && entries.every(e => e.is_set)
                            const groupMissing = entries.filter(e => !e.is_set).length
                            const isActive = activeGroup === g

                            return (
                                <button
                                    key={g}
                                    onClick={() => setActiveGroup(g)}
                                    className="flex items-center gap-3 px-4 py-3 text-left transition-all relative"
                                    style={{
                                        background: isActive ? 'var(--accent-hover)' : 'transparent',
                                        borderLeft: `2px solid ${isActive ? meta.color : 'transparent'}`,
                                        color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                                    }}
                                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; }}
                                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                >
                                    <i
                                        className={`${meta.icon} text-[13px] shrink-0`}
                                        style={{ color: isActive ? meta.color : 'var(--text-muted)', opacity: isActive ? 1 : 0.6 }}
                                    />
                                    <div className="flex flex-col leading-none gap-0.5">
                                        <span className="text-[12px] font-bold">{g}</span>
                                        {groupSet ? (
                                            <span className="text-[9px]" style={{ color: 'var(--success)', opacity: 0.8 }}>Configured</span>
                                        ) : groupMissing > 0 ? (
                                            <span className="text-[9px]" style={{ color: 'var(--warning)', opacity: 0.8 }}>{groupMissing} missing</span>
                                        ) : (
                                            <span className="text-[9px]" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>Not configured</span>
                                        )}
                                    </div>
                                    {/* Dot indicator */}
                                    <div
                                        className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                                        style={{
                                            background: groupSet ? 'var(--success)' : groupMissing > 0 ? 'var(--warning)' : 'var(--text-subtle)',
                                            opacity: 0.8,
                                        }}
                                    />
                                </button>
                            )
                        })}
                    </div>

                    {/* ── Group Detail Panel ── */}
                    <div className="flex-grow overflow-y-auto hide-scrollbar">
                        <form onSubmit={handleSave} className="flex flex-col">
                            {/* Group header */}
                            <div
                                className="px-8 py-6 flex items-center justify-between"
                                style={{
                                    borderBottom: '1px solid var(--border)',
                                    borderLeft: `3px solid ${activeMeta?.color}`,
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-10 h-10 flex items-center justify-center text-xl shrink-0"
                                        style={{
                                            background: `${activeMeta?.color}15`,
                                            border: `1px solid ${activeMeta?.color}30`,
                                            color: activeMeta?.color,
                                        }}
                                    >
                                        <i className={activeMeta?.icon}></i>
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-black m-0" style={{ color: 'var(--text-main)' }}>{activeGroup}</h3>
                                        <p className="text-[12px] m-0 mt-0.5 max-w-lg" style={{ color: 'var(--text-muted)' }}>{activeMeta?.desc}</p>
                                    </div>
                                </div>

                                <div className="shrink-0">
                                    {allSet ? (
                                        <span
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em]"
                                            style={{ color: 'var(--success)', background: 'rgba(var(--success-rgb),0.08)', border: '1px solid rgba(var(--success-rgb),0.2)' }}
                                        >
                                            <i className="fa-solid fa-circle-check"></i> Fully Configured
                                        </span>
                                    ) : missing > 0 ? (
                                        <span
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em]"
                                            style={{ color: 'var(--warning)', background: 'rgba(var(--warning-rgb),0.06)', border: '1px solid rgba(var(--warning-rgb),0.2)' }}
                                        >
                                            <i className="fa-solid fa-triangle-exclamation"></i> {missing} Key{missing !== 1 ? 's' : ''} Missing
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            {/* Fields */}
                            <div className="p-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {activeEntries.length === 0 ? (
                                    <div
                                        className="col-span-2 py-12 flex flex-col items-center justify-center gap-3"
                                        style={{ color: 'var(--text-muted)', opacity: 0.5 }}
                                    >
                                        <i className="fa-solid fa-sliders text-3xl"></i>
                                        <p className="text-[13px]">No settings for this group.</p>
                                    </div>
                                ) : (
                                    activeEntries.map(entry => {
                                        const hasOverride = !!overrides[entry.key]?.trim()
                                        const effectiveSource = hasOverride ? 'override' : entry.source
                                        const showAsText = entry.is_secret ? !!visibleKeys[entry.key] : true

                                        return (
                                            <div key={entry.key} className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <label
                                                        className="text-[10px] font-black uppercase tracking-[0.18em]"
                                                        style={{ color: 'var(--text-muted)' }}
                                                    >
                                                        {entry.label}
                                                        {entry.is_secret && (
                                                            <i className="fa-solid fa-lock text-[8px] ml-1.5 opacity-50"></i>
                                                        )}
                                                    </label>
                                                    <SourceTag source={effectiveSource} />
                                                </div>

                                                <div className="relative">
                                                    <input
                                                        type={showAsText ? 'text' : 'password'}
                                                        value={overrides[entry.key] ?? ''}
                                                        onChange={e => handleChange(entry.key, e.target.value)}
                                                        placeholder={entry.is_set ? entry.display : entry.placeholder}
                                                        autoComplete="off"
                                                        className="w-full px-4 py-3 text-[13px] font-mono outline-none transition-all"
                                                        style={{
                                                            background: 'var(--input-bg)',
                                                            border: `1px solid ${hasOverride ? 'rgba(var(--primary-rgb),0.4)' : 'var(--border)'}`,
                                                            color: 'var(--text-main)',
                                                            paddingRight: entry.is_secret ? '44px' : '16px',
                                                        }}
                                                        onFocus={e => (e.target as HTMLElement).style.borderColor = 'rgba(var(--primary-rgb), 0.45)'}
                                                        onBlur={e => (e.target as HTMLElement).style.borderColor = hasOverride ? 'rgba(var(--primary-rgb),0.4)' : 'var(--border)'}
                                                    />

                                                    {/* Secret toggle */}
                                                    {entry.is_secret && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleVisible(entry.key)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center transition-colors"
                                                            style={{ color: 'var(--text-muted)' }}
                                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-main)'}
                                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
                                                            title={visibleKeys[entry.key] ? 'Hide' : 'Reveal'}
                                                        >
                                                            <i className={`fa-solid ${visibleKeys[entry.key] ? 'fa-eye-slash' : 'fa-eye'} text-[11px]`}></i>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Hint text */}
                                                {entry.is_set && !hasOverride && (
                                                    <p className="text-[10px] m-0" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                                                        Set via <strong>{entry.source === 'env' ? '.env file' : 'UI override'}</strong>. Type a new value to override for this session.
                                                    </p>
                                                )}
                                                {hasOverride && (
                                                    <p className="text-[10px] m-0 flex items-center gap-1" style={{ color: 'var(--primary)', opacity: 0.8 }}>
                                                        <i className="fa-solid fa-circle-dot text-[8px]"></i>
                                                        Pending — click Apply to activate.
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
