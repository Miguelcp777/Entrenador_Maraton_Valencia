import { useAthlete } from '../context/AthleteContext';
import { getPhaseForDate, getDailyFocus, getMacrocycleProgress, getPhaseProgress, getWeeklyProgress } from '../utils/trainingLogic';

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

                {/* Weekly Mileage Gauge */}
                <div className="bg-surface-container-low rounded-xl p-6">
                    <div className="flex justify-between items-start mb-6">
                        <span className="font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-zinc-500">Weekly Volume</span>
                        <span className={`font-['Space_Grotesk'] ${isInactive ? 'text-zinc-500' : 'text-primary'} font-bold text-xs`}>{isInactive ? '0%' : '82%'}</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                        <h2 className={`font-['Inter'] font-black text-5xl tracking-tighter ${isInactive ? 'text-zinc-600' : ''}`}>{isInactive ? '0.0' : '42.4'}</h2>
                        <span className="font-['Space_Grotesk'] text-sm text-zinc-500">KM</span>
                    </div>
                    <div className="gauge-track w-full mb-2 bg-surface-container-high rounded-full overflow-hidden h-2">
                        <div className={`gauge-indicator ${isInactive ? 'w-0' : 'w-[82%] bg-primary'} h-full rounded-full`}></div>
                    </div>
                    <div className="flex justify-between font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-zinc-500">
                        <span>{phase.name}</span>
                        <span>{isInactive ? "Target: 0KM" : "Target: Pending"}</span>
                    </div>
                </div>
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
                {/* Technical Mock Chart */}
                <div className="h-32 w-full relative flex items-end gap-1">
                    <div className="flex-1 bg-surface-container-high h-[40%] rounded-sm opacity-20"></div>
                    <div className="flex-1 bg-surface-container-high h-[45%] rounded-sm opacity-20"></div>
                    <div className="flex-1 bg-surface-container-high h-[42%] rounded-sm opacity-30"></div>
                    <div className="flex-1 bg-surface-container-high h-[50%] rounded-sm opacity-40"></div>
                    <div className="flex-1 bg-surface-container-high h-[55%] rounded-sm opacity-50"></div>
                    <div className="flex-1 bg-surface-container-high h-[52%] rounded-sm opacity-60"></div>
                    <div className="flex-1 bg-primary h-[60%] rounded-sm ambient-glow"></div>
                    {/* Line Overlay Logic */}
                    <svg className="absolute inset-0 h-full w-full pointer-events-none" preserveAspectRatio="none">
                        <polyline className="opacity-100" fill="none" points="0,90 40,85 80,88 120,70 160,65 200,68 240,55 280,50 320,48 360,52 400,45" stroke="#ff915d" strokeWidth="2"></polyline>
                    </svg>
                </div>
                <div className="flex justify-between mt-4 font-['Space_Grotesk'] text-[9px] uppercase tracking-widest">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayStr, idx) => {
                        const dayIndexForDate = idx === 6 ? 0 : idx + 1; // Map 0-6 (Mon-Sun) to 0-6 (Sun-Sat Date.getDay())
                        const isToday = todayDate.getDay() === dayIndexForDate;
                        return (
                            <span key={dayStr} className={isToday ? "text-primary font-bold" : "text-zinc-600"}>
                                {dayStr}
                            </span>
                        );
                    })}
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
