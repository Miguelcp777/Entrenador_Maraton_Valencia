import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function DashboardStats() {
    const [view, setView] = useState<'week' | 'month' | 'total'>('week');
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoading(true);
            const today = new Date();

            // We fetch all records so we can aggregate the "Total" tab.
            const { data, error } = await supabase
                .from('logs_entrenamiento')
                .select('*');

            if (data) setLogs(data);
            setIsLoading(false);
        };
        fetchLogs();
    }, []);

    // Filter logs for week or month
    const today = new Date();

    // Calculate start of week (Monday)
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(diffToMonday));
    startOfWeek.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const activeLogs = logs.filter(log => {
        if (view === 'total') return true;
        const logDate = new Date(log.fecha_completada);
        if (view === 'month') return logDate >= firstDayOfMonth;
        return logDate >= startOfWeek;
    });

    // Compute Stats
    let totalKm = 0;
    let totalCalories = 0;

    let maxSpeed = 0;
    let minSpeed = Infinity;
    let sumSpeed = 0;
    let runWalkCount = 0;

    let maxHr = 0;
    let sumHr = 0;
    let hrCount = 0;

    activeLogs.forEach(log => {
        totalKm += (log.distancia_real_km || 0);

        const extra = log.metricas_extra;
        if (extra) {
            if (extra.calories) totalCalories += extra.calories;

            if (extra.type === 'Run' || extra.type === 'Walk' || extra.type === 'TrailRun') {
                if (extra.average_speed && extra.average_speed > 0) {
                    if (extra.average_speed > maxSpeed) maxSpeed = extra.average_speed;
                    if (extra.average_speed < minSpeed) minSpeed = extra.average_speed;
                    sumSpeed += extra.average_speed;
                    runWalkCount++;
                }
            }

            if (extra.max_heartrate && extra.max_heartrate > maxHr) {
                maxHr = extra.max_heartrate;
            }
            if (extra.average_heartrate) {
                sumHr += extra.average_heartrate;
                hrCount++;
            }
        }
    });

    const formatPace = (speedMs: number) => {
        if (!speedMs || speedMs === Infinity) return '--:--';
        const minsPerKm = 1000 / speedMs / 60;
        const mins = Math.floor(minsPerKm);
        const secs = Math.round((minsPerKm - mins) * 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const avgPace = runWalkCount > 0 ? formatPace(sumSpeed / runWalkCount) : '--:--';
    const paceMaxStr = maxSpeed > 0 ? formatPace(maxSpeed) : '--:--'; // max speed = fastest pace
    const paceMinStr = minSpeed !== Infinity ? formatPace(minSpeed) : '--:--'; // min speed = slowest pace

    const hrAvgStr = hrCount > 0 ? Math.round(sumHr / hrCount) : '--';
    const hrMaxStr = maxHr > 0 ? maxHr : '--';

    return (
        <div className="bg-surface-container-low rounded-xl p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2 sm:gap-0">
                <span className="font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-zinc-500">Métricas Acumuladas</span>

                {/* Toggle */}
                <div className="flex self-start sm:self-auto bg-surface-container-highest rounded-lg p-1">
                    <button
                        onClick={() => setView('week')}
                        className={`text-[10px] font-['Space_Grotesk'] font-bold uppercase tracking-widest px-3 py-1 rounded-md transition-colors ${view === 'week' ? 'bg-primary text-black' : 'text-zinc-500'}`}
                    >
                        Semana
                    </button>
                    <button
                        onClick={() => setView('month')}
                        className={`text-[10px] font-['Space_Grotesk'] font-bold uppercase tracking-widest px-3 py-1 rounded-md transition-colors ${view === 'month' ? 'bg-primary text-black' : 'text-zinc-500'}`}
                    >
                        Mes
                    </button>
                    <button
                        onClick={() => setView('total')}
                        className={`text-[10px] font-['Space_Grotesk'] font-bold uppercase tracking-widest px-3 py-1 rounded-md transition-colors ${view === 'total' ? 'bg-primary text-black' : 'text-zinc-500'}`}
                    >
                        Total
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="h-32 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Primary Stats: KM & Calories */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="block text-[9px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Volumen Acumulado</span>
                            <div className="flex items-baseline gap-1">
                                <h2 className="font-['Inter'] font-black text-3xl tracking-tighter text-white">{totalKm.toFixed(1)}</h2>
                                <span className="font-['Space_Grotesk'] text-sm text-zinc-500">KM</span>
                            </div>
                        </div>
                        <div>
                            <span className="block text-[9px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Energía Consumida</span>
                            <div className="flex items-baseline gap-1">
                                <h2 className="font-['Inter'] font-black text-3xl tracking-tighter text-primary">{Math.round(totalCalories)}</h2>
                                <span className="font-['Space_Grotesk'] text-sm text-zinc-500">KCAL</span>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-2 bg-surface-container-highest/50 p-3 rounded-xl border border-white/5">

                        <div>
                            <span className="block text-[9px] font-bold tracking-widest text-zinc-500 uppercase mb-0.5">Ritmo Medio</span>
                            <span className="font-['Inter'] font-black text-white text-base">{avgPace} <span className="text-[9px] font-normal text-zinc-500">/KM</span></span>
                        </div>
                        <div>
                            <span className="block text-[9px] font-bold tracking-widest text-zinc-500 uppercase mb-0.5">Mejor Ritmo</span>
                            <span className="font-['Inter'] font-black text-white text-base">{paceMaxStr} <span className="text-[9px] font-normal text-zinc-500">/KM</span></span>
                        </div>
                        <div>
                            <span className="block text-[9px] font-bold tracking-widest text-zinc-500 uppercase mb-0.5">Ritmo Suave</span>
                            <span className="font-['Inter'] font-black text-white text-base">{paceMinStr} <span className="text-[9px] font-normal text-zinc-500">/KM</span></span>
                        </div>

                        <div>
                            <span className="block text-[9px] font-bold tracking-widest text-zinc-500 uppercase mb-0.5">HR Media Global</span>
                            <span className="font-['Inter'] font-black text-white text-base">{hrAvgStr} <span className="text-[9px] font-normal text-zinc-500">BPM</span></span>
                        </div>
                        <div>
                            <span className="block text-[9px] font-bold tracking-widest text-zinc-500 uppercase mb-0.5">Pico HR Máximo</span>
                            <span className="font-['Inter'] font-black text-red-400 text-base">{hrMaxStr} <span className="text-[9px] font-normal text-zinc-500">BPM</span></span>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
