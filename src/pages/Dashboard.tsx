import { useState, useEffect } from 'react';
import { useAthlete } from '../context/AthleteContext';
import { getPhaseForDate, getDailyFocus, getMacrocycleProgress, getPhaseProgress, getWeeklyProgress } from '../utils/trainingLogic';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { supabase } from '../supabaseClient';
import WeightFeedback from '../components/WeightFeedback';
import DashboardStats from '../components/DashboardStats';
import DashboardAIEvaluation from '../components/DashboardAIEvaluation';

export default function Dashboard() {
    const { weight, targetWeight, complianceScore, weeklyComplianceScore } = useAthlete();
    const diff = (weight - targetWeight).toFixed(1);

    const todayDate = new Date();
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const monthStr = monthNames[todayDate.getMonth()];
    const dayStr = todayDate.getDate().toString().padStart(2, '0');
    const yearStr = todayDate.getFullYear();

    const phase = getPhaseForDate(yearStr, todayDate.getMonth(), todayDate.getDate());
    const focus = getDailyFocus(todayDate.getDay(), phase.name);

    const isInactive = phase.name === 'Pre/Post Temporada';

    const dTime = todayDate.getTime();
    const totalProg = getMacrocycleProgress(dTime);
    const phaseProg = getPhaseProgress(dTime, phase.name);

    // Dynamic Countdown
    const raceDate = new Date(2026, 11, 6).getTime(); // Dec 6, 2026
    const daysToGo = Math.max(0, Math.floor((raceDate - dTime) / (1000 * 60 * 60 * 24)));

    // Weight Tracking Logic
    const [weightLogs, setWeightLogs] = useState<any[]>([]);
    const [newWeightInput, setNewWeightInput] = useState('');
    const [isSavingWeight, setIsSavingWeight] = useState(false);

    const [editingLogId, setEditingLogId] = useState<string | null>(null);
    const [editingWeightValue, setEditingWeightValue] = useState<string>('');

    useEffect(() => {
        const fetchWeightLogs = async () => {
            const { data } = await supabase
                .from('registros_peso')
                .select('id, fecha, peso_kg')
                .order('fecha', { ascending: true })
                .limit(14); // Last 14 weigh-ins

            if (data) {
                // Format for recharts
                const formatted = data.map(d => ({
                    id: d.id,
                    dateStr: new Date(d.fecha).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    weight: d.peso_kg
                }));
                setWeightLogs(formatted);
            }
        };
        fetchWeightLogs();
    }, []);

    const handleSaveWeight = async (e: React.FormEvent) => {
        e.preventDefault();
        const kg = parseFloat(newWeightInput);
        if (isNaN(kg) || kg <= 0) return;

        setIsSavingWeight(true);
        try {
            const { data: profile } = await supabase.from('perfil_atleta').select('id').limit(1).maybeSingle();
            if (profile) {
                await supabase.from('registros_peso').insert([{
                    atleta_id: profile.id,
                    fecha: new Date().toISOString().split('T')[0],
                    peso_kg: kg
                }]);
            }
        } catch (e) {
            console.error(e);
        }
        setIsSavingWeight(false);
        setNewWeightInput('');
        window.location.reload(); // Quick refresh to see new graph data
    };

    const handleEditStart = (log: any) => {
        setEditingLogId(log.id);
        setEditingWeightValue(log.weight.toString());
    };

    const handleEditSave = async (id: string) => {
        const kg = parseFloat(editingWeightValue);
        if (isNaN(kg) || kg <= 0) return;

        await supabase.from('registros_peso').update({ peso_kg: kg }).eq('id', id);
        setEditingLogId(null);
        window.location.reload();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Borrar este registro?')) {
            await supabase.from('registros_peso').delete().eq('id', id);
            window.location.reload();
        }
    };

    return (
        <div className="px-6 mt-8 max-w-4xl mx-auto space-y-10">
            {/* Header: Circular Countdown Section */}
            <section className="flex flex-col items-center justify-center py-6">
                <div className="relative w-64 h-64 flex items-center justify-center">
                    {/* Circular SVG Progress */}
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle className="text-surface-container-high" cx="128" cy="128" fill="transparent" r="120" stroke="currentColor" strokeWidth="4"></circle>
                        <circle className="text-primary" cx="128" cy="128" fill="transparent" r="120" stroke="currentColor" strokeDasharray="754" strokeDashoffset="180" strokeWidth="8"></circle>
                    </svg>
                    <div className="text-center space-y-1">
                        <p className="font-['Space_Grotesk'] text-[12px] uppercase font-bold tracking-widest text-zinc-500">VALENCIA 2026</p>
                        <h1 className="font-['Inter'] font-black text-6xl tracking-tighter">{daysToGo}</h1>
                        <p className="font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-primary">DAYS TO GO</p>
                    </div>
                </div>
                <div className="mt-4 flex gap-4">
                    <div className="text-center">
                        <span className="block font-['Space_Grotesk'] text-xl font-bold">{monthStr}</span>
                        <span className="block font-['Space_Grotesk'] text-[10px] text-zinc-500">MONTH</span>
                    </div>
                    <div className="text-center">
                        <span className="block font-['Space_Grotesk'] text-xl font-bold">{dayStr}</span>
                        <span className="block font-['Space_Grotesk'] text-[10px] text-zinc-500">DAY</span>
                    </div>
                    <div className="text-center">
                        <span className="block font-['Space_Grotesk'] text-xl font-bold">{yearStr}</span>
                        <span className="block font-['Space_Grotesk'] text-[10px] text-zinc-500">YEAR</span>
                    </div>
                </div>
            </section>

            {/* AI Daily Check */}
            <DashboardAIEvaluation />

            {/* Hybrid Status Bento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status Indicator Card */}
                <div className="bg-surface-container-low rounded-xl p-6 ambient-glow border border-primary/5">
                    <div className="flex justify-between items-start mb-6">
                        <span className="font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-zinc-500">Hybrid Status</span>
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    </div>
                    <div className="flex items-end gap-3 mb-2">
                        <h2 className="font-['Inter'] font-black text-4xl uppercase italic">{isInactive ? 'OFFLINE' : 'ACTIVE'}</h2>
                        <div className="flex gap-1 mb-2">
                            <div className={`w-1.5 h-6 rounded-full ${isInactive ? 'bg-zinc-700' : 'bg-primary'}`}></div>
                            <div className={`w-1.5 h-6 rounded-full ${isInactive ? 'bg-zinc-700' : 'bg-primary'}`}></div>
                            <div className={`w-1.5 h-6 rounded-full ${isInactive ? 'bg-zinc-800' : 'bg-primary/20'}`}></div>
                        </div>
                    </div>
                    <p className="text-zinc-400 text-sm font-['Inter'] leading-relaxed">
                        {isInactive
                            ? "System resting. Protocol will activate when macrocycle begins."
                            : `Central Nervous System focused on ${focus.label}. Interference risk minimal.`}
                    </p>
                </div>

                {/* Aggregation Stats Widget */}
                <DashboardStats />
            </div>

            {/* Weight Tracking Chart Card */}
            <section className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <span className="font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-zinc-500">Body Composition</span>
                        <h3 className="font-['Inter'] font-black text-2xl tracking-tight">{weight.toFixed(1)} <span className="text-sm font-['Space_Grotesk'] text-zinc-500 font-medium">KG</span></h3>
                    </div>
                    <div className="text-right">
                        <span className="font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-primary">Target</span>
                        <div className="flex flex-col items-end gap-1">
                            <h3 className="font-['Inter'] font-black text-2xl tracking-tight text-primary">
                                {targetWeight.toFixed(1)} <span className="text-sm font-['Space_Grotesk'] font-medium">KG</span>
                            </h3>
                            <span className="text-[10px] font-['Space_Grotesk'] font-bold uppercase tracking-widest text-zinc-500 bg-surface-container-high px-1.5 py-0.5 rounded">
                                {parseFloat(diff) > 0 ? `${diff} KG TO GO` : 'GOAL MET'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Weight Registration Form */}
                <form onSubmit={handleSaveWeight} className="mb-6 flex gap-2">
                    <input
                        type="number"
                        step="0.1"
                        placeholder="Nuevo pesaje (kg)"
                        value={newWeightInput}
                        onChange={e => setNewWeightInput(e.target.value)}
                        className="bg-surface-container-highest border border-white/5 rounded-lg px-3 py-2 text-sm font-['Inter'] w-32 focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!newWeightInput || isSavingWeight}
                        className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 px-3 py-2 rounded-lg font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest whitespace-nowrap transition-colors"
                    >
                        {isSavingWeight ? 'Guardando...' : 'Registrar'}
                    </button>
                </form>

                {/* Recharts Chart */}
                <div className="h-40 w-full relative -ml-4 mt-4">
                    {weightLogs.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weightLogs} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff915d" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#ff915d" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="dateStr"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'Space Grotesk' }}
                                    dy={10}
                                />
                                <YAxis
                                    domain={['dataMin - 1', 'dataMax + 1']}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'Space Grotesk' }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                                    itemStyle={{ color: '#ff915d', fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="#ff915d"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorWeight)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center border border-dashed border-white/10 rounded-xl">
                            <span className="font-['Space_Grotesk'] text-xs text-zinc-500 uppercase tracking-widest">Sin registros recientes</span>
                        </div>
                    )}
                </div>

                <WeightFeedback weightLogs={weightLogs} />

                {/* Recent Logs List for Edits */}
                <div className="mt-6 border-t border-white/5 pt-4">
                    <span className="font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-3 block">Últimos registros</span>
                    <div className="space-y-2">
                        {weightLogs.slice().reverse().slice(0, 3).map((log) => (
                            <div key={log.id} className="flex items-center justify-between bg-surface-container-highest px-3 py-2 rounded-lg">
                                {editingLogId === log.id ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <span className="text-xs font-['Space_Grotesk'] text-zinc-500 w-12">{log.dateStr}</span>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={editingWeightValue}
                                            onChange={(e) => setEditingWeightValue(e.target.value)}
                                            className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm font-['Inter'] w-20 focus:outline-none focus:border-primary"
                                        />
                                        <div className="flex gap-1 ml-auto">
                                            <button onClick={() => setEditingLogId(null)} className="p-1 hover:bg-white/5 rounded text-zinc-400 transition-colors">
                                                <span className="material-symbols-outlined text-[14px]">close</span>
                                            </button>
                                            <button onClick={() => handleEditSave(log.id)} className="p-1 hover:bg-primary/20 rounded text-primary transition-colors">
                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-['Space_Grotesk'] text-zinc-500 w-12">{log.dateStr}</span>
                                            <span className="font-['Inter'] font-bold text-sm tracking-tight">{log.weight} kg</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditStart(log)} className="p-1.5 hover:bg-white/5 rounded-md text-zinc-400 transition-colors">
                                                <span className="material-symbols-outlined text-[14px]">edit</span>
                                            </button>
                                            <button onClick={() => handleDelete(log.id)} className="p-1.5 hover:bg-red-500/10 rounded-md text-red-400 transition-colors">
                                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        {weightLogs.length === 0 && (
                            <div className="text-xs text-zinc-600 font-['Inter'] italic">No hay registros para mostrar.</div>
                        )}
                    </div>
                </div>
            </section>

            {/* Progression Overview */}
            <section className="bg-surface-container-low rounded-xl p-6 opacity-90 border border-white/5">
                <div className="flex items-center gap-2 mb-8">
                    <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>moving</span>
                    <h2 className="font-['Inter'] font-bold text-lg uppercase tracking-tighter">System Progression</h2>
                </div>

                <div className="space-y-6">
                    {/* Compliance Progress (REAL DB) */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <span className="block font-['Space_Grotesk'] text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Cumplimiento General</span>
                                <span className="block text-sm font-['Inter'] text-zinc-300">Sesiones Target vs Logs Realizados</span>
                            </div>
                            <span className="font-['Inter'] font-black text-xl text-yellow-500">{complianceScore}%</span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${complianceScore}%` }}></div>
                        </div>
                    </div>

                    {/* Weekly Progress */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <span className="block font-['Space_Grotesk'] text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Semanal</span>
                                <span className="block text-sm font-['Inter'] text-zinc-300">Microciclo de 7 Días</span>
                            </div>
                            <span className="font-['Inter'] font-black text-xl text-primary">{Math.round(weeklyComplianceScore)}%</span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${weeklyComplianceScore}%` }}></div>
                        </div>
                    </div>

                    {/* Phase Progress */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <span className="block font-['Space_Grotesk'] text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Ciclo Actual</span>
                                <span className="block text-sm font-['Inter'] text-zinc-300 truncate w-48 sm:w-auto">{phase.name}</span>
                            </div>
                            <span className="font-['Inter'] font-black text-xl text-orange-400">{Math.round(phaseProg)}%</span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                            <div className="h-full bg-orange-400 rounded-full transition-all duration-1000 ease-out delay-150" style={{ width: `${phaseProg}%` }}></div>
                        </div>
                    </div>

                    {/* Total Macrocycle Progress */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <span className="block font-['Space_Grotesk'] text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Macrociclo</span>
                                <span className="block text-sm font-['Inter'] text-zinc-300">Camino a Valencia 2026</span>
                            </div>
                            <span className="font-['Inter'] font-black text-xl text-emerald-500">{Math.round(totalProg)}%</span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out delay-300" style={{ width: `${totalProg}%` }}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contextual FAB */}
            <button className="fixed bottom-24 right-6 w-14 h-14 kinetic-gradient rounded-xl flex items-center justify-center shadow-2xl z-40 active:scale-95 transition-transform duration-150">
                <span className="material-symbols-outlined text-black font-bold" style={{ fontVariationSettings: "'FILL' 1", fontWeight: 700 }}>add</span>
            </button>
        </div>
    );
}
