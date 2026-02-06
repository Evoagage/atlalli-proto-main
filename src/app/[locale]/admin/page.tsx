'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    ShieldCheck,
    PlusCircle,
    User,
    ChevronLeft,
    Beer,
    Database,
    CheckCircle,
    XCircle,
    Clock,
    Edit,
    Trash2,
    RotateCcw,
    Filter,
    ArrowRight,
    Search,
    Factory,
    MoreHorizontal,
    ChevronDown,
    Save,
    FileText,
    Calendar,
    DollarSign,
    MapPin as MapPinIcon,
    Download
} from 'lucide-react';
import { getEffectiveRole, canAccess } from '@/utils/auth';
import bjcpData from '@/data/bjcp_dictionary.json';
import locationsData from '@/data/locations.json';
import systemConfig from '@/data/system_config.json';
import couponsData from '@/data/coupons.json';

export default function AdminPage() {
    const t = useTranslations();
    const locale = useLocale();
    const router = useRouter();
    const {
        session,
        currentLocation,
        suggestedBeers,
        masterCatalog,
        breweries,
        redemptionRecords, // Added
        approveSuggestion,
        rejectSuggestion,
        upsertBeer,
        deleteBeer,
        restoreBeer,
        upsertBrewery,
        deleteBrewery
    } = useStore();
    const [mounted, setMounted] = useState(false);
    const effectiveRole = getEffectiveRole(session, currentLocation);

    // Filters
    const [sourceFilter, setSourceFilter] = useState<'all' | 'suggestions' | 'catalog'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'deleted'>('all');

    // Modals
    const [mappingModal, setMappingModal] = useState<{ open: boolean, type: 'approve' | 'edit' | 'add', data: any }>({ open: false, type: 'approve', data: null });
    const [rejectionModal, setRejectionModal] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });
    const [breweryModal, setBreweryModal] = useState<{ open: boolean, editing: any }>({ open: false, editing: null });
    const [reportModal, setReportModal] = useState<{ open: boolean, locationId: string, month: string }>({ open: false, locationId: '', month: new Date().toISOString().slice(0, 7) });

    // Form States
    const [adminNote, setAdminNote] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('');
    const [overrideVector, setOverrideVector] = useState<any>({});
    const [enableOverrides, setEnableOverrides] = useState(false);

    // Beer Form
    const [formBeerName, setFormBeerName] = useState('');
    const [formBrewery, setFormBrewery] = useState('');

    // Brewery Form
    const [breweryName, setBreweryName] = useState('');
    const [breweryLocation, setBreweryLocation] = useState('');

    useEffect(() => {
        setMounted(true);
        if (mounted && effectiveRole !== 'super_admin') {
            router.push(`/${locale}`);
        }
    }, [mounted, effectiveRole, locale, router]);

    if (!mounted || effectiveRole !== 'super_admin') return null;

    // Combine Data
    const suggestions = suggestedBeers.filter(s => s.status === 'pending');
    const catalogItems = Object.values(masterCatalog);

    let displayList: any[] = [];
    if (sourceFilter === 'all' || sourceFilter === 'suggestions') {
        displayList = [...displayList, ...suggestions.map(s => ({ ...s, isSuggestion: true }))];
    }
    if (sourceFilter === 'all' || sourceFilter === 'catalog') {
        displayList = [...displayList, ...catalogItems.map(c => ({ ...c, isSuggestion: false }))];
    }

    // Apply Status Filter
    if (statusFilter === 'pending') {
        displayList = displayList.filter(item => item.isSuggestion);
    } else if (statusFilter === 'deleted') {
        displayList = displayList.filter(item => item.isDeleted);
    } else {
        // 'all' status: show everything NOT deleted
        displayList = displayList.filter(item => !item.isDeleted);
    }

    const handleApproveClick = (suggestion: any) => {
        setMappingModal({ open: true, type: 'approve', data: suggestion });
        setFormBeerName(suggestion.beerName);
        setFormBrewery(suggestion.brewery);
        setSelectedStyle(suggestion.style_ref || '');
        setOverrideVector({});
        setEnableOverrides(false);
        setAdminNote('');
    };

    const handleEditClick = (beer: any) => {
        setMappingModal({ open: true, type: 'edit', data: beer });
        setFormBeerName(beer.brand_name);
        setFormBrewery(beer.brewery);
        setSelectedStyle(beer.style_ref || '');
        setOverrideVector(beer.override_vector || {});
        setEnableOverrides(!!beer.override_vector);
        setAdminNote('');
    };

    const handleAddBeerClick = () => {
        setMappingModal({ open: true, type: 'add', data: null });
        setFormBeerName('');
        setFormBrewery('');
        setSelectedStyle('');
        setOverrideVector({});
        setEnableOverrides(false);
        setAdminNote('');
    };

    const submitApproval = () => {
        if (!mappingModal.data) return;
        approveSuggestion(mappingModal.data.id, {
            style_ref: selectedStyle,
            override_vector: enableOverrides && Object.keys(overrideVector).length > 0 ? overrideVector : undefined
        }, adminNote);
        // Also update brand/brewery if changed during approval? 
        // The approveSuggestion action currently uses values from the suggestion. 
        // I should probably update the action to accept brand/brewery as well if edited.
        setMappingModal({ open: false, type: 'approve', data: null });
    };

    const submitEdit = () => {
        const beerId = mappingModal.type === 'add'
            ? `${formBrewery.toLowerCase().replace(/\s+/g, '_')}_${formBeerName.toLowerCase().replace(/\s+/g, '_')}`
            : mappingModal.data.id;

        upsertBeer({
            id: beerId,
            brand_name: formBeerName,
            brewery: formBrewery,
            style_ref: selectedStyle,
            override_vector: enableOverrides && Object.keys(overrideVector).length > 0 ? overrideVector : undefined,
            isDeleted: mappingModal.data?.isDeleted || false
        });
        setMappingModal({ open: false, type: 'edit', data: null });
    };

    const handleBreweryEdit = (brewery: any = null) => {
        setBreweryModal({ open: true, editing: brewery });
        setBreweryName(brewery?.name || '');
        setBreweryLocation(brewery?.location || '');
    };

    const submitBrewery = () => {
        const id = breweryModal.editing?.id || breweryName.toLowerCase().replace(/\s+/g, '_');
        upsertBrewery({ id, name: breweryName, location: breweryLocation });
        setBreweryModal({ open: false, editing: null });
    };

    return (
        <main className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] p-6 pt-24 pb-32 transition-colors duration-300">
            <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
                <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div className="space-y-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center space-x-2 text-white/40 hover:text-liquid-gold transition-colors text-[10px] uppercase tracking-[0.2em]"
                        >
                            <ChevronLeft size={14} />
                            <span>{t('common.back')}</span>
                        </button>
                        <div>
                            <div className="flex items-center space-x-3 text-liquid-gold mb-2">
                                <ShieldCheck size={24} />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Internal Security Level A</span>
                            </div>
                            <h1 className="text-4xl font-heading text-bone-white uppercase tracking-[0.2em]">Master Catalog Admin</h1>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleAddBeerClick}
                            className="glass-card px-6 py-5 flex items-center space-x-3 border-agave-blue/20 hover:border-agave-blue/50 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-full bg-agave-blue/10 flex items-center justify-center group-hover:bg-agave-blue group-hover:text-white transition-colors">
                                <PlusCircle size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] uppercase tracking-widest text-bone-white/40 mb-1">New Entry</p>
                                <p className="text-sm font-heading text-bone-white leading-none">Add Beer</p>
                            </div>
                        </button>

                        <button
                            onClick={() => handleBreweryEdit()}
                            className="glass-card px-6 py-5 flex items-center space-x-3 border-liquid-gold/20 hover:border-liquid-gold/50 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-full bg-liquid-gold/10 flex items-center justify-center group-hover:bg-liquid-gold group-hover:text-obsidian-night transition-colors">
                                <Factory size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] uppercase tracking-widest text-bone-white/40 mb-1">Catalog</p>
                                <p className="text-sm font-heading text-bone-white leading-none">Breweries</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setReportModal({ open: true, locationId: '', month: new Date().toISOString().slice(0, 7) })}
                            className="glass-card px-6 py-5 flex items-center space-x-3 border-emerald-500/20 hover:border-emerald-500/50 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-obsidian-night transition-colors">
                                <DollarSign size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] uppercase tracking-widest text-bone-white/40 mb-1">Reports</p>
                                <p className="text-sm font-heading text-bone-white leading-none">Financials</p>
                            </div>
                        </button>

                        <div className="glass-card px-8 py-5 flex items-center space-x-5 border-white/5 bg-white/[0.02]">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                <Database className="text-white/20" size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-bone-white/40 mb-1">Global Catalog</p>
                                <p className="text-xl font-heading text-bone-white leading-none">{Object.keys(masterCatalog).length} Items</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                    <div className="flex gap-4 items-center">
                        <p className="text-[10px] uppercase tracking-widest text-white/40"><Filter size={12} className="inline mr-2" /> Source:</p>
                        <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                            {(['all', 'catalog', 'suggestions'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setSourceFilter(f)}
                                    className={`px-4 py-1.5 text-[10px] uppercase tracking-widest font-black transition-all rounded-md ${sourceFilter === f ? 'bg-liquid-gold text-obsidian-night shadow-lg' : 'text-white/40 hover:text-white'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 items-center">
                        <p className="text-[10px] uppercase tracking-widest text-white/40">Status:</p>
                        <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                            {(['all', 'pending', 'deleted'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setStatusFilter(f)}
                                    className={`px-4 py-1.5 text-[10px] uppercase tracking-widest font-black transition-all rounded-md ${statusFilter === f ? 'bg-agave-blue text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Unified List */}
                <section className="space-y-6">
                    <div className="glass-card overflow-hidden border-white/5 bg-black/20 shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.03] border-b border-white/5">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] uppercase tracking-[0.3em] text-bone-white/40">State</th>
                                        <th className="px-8 py-5 text-[10px] uppercase tracking-[0.3em] text-bone-white/40">Beer / Brewery</th>
                                        <th className="px-8 py-5 text-[10px] uppercase tracking-[0.3em] text-bone-white/40">Style Ref</th>
                                        <th className="px-8 py-5 text-[10px] uppercase tracking-[0.3em] text-bone-white/40 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {displayList.map((item) => (
                                        <tr key={item.id} className={`hover:bg-white/[0.01] transition-colors ${item.isDeleted ? 'opacity-40 grayscale text-red-400' : ''}`}>
                                            <td className="px-8 py-5">
                                                {item.isSuggestion ? (
                                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded bg-agave-blue/10 text-agave-blue border border-agave-blue/20">Suggestion</span>
                                                ) : item.isDeleted ? (
                                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded bg-red-500/10 text-red-500 border border-red-500/20">Deleted</span>
                                                ) : (
                                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded bg-green-500/10 text-green-500 border border-green-500/20">Verified</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm text-bone-white font-medium uppercase tracking-wider">{item.beerName || item.brand_name}</p>
                                                <p className="text-[10px] text-bone-white/40 uppercase tracking-widest font-black">{item.brewery}</p>
                                            </td>
                                            <td className="px-8 py-5 font-mono text-xs text-bone-white/60">
                                                {item.style_ref || (item.isSuggestion ? <span className="italic opacity-30">Unmapped</span> : 'N/A')}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end space-x-2">
                                                    {item.isSuggestion ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproveClick(item)}
                                                                className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-all"
                                                            >
                                                                <CheckCircle size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => setRejectionModal({ open: true, id: item.id })}
                                                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        </>
                                                    ) : item.isDeleted ? (
                                                        <button
                                                            onClick={() => restoreBeer(item.id)}
                                                            className="p-2 bg-liquid-gold/10 text-liquid-gold hover:bg-liquid-gold hover:text-obsidian-night rounded-lg transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4"
                                                        >
                                                            <RotateCcw size={14} /> Restore
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditClick(item)}
                                                                className="p-2 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white rounded-lg transition-all"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteBeer(item.id)}
                                                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {displayList.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center text-bone-white/20 italic uppercase tracking-widest text-xs">
                                                No items found matching the selected filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Mapping/Edit/Add Modal */}
                {mappingModal.open && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-obsidian-night/95 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="glass-card w-full max-w-2xl p-8 border-liquid-gold/20 space-y-8 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-heading text-bone-white uppercase tracking-widest">
                                        {mappingModal.type === 'approve' ? 'Verify & Map Suggestion' :
                                            mappingModal.type === 'add' ? 'Add New Catalog Entry' : 'Edit Technical Data'}
                                    </h2>
                                    <p className="text-[10px] text-bone-white/40 uppercase tracking-[0.2em] mt-1">Refining Metadata for Global Catalog</p>
                                </div>
                                <button onClick={() => setMappingModal({ ...mappingModal, open: false })} className="text-white/20 hover:text-white"><XCircle size={24} /></button>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-liquid-gold">Beer Name</label>
                                    <input
                                        type="text"
                                        value={formBeerName}
                                        onChange={(e) => setFormBeerName(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-bone-white outline-none focus:border-liquid-gold/50 transition-all text-sm"
                                        placeholder="e.g. Macanuda"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-liquid-gold">Brewery</label>
                                    <select
                                        value={formBrewery}
                                        onChange={(e) => setFormBrewery(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-bone-white outline-none focus:border-liquid-gold/50 transition-all text-sm"
                                    >
                                        <option value="">-- Select Brewery --</option>
                                        {Object.values(breweries).sort((a, b) => a.name.localeCompare(b.name)).map(b => (
                                            <option key={b.id} value={b.name}>{b.name}</option>
                                        ))}
                                    </select>
                                    {/* Optional: Add a button to quickly add a brewery if missing? */}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-bone-white/40 mb-3">Select BJCP Style Reference</label>
                                    <select
                                        value={selectedStyle}
                                        onChange={(e) => setSelectedStyle(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-bone-white outline-none focus:border-liquid-gold/50 transition-all font-mono text-sm"
                                    >
                                        <option value="">-- Choose Style --</option>
                                        {Object.entries(bjcpData.styles).map(([id, info]) => (
                                            <option key={id} value={id}>{id} - {info.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="override-toggle"
                                                checked={enableOverrides}
                                                onChange={(e) => setEnableOverrides(e.target.checked)}
                                                className="w-4 h-4 rounded border-white/20 bg-white/5 text-agave-blue focus:ring-agave-blue"
                                            />
                                            <label htmlFor="override-toggle" className="block text-[10px] font-black uppercase tracking-[0.2em] text-bone-white/40 cursor-pointer select-none">
                                                Enable Sensory Overrides
                                            </label>
                                        </div>
                                        <p className="text-[8px] italic text-bone-white/30">Overrides base style vector</p>
                                    </div>

                                    <div className={`grid grid-cols-5 gap-4 transition-opacity duration-300 ${!enableOverrides ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                                        {['bitter', 'malt', 'body', 'aromatics', 'abv'].map(axis => (
                                            <div key={axis}>
                                                <label className="block text-[8px] uppercase tracking-widest text-white/20 mb-1 text-center">{axis}</label>
                                                <input
                                                    type="number"
                                                    step="0.05"
                                                    min="0"
                                                    max="1"
                                                    placeholder={selectedStyle ? (bjcpData.styles as any)[selectedStyle]?.vector[axis] : '--'}
                                                    value={overrideVector[axis] ?? ''}
                                                    onChange={(e) => setOverrideVector({ ...overrideVector, [axis]: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-center text-xs text-bone-white outline-none focus:border-agave-blue/50 transition-all font-mono"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {mappingModal.type === 'approve' && (
                                    <div className="space-y-3 pt-6 border-t border-white/5">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-liquid-gold">
                                            Feedback for User <span className="text-white">#{mappingModal.data?.userId}</span>
                                        </label>
                                        <textarea
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                            placeholder="Write a note to the contributor (optional)..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-bone-white outline-none focus:border-liquid-gold/50 transition-all h-24 resize-none"
                                        />
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={mappingModal.type === 'approve' ? submitApproval : submitEdit}
                                disabled={!selectedStyle || !formBeerName || !formBrewery}
                                className="w-full py-5 bg-gradient-to-r from-liquid-gold to-liquid-gold/80 text-obsidian-night font-black uppercase tracking-[0.3em] rounded-xl shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100 disabled:grayscale"
                            >
                                <Save size={20} />
                                {mappingModal.type === 'approve' ? 'Apply Mapping & Approve' :
                                    mappingModal.type === 'add' ? 'Create Master Entry' : 'Update Catalog Entry'}
                            </button>
                        </div>
                    </div>
                )}

                {rejectionModal.open && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-obsidian-night/95 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="glass-card w-full max-w-lg p-8 border-red-500/20 space-y-8">
                            <div className="flex justify-between items-start text-red-500">
                                <div>
                                    <h2 className="text-2xl font-heading uppercase tracking-widest">Reject Suggestion</h2>
                                    <p className="text-[10px] text-red-500/40 uppercase tracking-[0.2em] mt-1">This will notify the contributor</p>
                                </div>
                                <button onClick={() => setRejectionModal({ open: false, id: null })} className="text-white/20 hover:text-white"><XCircle size={24} /></button>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-bone-white/40">Reason for Rejection (Mandatory)</label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="Explain why this suggestion wasn't chosen..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-bone-white outline-none focus:border-red-500/50 transition-all h-32 resize-none"
                                />
                            </div>

                            <button
                                onClick={() => {
                                    if (rejectionModal.id && adminNote) {
                                        rejectSuggestion(rejectionModal.id, adminNote);
                                        setRejectionModal({ open: false, id: null });
                                        setAdminNote('');
                                    }
                                }}
                                disabled={!adminNote}
                                className="w-full py-5 bg-red-500 text-white font-black uppercase tracking-[0.3em] rounded-xl shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                <XCircle size={20} />
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                )}
                {/* Brewery Manager Modal */}
                {breweryModal.open && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-obsidian-night/95 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="glass-card w-full max-w-3xl p-8 border-liquid-gold/20 space-y-8 max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-heading text-bone-white uppercase tracking-widest">Brewery Database</h2>
                                    <p className="text-[10px] text-bone-white/40 uppercase tracking-[0.2em] mt-1">Manage Partner & Global Producers</p>
                                </div>
                                <button onClick={() => setBreweryModal({ open: false, editing: null })} className="text-white/20 hover:text-white"><XCircle size={24} /></button>
                            </div>

                            <div className="grid grid-cols-2 gap-8 flex-1 min-h-0">
                                {/* List */}
                                <div className="space-y-4 flex flex-col min-h-0">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Search breweries..."
                                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-xs text-bone-white outline-none focus:border-liquid-gold/30"
                                        />
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                        {Object.values(breweries).sort((a, b) => a.name.localeCompare(b.name)).map(b => (
                                            <div key={b.id} className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between group">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-bone-white">{b.name}</p>
                                                    <p className="text-[8px] uppercase tracking-widest text-bone-white/30">{b.location || 'Location Unknown'}</p>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleBreweryEdit(b)} className="p-1 px-2 hover:bg-white/10 rounded text-[10px] text-liquid-gold uppercase font-black">Edit</button>
                                                    <button onClick={() => deleteBrewery(b.id)} className="p-1 px-2 hover:bg-red-500/20 rounded text-[10px] text-red-500 uppercase font-black">Del</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Editor */}
                                <div className="space-y-6 bg-white/[0.02] p-6 rounded-xl border border-white/5 h-fit">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-liquid-gold">
                                            {breweryModal.editing ? 'Edit Brewery' : 'Add New Brewery'}
                                        </h3>
                                        <div className="space-y-2">
                                            <label className="block text-[8px] uppercase tracking-widest text-white/40">Registered Name</label>
                                            <input
                                                value={breweryName}
                                                onChange={(e) => setBreweryName(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-bone-white outline-none focus:border-liquid-gold/50"
                                                placeholder="e.g. Hércules"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[8px] uppercase tracking-widest text-white/40">Location / Origin</label>
                                            <input
                                                value={breweryLocation}
                                                onChange={(e) => setBreweryLocation(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-bone-white outline-none focus:border-liquid-gold/50"
                                                placeholder="e.g. Querétaro, MX"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={submitBrewery}
                                            disabled={!breweryName}
                                            className="flex-1 py-3 bg-liquid-gold text-obsidian-night font-black uppercase tracking-[0.2em] rounded-lg text-[10px] shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                        >
                                            {breweryModal.editing ? 'Update' : 'Save Brewery'}
                                        </button>
                                        {breweryModal.editing && (
                                            <button
                                                onClick={() => handleBreweryEdit()}
                                                className="px-4 py-3 bg-white/5 text-white/40 font-black uppercase tracking-[0.2em] rounded-lg text-[10px] hover:bg-white/10 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Financial Report Modal */}
                {reportModal.open && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-obsidian-night/95 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="glass-card w-full max-w-4xl p-8 border-emerald-500/20 space-y-8 max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-heading text-bone-white uppercase tracking-widest">Monthly Invoice Report</h2>
                                        <p className="text-[10px] text-bone-white/40 uppercase tracking-[0.2em] mt-1">Super-Admin Financial Audit Tool</p>
                                    </div>
                                </div>
                                <button onClick={() => setReportModal({ ...reportModal, open: false })} className="text-white/20 hover:text-white p-2 hover:bg-white/5 rounded-full"><XCircle size={24} /></button>
                            </div>

                            <div className="grid grid-cols-2 gap-6 bg-white/[0.02] p-6 rounded-xl border border-white/5">
                                <div className="space-y-2">
                                    <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500">Target Location</label>
                                    <div className="relative">
                                        <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                        <select
                                            value={reportModal.locationId}
                                            onChange={(e) => setReportModal({ ...reportModal, locationId: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-bone-white outline-none focus:border-emerald-500/50 transition-all text-sm appearance-none"
                                        >
                                            <option value="">-- Select Location --</option>
                                            {locationsData.prototype_locations.filter(l => l.type === 'sponsor').map(l => (
                                                <option key={l.id} value={l.id}>{l.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500">Billing Period</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                        <input
                                            type="month"
                                            value={reportModal.month}
                                            onChange={(e) => setReportModal({ ...reportModal, month: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-bone-white outline-none focus:border-emerald-500/50 transition-all text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[300px]">
                                {reportModal.locationId && reportModal.month ? (() => {
                                    const filtered = redemptionRecords.filter(r => {
                                        const date = new Date(r.timestamp);
                                        const monthStr = date.toISOString().slice(0, 7);
                                        return r.locationId === reportModal.locationId && monthStr === reportModal.month;
                                    });

                                    if (filtered.length === 0) {
                                        return (
                                            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20 py-20">
                                                <Database size={48} />
                                                <p className="text-[10px] uppercase tracking-[0.3em] italic">No redemption records found for this period</p>
                                            </div>
                                        );
                                    }

                                    // Aggregation
                                    const groups: Record<string, { count: number, name: string, tier: string, fee: number }> = {};
                                    filtered.forEach(r => {
                                        if (!groups[r.couponId]) {
                                            const coupon = (couponsData as any[]).find(p => p.id === r.couponId);
                                            const tier = coupon?.tier || 'subscriber';
                                            const fee = tier === 'premium' ? systemConfig.billing.premium_coupon_fee_usd : systemConfig.billing.standard_coupon_fee_usd;
                                            groups[r.couponId] = {
                                                count: 0,
                                                name: coupon?.title[locale as 'en-US' | 'es-MX'] || r.couponId,
                                                tier: tier,
                                                fee: fee
                                            };
                                        }
                                        groups[r.couponId].count++;
                                    });

                                    const totalAmount = Object.values(groups).reduce((acc, g) => acc + (g.count * g.fee), 0);

                                    return (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                                                    <p className="text-[8px] uppercase tracking-widest text-white/40 mb-1">Total Redemptions</p>
                                                    <p className="text-2xl font-heading text-bone-white">{filtered.length}</p>
                                                </div>
                                                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                                                    <p className="text-[8px] uppercase tracking-widest text-white/40 mb-1">Active Promotions</p>
                                                    <p className="text-2xl font-heading text-bone-white">{Object.keys(groups).length}</p>
                                                </div>
                                                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl">
                                                    <p className="text-[8px] uppercase tracking-widest text-emerald-500/60 mb-1">Total Due (MXN)</p>
                                                    <p className="text-2xl font-heading text-emerald-500">${totalAmount.toFixed(2)}</p>
                                                </div>
                                            </div>

                                            <table className="w-full text-left">
                                                <thead className="text-[8px] uppercase tracking-widest text-white/30 border-b border-white/5">
                                                    <tr>
                                                        <th className="pb-3 px-2">Promotion</th>
                                                        <th className="pb-3 px-2">Tier</th>
                                                        <th className="pb-3 px-2 text-center">Unit Fee</th>
                                                        <th className="pb-3 px-2 text-center">Qty</th>
                                                        <th className="pb-3 px-2 text-right">Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {Object.entries(groups).map(([id, g]) => (
                                                        <tr key={id} className="text-[11px] text-bone-white/80">
                                                            <td className="py-4 px-2">
                                                                <p className="font-bold">{g.name}</p>
                                                                <p className="text-[8px] text-white/20 uppercase tracking-tighter">{id}</p>
                                                            </td>
                                                            <td className="py-4 px-2">
                                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${g.tier === 'premium' ? 'bg-premium-amber/10 text-premium-amber border border-premium-amber/20' : 'bg-standard-jade/10 text-standard-jade border border-standard-jade/20'}`}>
                                                                    {g.tier}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-2 text-center font-mono opacity-60">${g.fee.toFixed(2)}</td>
                                                            <td className="py-4 px-2 text-center font-bold">{g.count}</td>
                                                            <td className="py-4 px-2 text-right font-mono text-emerald-500 font-bold">${(g.count * g.fee).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })() : (
                                    <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20 py-20">
                                        <Clock size={48} />
                                        <p className="text-[10px] uppercase tracking-[0.3em] font-medium">Select Location and Period to Generate Report</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-white/5">
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-bone-white font-black uppercase tracking-[0.2em] rounded-xl text-[10px] flex items-center justify-center gap-3 transition-all"
                                >
                                    <Download size={16} /> Export PDF / CSV
                                </button>
                                <button
                                    onClick={() => setReportModal({ ...reportModal, open: false })}
                                    className="px-12 py-4 border border-white/10 hover:border-white/30 text-bone-white/40 hover:text-white font-black uppercase tracking-[0.2em] rounded-xl text-[10px] transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
