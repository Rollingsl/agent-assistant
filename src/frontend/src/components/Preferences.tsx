'use client'

import { useEffect, useState } from 'react'

interface PrefsData {
    full_name: string
    email: string
    language: string
    company_name: string
    industry: string
    tone: string
    target_audience: string
    custom_instructions: string
}

const DEFAULTS: PrefsData = {
    full_name: '',
    email: '',
    language: 'English',
    company_name: '',
    industry: '',
    tone: 'professional',
    target_audience: '',
    custom_instructions: '',
}

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Portuguese', 'Arabic', 'Korean']
const TONES = ['professional', 'casual', 'friendly', 'formal', 'creative']

export default function Preferences() {
    const [prefs, setPrefs] = useState<PrefsData>(DEFAULTS)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/preferences')
            .then(r => r.json())
            .then(d => {
                setPrefs({ ...DEFAULTS, ...d })
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const handleChange = (key: keyof PrefsData, value: string) => {
        setPrefs(prev => ({ ...prev, [key]: value }))
        setSaved(false)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await fetch('/api/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prefs),
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } catch { /* silent */ }
        finally { setSaving(false) }
    }

    const inputStyle = {
        borderRadius: 'var(--radius-md)',
        background: 'var(--input-bg)',
        border: '1px solid var(--border)',
        color: 'var(--text-main)',
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        e.target.style.borderColor = 'rgba(var(--primary-rgb), 0.4)'
        e.target.style.background = 'var(--input-bg-focus)'
    }
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        e.target.style.borderColor = 'var(--border)'
        e.target.style.background = 'var(--input-bg)'
    }

    return (
        <div className="flex flex-col h-full overflow-hidden" style={{ animation: 'fadeIn 0.3s ease' }}>

            {/* Header */}
            <div className="shrink-0 px-8 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <div>
                    <h2 className="text-[16px] font-bold flex items-center gap-2.5 m-0" style={{ color: 'var(--text-main)' }}>
                        <i className="fa-solid fa-user-gear text-[14px]" style={{ color: 'var(--primary)' }}></i>
                        Profile
                    </h2>
                    <p className="text-[12px] mt-0.5 m-0" style={{ color: 'var(--text-muted)' }}>
                        Personalize OPAS output — preferences are injected into every prompt and pipeline.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                        borderRadius: 'var(--radius-md)',
                        background: saved ? 'var(--success)' : 'var(--primary)',
                        color: '#fff',
                        border: 'none',
                    }}
                >
                    {saving ? <><i className="fa-solid fa-spinner fa-spin text-[10px]"></i> Saving...</>
                        : saved ? <><i className="fa-solid fa-check text-[10px]"></i> Saved!</>
                            : <><i className="fa-solid fa-arrow-up text-[10px]"></i> Save</>}
                </button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center gap-3" style={{ color: 'var(--text-muted)' }}>
                    <i className="fa-solid fa-spinner fa-spin text-lg" style={{ color: 'var(--primary)' }}></i>
                    <span className="text-[13px]">Loading...</span>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto hide-scrollbar">
                    <div className="max-w-5xl mx-auto px-8 py-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                            {/* ── Left Column: Identity ── */}
                            <div
                                className="flex flex-col gap-5 p-6"
                                style={{
                                    borderRadius: 'var(--radius-lg)',
                                    background: 'var(--panel)',
                                    border: '1px solid var(--border)',
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-9 h-9 flex items-center justify-center shrink-0"
                                        style={{ borderRadius: 'var(--radius-lg)', background: 'rgba(var(--primary-rgb), 0.08)', color: 'var(--primary)' }}
                                    >
                                        <i className="fa-solid fa-id-card text-[14px]"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-[14px] font-bold m-0" style={{ color: 'var(--text-main)' }}>Identity</h3>
                                        <p className="text-[11px] m-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>Greetings, report headers, email signatures.</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                                    <input
                                        type="text"
                                        value={prefs.full_name}
                                        onChange={e => handleChange('full_name', e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-2.5 text-[13px] outline-none transition-all"
                                        style={inputStyle}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Email</label>
                                    <input
                                        type="email"
                                        value={prefs.email}
                                        onChange={e => handleChange('email', e.target.value)}
                                        placeholder="john@acmecorp.com"
                                        className="w-full px-4 py-2.5 text-[13px] outline-none transition-all"
                                        style={inputStyle}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Company Name</label>
                                    <input
                                        type="text"
                                        value={prefs.company_name}
                                        onChange={e => handleChange('company_name', e.target.value)}
                                        placeholder="Acme Corp"
                                        className="w-full px-4 py-2.5 text-[13px] outline-none transition-all"
                                        style={inputStyle}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Industry</label>
                                    <input
                                        type="text"
                                        value={prefs.industry}
                                        onChange={e => handleChange('industry', e.target.value)}
                                        placeholder="e.g. SaaS / B2B, Healthcare, Fintech"
                                        className="w-full px-4 py-2.5 text-[13px] outline-none transition-all"
                                        style={inputStyle}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                    />
                                </div>
                            </div>

                            {/* ── Right Column: Work Preferences ── */}
                            <div
                                className="flex flex-col gap-5 p-6"
                                style={{
                                    borderRadius: 'var(--radius-lg)',
                                    background: 'var(--panel)',
                                    border: '1px solid var(--border)',
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-9 h-9 flex items-center justify-center shrink-0"
                                        style={{ borderRadius: 'var(--radius-lg)', background: 'rgba(var(--primary-rgb), 0.08)', color: 'var(--primary)' }}
                                    >
                                        <i className="fa-solid fa-sliders text-[14px]"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-[14px] font-bold m-0" style={{ color: 'var(--text-main)' }}>Work Preferences</h3>
                                        <p className="text-[11px] m-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>Language, tone, and context for all output.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Language</label>
                                        <select
                                            value={prefs.language}
                                            onChange={e => handleChange('language', e.target.value)}
                                            className="w-full px-4 py-2.5 text-[13px] outline-none transition-all"
                                            style={inputStyle}
                                            onFocus={handleFocus}
                                            onBlur={handleBlur}
                                        >
                                            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Tone</label>
                                        <select
                                            value={prefs.tone}
                                            onChange={e => handleChange('tone', e.target.value)}
                                            className="w-full px-4 py-2.5 text-[13px] outline-none transition-all capitalize"
                                            style={inputStyle}
                                            onFocus={handleFocus}
                                            onBlur={handleBlur}
                                        >
                                            {TONES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Target Audience</label>
                                    <input
                                        type="text"
                                        value={prefs.target_audience}
                                        onChange={e => handleChange('target_audience', e.target.value)}
                                        placeholder="e.g. Enterprise CTOs, Small business owners"
                                        className="w-full px-4 py-2.5 text-[13px] outline-none transition-all"
                                        style={inputStyle}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Custom Instructions</label>
                                    <textarea
                                        value={prefs.custom_instructions}
                                        onChange={e => handleChange('custom_instructions', e.target.value)}
                                        placeholder="e.g. Always include data citations. Avoid jargon. Use metric units."
                                        rows={4}
                                        className="w-full px-4 py-2.5 text-[13px] outline-none transition-all resize-none leading-relaxed"
                                        style={inputStyle}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
