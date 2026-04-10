import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getPhaseForDate, getDailyFocus, getTrainingDetails } from '../utils/trainingLogic';
import { useAthlete } from '../context/AthleteContext';

export default function CalendarView() {
    const { hrZones } = useAthlete();
    const today = new Date();

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
                .lte('fecha_completada', endOfDay.toISOString())
                .limit(1)
                .maybeSingle(); // maybeSingle allows 0 rows without error

            if (data) {
                setExistingLogId(data.id);
                setDistance(data.distancia_real_km?.toString() || '');
                setDuration(data.duracion_real_mins?.toString() || '');
                setRpe(data.rpe_real || 7);
                setFeelings(data.sentimientos || '');
            } else {
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
                .select('fecha_completada')
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

    return (
        <div className="max-w-2xl mx-auto px-6 pb-32 pt-4">
            {/* Header */}
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="font-['Inter'] font-black text-4xl uppercase tracking-tighter leading-none">PLAN</h1>
                    <span className="font-['Space_Grotesk'] text-primary font-bold tracking-widest text-sm">MACROCICLO</span>
                </div>

                <div className="flex bg-surface-container-high rounded-lg p-1">
                    <button onClick={handlePrevMonth} className="px-3 py-2 rounded-md hover:bg-surface-variant transition-colors">
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <div className="px-4 py-2 font-['Space_Grotesk'] font-bold text-sm min-w-[120px] text-center uppercase tracking-widest">
                        {monthNames[month]} {year}
                    </div>
                    <button onClick={handleNextMonth} className="px-3 py-2 rounded-md hover:bg-surface-variant transition-colors">
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                </div>
            </header>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
                    <div key={day} className="text-center font-['Space_Grotesk'] text-[10px] text-zinc-500 font-bold uppercase tracking-widest py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5 md:gap-2">
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

                    // Check if a log exists
                    const dayLog = monthLogs.find(log => new Date(log.fecha_completada).getDate() === d);

                    let statusClass = '';
                    let statusIcon = null;

                    if (dayLog) {
                        statusClass = 'border-green-500/50 outline outline-1 outline-green-500/30';
                        statusIcon = <span className="absolute top-1 left-1 text-[12px] text-green-500 material-symbols-outlined z-20" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>;
                    } else if (isPast && !isRestDay) {
                        statusClass = 'border-red-500/50 opacity-60 grayscale';
                        statusIcon = <span className="absolute top-1 left-1 text-[12px] text-red-500 material-symbols-outlined z-20" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>;
                    } else if (isPast && isRestDay) {
                        statusClass = 'border-zinc-700/30 opacity-40 grayscale';
                    }

                    return (
                        <button
                            key={d}
                            onClick={() => setSelectedDate(new Date(year, month, d))}
                            className={`flex flex-col min-h-[80px] md:min-h-[100px] p-1 md:p-2 rounded-lg border-t-2 relative overflow-hidden transition-all text-left group hover:brightness-125
                ${phase.border}
                ${statusClass}
                ${isToday ? 'ring-2 ring-primary bg-primary/10' : 'bg-surface-container-low'}
              `}
                        >
                            {statusIcon}
                            {isToday && (
                                <div className="absolute top-0 right-0 w-8 h-8 bg-primary blur-xl opacity-30 z-0"></div>
                            )}

                            <div className="flex justify-between items-start mb-auto z-10 w-full relative">
                                <span className={`font-['Inter'] font-bold text-sm ${isToday ? 'text-primary' : 'text-on-surface'} ${statusIcon ? 'ml-3' : ''}`}>
                                    {d}
                                </span>
                                <span className="material-symbols-outlined text-[12px] opacity-60 mt-0.5 group-hover:opacity-100 transition-opacity" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    {focus.icon}
                                </span>
                            </div>

                            <div className="z-10 mt-2 w-full">
                                <span className="block font-['Space_Grotesk'] text-[8px] md:text-[9px] uppercase tracking-tighter text-zinc-400 truncate">
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
