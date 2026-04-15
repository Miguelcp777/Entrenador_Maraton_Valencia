import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getPhaseForDate, getDailyFocus, getTrainingDetails } from '../utils/trainingLogic';
import { useAthlete } from '../context/AthleteContext';
import { syncStravaActivities } from '../utils/stravaSync';

export default function CalendarView() {
    const { hrZones, stravaTokens, weight } = useAthlete();
    const today = new Date();
    const [isSyncingStrava, setIsSyncingStrava] = useState(false);

    // States for calendar navigation
    const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [monthLogs, setMonthLogs] = useState<any[]>([]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Form logic states
    const [existingLogId, setExistingLogId] = useState<string | null>(null);
    const [distance, setDistance] = useState('');
    const [duration, setDuration] = useState('');
    const [rpe, setRpe] = useState(7);
    const [feelings, setFeelings] = useState('');
    const [dayLogsData, setDayLogsData] = useState<any[]>([]); // New array state
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!selectedDate) return;

        const fetchLog = async () => {
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            const { data } = await supabase
                .from('logs_entrenamiento')
                .select('*')
                .gte('fecha_completada', startOfDay.toISOString())
                .lte('fecha_completada', endOfDay.toISOString());

            if (data && data.length > 0) {
                setDayLogsData(data);

                // Bind the form to the first log just for legacy compatibility
                const firstLog = data[0];
                setExistingLogId(firstLog.id);
                setDistance(firstLog.distancia_real_km?.toString() || '');
                setDuration(firstLog.duracion_real_mins?.toString() || '');
                setRpe(firstLog.rpe_real || 7);
                setFeelings(firstLog.sentimientos || '');
            } else {
                setDayLogsData([]);
                setExistingLogId(null);
                setDistance('');
                setDuration('');
                setRpe(7);
                setFeelings('');
            }
        };
        fetchLog();
    }, [selectedDate]);

    // Fetch whole month's logs to mark status
    useEffect(() => {
        const fetchMonthLogs = async () => {
            const startOfMonth = new Date(year, month, 1).toISOString();
            const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
            const { data } = await supabase
                .from('logs_entrenamiento')
                .select('fecha_completada, metricas_extra')
                .gte('fecha_completada', startOfMonth)
                .lte('fecha_completada', endOfMonth);

            if (data) setMonthLogs(data);
        };
        fetchMonthLogs();
    }, [year, month, existingLogId]); // re-fetch when calendar navigates or a new log is saved

    const handleSaveLog = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let targetDate = new Date(selectedDate!);
            targetDate.setHours(12, 0, 0, 0); // Noon to avoid timezone edge case day shifting

            const payload = {
                fecha_completada: targetDate.toISOString(),
                distancia_real_km: parseFloat(distance) || 0,
                duracion_real_mins: parseInt(duration) || 0,
                rpe_real: rpe,
                sentimientos: feelings,
            };

            if (existingLogId) {
                await supabase.from('logs_entrenamiento').update(payload).eq('id', existingLogId);
            } else {
                const { data } = await supabase.from('logs_entrenamiento').insert([payload]).select().single();
                if (data) setExistingLogId(data.id);
            }
            alert("🔥 Entreno registrado correctamente en la base de datos.");
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteLog = async () => {
        if (!existingLogId) return;
        const confirmDelete = window.confirm("¿Seguro que deseas eliminar este log por completo?");
        if (!confirmDelete) return;

        setIsSaving(true);
        try {
            await supabase.from('logs_entrenamiento').delete().eq('id', existingLogId);
            setExistingLogId(null);
            setDistance('');
            setDuration('');
            setRpe(7);
            setFeelings('');
            alert("🗑️ Entreno eliminado permanentemente.");
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    // Calendar matrix calculation
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday=0
    };

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const handleSyncStrava = async () => {
        if (!stravaTokens?.accessToken) return;
        setIsSyncingStrava(true);
        try {
            const { data } = await supabase.from('perfil_atleta').select('id').limit(1).single();
            if (data?.id) {
                const result = await syncStravaActivities(stravaTokens, data.id, weight);
                if (result.success) {
                    if (result.updatedTokens) {
                        setStravaTokens(result.updatedTokens);
                    }
                    alert(`✅ Sincronización completada. Actividades nuevas/actualizadas: ${result.count}`);
                    window.location.reload();
                } else {
                    alert(`❌ Error al sincronizar: ${result.error}`);
                }
            } else {
                alert("Error de Perfil.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSyncingStrava(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 pb-32 pt-4">
            {/* Header */}
            <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex justify-between items-center w-full sm:w-auto">
                    <div>
                        <h1 className="font-['Inter'] font-black text-3xl uppercase tracking-tighter leading-none">PLAN</h1>
                        <span className="font-['Space_Grotesk'] text-primary font-bold tracking-widest text-[10px]">MACROCICLO</span>
                    </div>

                    {/* Sync Strava (Visible on mobile next to title) */}
                    {stravaTokens?.accessToken && (
                        <button
                            onClick={handleSyncStrava}
                            disabled={isSyncingStrava}
                            className="sm:hidden bg-orange-500/10 text-[#FC4C02] border border-[#FC4C02]/30 px-2 py-1.5 rounded-md font-['Space_Grotesk'] text-[9px] uppercase font-bold tracking-widest flex items-center gap-1 transition-all"
                        >
                            <span className={`material-symbols-outlined text-[12px] ${isSyncingStrava ? 'animate-spin' : ''}`}>sync</span>
                            {isSyncingStrava ? 'SYNCING...' : 'SYNC STRAVA'}
                        </button>
                    )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <div className="flex bg-surface-container-high rounded-lg p-0.5 flex-1 sm:flex-initial">
                        <button onClick={handlePrevMonth} className="px-2 py-2 rounded-md hover:bg-surface-variant transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <div className="flex-1 sm:min-w-[100px] py-2 font-['Space_Grotesk'] font-bold text-[11px] text-center uppercase tracking-widest flex flex-col justify-center">
                            <span>{monthNames[month]}</span>
                            <span className="text-[9px] opacity-40">{year}</span>
                        </div>
                        <button onClick={handleNextMonth} className="px-2 py-2 rounded-md hover:bg-surface-variant transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>

                    {/* Sync Strava (Visible on desktop/tablet) */}
                    {stravaTokens?.accessToken && (
                        <button
                            onClick={handleSyncStrava}
                            disabled={isSyncingStrava}
                            className="hidden sm:flex bg-orange-500/10 text-[#FC4C02] border border-[#FC4C02]/30 hover:bg-[#FC4C02]/20 px-3 py-2 rounded-md font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest items-center gap-1.5 transition-all"
                        >
                            <span className={`material-symbols-outlined text-[14px] ${isSyncingStrava ? 'animate-spin' : ''}`}>sync</span>
                            {isSyncingStrava ? 'SINCRONIZANDO...' : 'SYNC STRAVA'}
                        </button>
                    )}
                </div>
            </header>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
                    <div key={day} className="text-center font-['Space_Grotesk'] text-[10px] text-zinc-600 font-bold uppercase tracking-widest py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {blanks.map((b) => (
                    <div key={`blank-${b}`} className="min-h-[80px] bg-surface-container-lowest/30 rounded-lg"></div>
                ))}
                {days.map((d) => {
                    const dateObj = new Date(year, month, d);
                    const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
                    const macroStart = new Date(2026, 3, 20); // April 20, 2026
                    const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate()) && dateObj >= macroStart;
                    const currentDayOfWeek = dateObj.getDay();
                    const phase = getPhaseForDate(year, month, d);
                    const focus = getDailyFocus(currentDayOfWeek, phase.name);
                    const isRestDay = focus.label === 'OFF / Inactivo';

                    // Check if logs exist
                    const dayLogs = monthLogs.filter(log => new Date(log.fecha_completada).getDate() === d);

                    let statusClass = '';
                    let statusIcon = null;

                    if (dayLogs.length > 0) {
                        statusClass = 'border-green-500/50 outline outline-1 outline-green-500/30';
                        statusIcon = <span className="text-green-500 material-symbols-outlined z-20" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>;
                    } else if (isPast && !isRestDay) {
                        statusClass = 'border-red-500/50 opacity-60 grayscale';
                        statusIcon = <span className="text-red-500 material-symbols-outlined z-20" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>cancel</span>;
                    } else if (isPast && isRestDay) {
                        statusClass = 'border-zinc-700/30 opacity-40 grayscale';
                    }

                    return (
                        <button
                            key={d}
                            onClick={() => setSelectedDate(new Date(year, month, d))}
                            className={`flex flex-col min-h-[80px] p-1 rounded-lg border-t-2 relative overflow-hidden transition-all text-left group hover:brightness-125
                ${phase.border}
                ${statusClass}
                ${isToday ? 'ring-2 ring-primary bg-primary/10' : 'bg-surface-container-low'}
              `}
                        >
                            {statusIcon}
                            {isToday && (
                                <div className="absolute top-0 right-0 w-8 h-8 bg-primary blur-xl opacity-30 z-0"></div>
                            )}

                            <div className="flex justify-between items-center z-10 w-full mb-1">
                                <span className={`font-['Inter'] font-black text-xs ${isToday ? 'text-primary' : 'text-on-surface'}`}>
                                    {d}
                                </span>
                                {statusIcon}
                            </div>

                            <div className="flex-1 flex flex-col justify-end z-10 w-full">
                                {/* Activity Icons Row */}
                                <div className="flex flex-wrap gap-0.5 mb-1">
                                    {dayLogs.length === 0 ? (
                                        <span className="material-symbols-outlined text-[10px] opacity-40 group-hover:opacity-100 transition-opacity" style={{ fontVariationSettings: "'FILL' 1" }}>
                                            {focus.icon}
                                        </span>
                                    ) : (
                                        dayLogs.map((logItem, idx) => {
                                            let dynamicIcon = focus.icon;
                                            let extraClass = 'text-green-500';

                                            if (logItem.metricas_extra && logItem.metricas_extra.type) {
                                                const type = logItem.metricas_extra.type;
                                                extraClass = 'text-[#FC4C02] scale-110';

                                                if (type === 'Run' || type === 'VirtualRun') dynamicIcon = 'directions_run';
                                                else if (type === 'TrailRun') dynamicIcon = 'landscape';
                                                else if (type === 'Walk') dynamicIcon = 'directions_walk';
                                                else if (type === 'WeightTraining' || type === 'Crossfit') dynamicIcon = 'fitness_center';
                                                else if (type === 'Workout') dynamicIcon = 'sports_gymnastics';
                                            }

                                            return (
                                                <span key={idx} className={`material-symbols-outlined text-[10px] transition-all ${extraClass}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                                    {dynamicIcon}
                                                </span>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="z-10 mt-2 w-full">
                                <span className="block font-['Space_Grotesk'] text-[7px] leading-tight uppercase tracking-tighter text-zinc-500 truncate">
                                    {focus.label}
                                </span>
                                {/* Visual marker for phase */}
                                <div className={`mt-1 h-1 w-full rounded-full opacity-60 bg-current transition-opacity group-hover:opacity-100 ${phase.color}`}></div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-8 bg-surface-container-low rounded-xl p-6">
                <h3 className="font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-4">
                    Fases del Macrociclo Activas en este Mes
                </h3>
                <div className="space-y-3">
                    {/* Find unique phases inside the current month visualization */}
                    {Array.from(new Set(days.map(d => getPhaseForDate(year, month, d).name))).map(phaseName => {
                        // Find color representing this phase:
                        const phaseObj = getPhaseForDate(year, month, days.find(d => getPhaseForDate(year, month, d).name === phaseName) || 1);
                        return (
                            <div key={phaseName} className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full bg-current ${phaseObj.color}`}></div>
                                <span className="font-['Inter'] font-medium text-sm">{phaseName}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Day Detail Modal Overlay */}
            {selectedDate && (() => {
                const d = selectedDate.getDate();
                const m = selectedDate.getMonth();
                const y = selectedDate.getFullYear();
                const phase = getPhaseForDate(y, m, d);
                const focus = getDailyFocus(selectedDate.getDay(), phase.name);
                const { detailMock, metricMock, hrZonesTarget } = getTrainingDetails(focus.label, phase.name);

                return (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
                            onClick={() => setSelectedDate(null)}
                        ></div>
                        <div className={`relative bg-surface-container-low border-t-4 ${phase.border.replace('border-', 'border-t-').replace('/30', '').replace('/50', '')} w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200`}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className={`font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest ${phase.color}`}>
                                        {phase.name}
                                    </span>
                                    <h3 className="font-['Inter'] font-black text-2xl text-on-surface">
                                        {d} {monthNames[m]} {y}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setSelectedDate(null)}
                                    className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center hover:bg-surface-high transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                            <div className="bg-surface-container p-5 rounded-xl mb-4">
                                <div className="flex justify-between items-start mb-4 pb-4 border-b border-white/5">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-on-surface text-sm">{focus.icon}</span>
                                            <h4 className="font-['Inter'] font-extrabold text-base uppercase leading-none">{focus.label}</h4>
                                        </div>
                                        <p className="font-['Space_Grotesk'] text-[11px] text-on-surface-variant leading-relaxed">
                                            {detailMock}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-outline mb-1">
                                            Volumen
                                        </span>
                                        <span className="font-['Inter'] font-black text-lg">{metricMock}</span>
                                    </div>
                                    {hrZonesTarget.length > 0 && (() => {
                                        const maxZone = hrZonesTarget[hrZonesTarget.length - 1];
                                        const colorClass = {
                                            z1: 'text-zinc-400',
                                            z2: 'text-blue-400',
                                            z3: 'text-green-400',
                                            z4: 'text-orange-400',
                                            z5: 'text-red-500'
                                        }[maxZone as 'z1' | 'z2' | 'z3' | 'z4' | 'z5'];

                                        return (
                                            <div className="flex flex-col text-right border-l border-white/5 pl-4">
                                                <span className={`font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest mb-1 ${colorClass.replace('400', '500/70').replace('500', '500/70')}`}>
                                                    Zonas {hrZonesTarget[0].toUpperCase()}{hrZonesTarget.length > 1 ? `-${maxZone.toUpperCase()}` : ''}
                                                </span>
                                                <span className={`font-['Inter'] font-black text-lg ${colorClass}`}>
                                                    {hrZones[hrZonesTarget[0]][0]} - {hrZones[maxZone][1]} <span className="text-[10px] font-['Space_Grotesk']">BPM</span>
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Detalle avanzado Garmin/Strava Múltiples */}
                            {dayLogsData.map((log) => {
                                const mExtra = log.metricas_extra;
                                if (!mExtra || !mExtra.strava_id) return null;

                                return (
                                    <div key={log.id} className="bg-[#FC4C02]/10 border border-[#FC4C02]/20 p-4 rounded-xl mb-4 relative overflow-hidden">
                                        <div className="absolute -right-4 -top-4 opacity-5">
                                            <span className="material-symbols-outlined text-8xl text-[#FC4C02]">sync</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-['Space_Grotesk'] text-[10px] text-[#FC4C02] uppercase font-bold tracking-widest flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm">watch</span>
                                                {mExtra.type || 'Telemetría Dinámica'}
                                            </h4>

                                            {/* Show small stats override if multiple */}
                                            <div className="text-right">
                                                <span className="font-['Inter'] font-black text-white text-xs mr-2">{log.distancia_real_km} km</span>
                                                <span className="font-['Inter'] font-black text-white text-xs">{log.duracion_real_mins} min</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-10">
                                            {mExtra.average_heartrate && (
                                                <div>
                                                    <span className="block text-[9px] font-bold tracking-widest text-zinc-500 uppercase">HR Media</span>
                                                    <span className="font-['Inter'] font-black text-white text-lg">{Math.round(mExtra.average_heartrate)} <span className="text-[10px] font-normal">BPM</span></span>
                                                </div>
                                            )}
                                            {mExtra.total_elevation_gain !== undefined && (
                                                <div>
                                                    <span className="block text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Desnivel</span>
                                                    <span className="font-['Inter'] font-black text-white text-lg">+{mExtra.total_elevation_gain} <span className="text-[10px] font-normal">M</span></span>
                                                </div>
                                            )}
                                            {mExtra.average_speed && (
                                                <div>
                                                    <span className="block text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Ritmo Medio</span>
                                                    <span className="font-['Inter'] font-black text-white text-lg">
                                                        {Math.floor(1000 / mExtra.average_speed / 60)}:
                                                        {Math.round((1000 / mExtra.average_speed) % 60).toString().padStart(2, '0')} <span className="text-[10px] font-normal">/KM</span>
                                                    </span>
                                                </div>
                                            )}
                                            {mExtra.suffer_score && (
                                                <div>
                                                    <span className="block text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Suffer Score</span>
                                                    <span className="font-['Inter'] font-black text-[#FC4C02] text-lg">{mExtra.suffer_score}</span>
                                                </div>
                                            )}
                                            {mExtra.calories !== undefined && (
                                                <div>
                                                    <span className="block text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Calorías</span>
                                                    <span className="font-['Inter'] font-black text-white text-lg">{Math.round(mExtra.calories)} <span className="text-[10px] font-normal">KCAL</span></span>
                                                </div>
                                            )}
                                            {mExtra.steps !== undefined && (
                                                <div>
                                                    <span className="block text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Pasos est.</span>
                                                    <span className="font-['Inter'] font-black text-white text-lg">{mExtra.steps.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Editor Formulario */}
                            <form onSubmit={handleSaveLog} className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-[1.2] group">
                                        <label className="block text-[10px] font-['Space_Grotesk'] uppercase font-bold tracking-widest text-outline group-focus-within:text-primary mb-1 transition-colors">Vol. / Tiempo</label>
                                        <div className="flex gap-1.5">
                                            <div className="relative flex-1">
                                                <input
                                                    type="number" step="0.1"
                                                    value={distance}
                                                    onChange={e => setDistance(e.target.value)}
                                                    placeholder="0.0"
                                                    className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-center font-['Inter'] font-black text-xl focus:ring-1 focus:ring-primary/50"
                                                />
                                                <span className="absolute right-1 top-4 text-[9px] font-['Space_Grotesk'] text-outline opacity-50">KM</span>
                                            </div>
                                            <div className="relative flex-1">
                                                <input
                                                    type="number" step="1"
                                                    value={duration}
                                                    onChange={e => setDuration(e.target.value)}
                                                    placeholder="00"
                                                    className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-center font-['Inter'] font-black text-xl focus:ring-1 focus:ring-primary/50"
                                                />
                                                <span className="absolute right-1 top-4 text-[9px] font-['Space_Grotesk'] text-outline opacity-50">MIN</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-[0.8] group">
                                        <label className="block font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-primary mb-1">Esfuerzo: RPE {rpe}</label>
                                        <input
                                            type="range" min="1" max="10"
                                            value={rpe}
                                            onChange={e => setRpe(parseInt(e.target.value))}
                                            className="w-full mt-3 h-1.5 bg-surface-variant rounded-lg appearance-none cursor-pointer rpe-slider"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-['Space_Grotesk'] uppercase font-bold tracking-widest text-outline mb-1">Notas y Sensaciones</label>
                                    <textarea
                                        rows={2}
                                        value={feelings}
                                        onChange={e => setFeelings(e.target.value)}
                                        placeholder="Analítica biomecánica post-carrera..."
                                        className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-sm font-['Inter'] resize-none focus:ring-1 focus:ring-primary/50"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className={`flex-1 font-['Inter'] font-black uppercase text-sm py-3 rounded-xl transition-all shadow-lg active:scale-95 ${existingLogId ? 'bg-orange-500 text-black shadow-orange-500/20' : 'bg-primary text-black kinetic-gradient shadow-primary/20'} ${isSaving ? 'opacity-50' : ''}`}
                                    >
                                        {isSaving ? "Guardando..." : (existingLogId ? "💾 Actualizar Log" : "⚡ Registrar Log")}
                                    </button>

                                    {existingLogId && (
                                        <button
                                            type="button"
                                            onClick={handleDeleteLog}
                                            disabled={isSaving}
                                            title="Eliminar Log de la Base de Datos"
                                            className="w-12 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-black rounded-xl transition-all shadow-lg active:scale-90 disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    )}
                                </div>
                            </form>
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="w-full mt-6 bg-surface-variant hover:bg-surface-high py-3 rounded-xl font-['Space_Grotesk'] font-bold text-xs uppercase tracking-widest transition-colors"
                            >
                                Cerrar Detalles
                            </button>
                        </div>
                    </div>
                );
            })()}

        </div>
    );
}
