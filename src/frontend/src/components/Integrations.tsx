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

const GROUP_META: Record<string, { icon: string; color: string; desc: string }> = {
    LLM:      { icon: 'fa-solid fa-brain',        color: '#22c55e', desc: 'Core inference engine for all agent reasoning.' },
    Email:    { icon: 'fa-brands fa-google',       color: '#ea4335', desc: 'Send emails autonomously via Gmail SMTP.' },
    Telegram: { icon: 'fa-brands fa-telegram',     color: '#2AABEE', desc: 'Receive commands and dispatch via Telegram.' },
    Slack:    { icon: 'fa-brands fa-slack',         color: '#E01E5A', desc: 'Read channels and auto-reply in Slack.' },
    Discord:  { icon: 'fa-brands fa-discord',      color: '#5865F2', desc: 'Deploy OPAS as a Discord server bot.' },
}

const ALL_GROUPS = ['LLM', 'Email', 'Telegram', 'Slack', 'Discord']

export default function Integrations() {
    const [config, setConfig] = useState<ConfigEntry[]>([])
    const [overrides, setOverrides] = useState<Record<string, string>>({})
    const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({})
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [loading, setLoading] = useState(true)
    const [activeGroup, setActiveGroup] = useState<string>('LLM')

    useEffect(() => {
        fetch('/api/config')
            .then(r => r.json())
            .then(d => { setConfig(d.config || []); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const handleChange = (key: string, value: string) => setOverrides(prev => ({ ...prev, [key]: value }))
    const toggleVisible = (key: string) => setVisibleKeys(prev => ({ ...prev, [key]: !prev[key] }))

    const handleSave = async (e?: React.FormEvent) => {
        e?.preventDefault()
        setSaving(true)
        try {
            const payload = Object.fromEntries(Object.entries(overrides).filter(([, v]) => v.trim() !== ''))
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
        } catch { /* silent */ } finally { setSaving(false) }
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
        <div className="flex flex-col h-full overflow-hidden" style={{ animation: 'fadeIn 0.3s ease' }}>

            {/* Header */}
            <div className="shrink-0 px-8 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <div>
                    <h2 className="text-[16px] font-bold flex items-center gap-2.5 m-0" style={{ color: 'var(--text-main)' }}>
                        <i className="fa-solid fa-plug text-[14px]" style={{ color: 'var(--primary)' }}></i>
                        Integrations
                    </h2>
                    <p className="text-[12px] mt-0.5 m-0" style={{ color: 'var(--text-muted)' }}>
                        Configure service credentials. UI overrides apply to the current session only.
                    </p>
                </div>
                <button
                    onClick={() => handleSave()}
                    disabled={saving || pendingCount === 0}
                    className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                        borderRadius: 'var(--radius-md)',
                        background: saved ? 'var(--success)' : 'var(--primary)',
                        color: '#fff',
                        border: 'none',
                    }}
                >
                    {saving ? <><i className="fa-solid fa-spinner fa-spin text-[10px]"></i> Applying...</>
                        : saved ? <><i className="fa-solid fa-check text-[10px]"></i> Applied!</>
                            : <><i className="fa-solid fa-arrow-up text-[10px]"></i> Apply{pendingCount > 0 ? ` (${pendingCount})` : ''}</>}
                </button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center gap-3" style={{ color: 'var(--text-muted)' }}>
                    <i className="fa-solid fa-spinner fa-spin text-lg" style={{ color: 'var(--primary)' }}></i>
                    <span className="text-[13px]">Loading...</span>
                </div>
            ) : (
                <div className="flex-1 overflow-hidden flex justify-center">
                  <div className="flex w-full max-w-5xl">

                    {/* Service tabs */}
                    <div className="shrink-0 w-[190px] py-3 overflow-y-auto hide-scrollbar" style={{ borderRight: '1px solid var(--border)' }}>
                        {ALL_GROUPS.map(g => {
                            const meta = GROUP_META[g]
                            const entries = byGroup[g] || []
                            const groupSet = entries.length > 0 && entries.every(e => e.is_set)
                            const isActive = activeGroup === g

                            return (
                                <button
                                    key={g}
                                    onClick={() => setActiveGroup(g)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200"
                                    style={{
                                        borderRadius: 0,
                                        background: isActive ? 'var(--accent-hover)' : 'transparent',
                                        borderLeft: `2px solid ${isActive ? meta.color : 'transparent'}`,
                                        color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                                    }}
                                    onMouseEnter={e => { if (!isActive) (e.currentTarget).style.background = 'var(--accent)' }}
                                    onMouseLeave={e => { if (!isActive) (e.currentTarget).style.background = 'transparent' }}
                                >
                                    <i className={`${meta.icon} text-[14px]`} style={{ color: isActive ? meta.color : 'var(--text-muted)', opacity: isActive ? 1 : 0.5 }} />
                                    <div className="flex flex-col leading-none gap-0.5">
                                        <span className="text-[12px] font-semibold">{g}</span>
                                        <span className="text-[9px]" style={{ color: groupSet ? 'var(--success)' : 'var(--text-subtle)' }}>
                                            {groupSet ? 'Connected' : 'Not set'}
                                        </span>
                                    </div>
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: groupSet ? 'var(--success)' : 'var(--text-subtle)', opacity: 0.7 }} />
                                </button>
                            )
                        })}
                    </div>

                    {/* Config panel */}
                    <div className="flex-1 overflow-y-auto hide-scrollbar">
                        <form onSubmit={handleSave} className="flex flex-col">

                            {/* Group header */}
                            <div className="px-8 py-5 flex items-center gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
                                <div
                                    className="w-10 h-10 flex items-center justify-center shrink-0"
                                    style={{
                                        borderRadius: 'var(--radius-lg)',
                                        background: `${activeMeta?.color}14`,
                                        color: activeMeta?.color,
                                    }}
                                >
                                    <i className={`${activeMeta?.icon} text-[16px]`}></i>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-[15px] font-bold m-0" style={{ color: 'var(--text-main)' }}>{activeGroup}</h3>
                                    <p className="text-[12px] m-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>{activeMeta?.desc}</p>
                                </div>
                                {allSet ? (
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold" style={{ borderRadius: 'var(--radius-sm)', color: 'var(--success)', background: 'rgba(var(--success-rgb),0.08)' }}>
                                        <i className="fa-solid fa-circle-check text-[9px]"></i> Connected
                                    </span>
                                ) : missing > 0 ? (
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold" style={{ borderRadius: 'var(--radius-sm)', color: 'var(--warning)', background: 'rgba(var(--warning-rgb),0.06)' }}>
                                        <i className="fa-solid fa-triangle-exclamation text-[9px]"></i> {missing} missing
                                    </span>
                                ) : null}
                            </div>

                            {/* Fields */}
                            <div className="p-8 flex flex-col gap-5">
                                {activeEntries.map(entry => {
                                    const hasOverride = !!overrides[entry.key]?.trim()
                                    const showAsText = entry.is_secret ? !!visibleKeys[entry.key] : true
                                    const sourceColor = entry.source === 'env' ? 'var(--success)' : entry.source === 'override' ? 'var(--primary)' : 'var(--warning)'

                                    return (
                                        <div key={entry.key} className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                                                    {entry.label}
                                                    {entry.is_secret && <i className="fa-solid fa-lock text-[8px]" style={{ opacity: 0.4 }}></i>}
                                                </label>
                                                <span
                                                    className="text-[9px] font-semibold px-1.5 py-0.5"
                                                    style={{
                                                        borderRadius: 'var(--radius-sm)',
                                                        color: hasOverride ? 'var(--primary)' : sourceColor,
                                                        background: hasOverride ? 'var(--accent)' : `${sourceColor}12`,
                                                    }}
                                                >
                                                    {hasOverride ? 'Pending' : entry.source === 'env' ? '.env' : entry.source === 'override' ? 'Override' : 'Not set'}
                                                </span>
                                            </div>

                                            <div className="relative">
                                                <input
                                                    type={showAsText ? 'text' : 'password'}
                                                    value={overrides[entry.key] ?? ''}
                                                    onChange={e => handleChange(entry.key, e.target.value)}
                                                    placeholder={entry.is_set ? entry.display : entry.placeholder}
                                                    autoComplete="off"
                                                    className="w-full px-4 py-2.5 text-[13px] font-mono outline-none transition-all"
                                                    style={{
                                                        borderRadius: 'var(--radius-md)',
                                                        background: 'var(--input-bg)',
                                                        border: `1px solid ${hasOverride ? 'rgba(var(--primary-rgb),0.3)' : 'var(--border)'}`,
                                                        color: 'var(--text-main)',
                                                        paddingRight: entry.is_secret ? '44px' : '16px',
                                                    }}
                                                    onFocus={e => { (e.target).style.borderColor = 'rgba(var(--primary-rgb), 0.4)'; (e.target).style.background = 'var(--input-bg-focus)' }}
                                                    onBlur={e => { (e.target).style.borderColor = hasOverride ? 'rgba(var(--primary-rgb),0.3)' : 'var(--border)'; (e.target).style.background = 'var(--input-bg)' }}
                                                />
                                                {entry.is_secret && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleVisible(entry.key)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center transition-colors"
                                                        style={{ color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)' }}
                                                        onMouseEnter={e => (e.currentTarget).style.color = 'var(--text-main)'}
                                                        onMouseLeave={e => (e.currentTarget).style.color = 'var(--text-muted)'}
                                                    >
                                                        <i className={`fa-solid ${visibleKeys[entry.key] ? 'fa-eye-slash' : 'fa-eye'} text-[11px]`}></i>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </form>
                    </div>
                  </div>
                </div>
            )}
        </div>
    )
}
