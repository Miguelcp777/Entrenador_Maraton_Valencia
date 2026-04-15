import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { getPhaseForDate, getDailyFocus, getTrainingDetails } from '../utils/trainingLogic';
import { useAthlete } from '../context/AthleteContext';

export default function Today() {
    const { hrZones } = useAthlete();
    const [rpe, setRpe] = useState(7);
    const [distance, setDistance] = useState('');
    const [duration, setDuration] = useState('');
    const [feelings, setFeelings] = useState('');

    const todayDate = new Date();
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const formattedDate = `${monthNames[todayDate.getMonth()]} ${todayDate.getDate()} / ${todayDate.getFullYear()}`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validar efecto interferencia, riesgo biomecánico...

        try {
            // RLS activo: El usuario debe estar autenticado. (Mockeando contexto para prueba)
            const { data, error } = await supabase
                .from('logs_entrenamiento')
                .insert([
                    {
                        distancia_real_km: parseFloat(distance) || 0,
                        duracion_real_mins: parseInt(duration) || 0,
                        rpe_real: rpe,
                        sentimientos: feelings,
                        // session_id y atleta_id se mapearían aquí desde el Auth context local
                    }
                ]);

            if (error) {
                console.error("Supabase Error:", error);
                alert("⚠️ Error: " + error.message + "\n(Recuerda autenticarte o deshabilitar RLS temporalmente para pruebas)");
            } else {
                alert("🔥 ¡Entreno registrado en el Kinetic Lab Server!");
                setDistance('');
                setDuration('');
                setFeelings('');
                setRpe(7);
            }
        } catch (err) {
            console.error("Runtime error:", err);
        }
    };

    const currentDayOfWeek = todayDate.getDay();
    const phase = getPhaseForDate(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
    const focus = getDailyFocus(currentDayOfWeek, phase.name);
    const { detailMock, metricMock, hrZonesTarget } = getTrainingDetails(focus.label, phase.name);

    return (
        <div className="max-w-2xl mx-auto px-6 pb-32 pt-4">
            {/* Today Header */}
            <header className="mb-10">
                <div className="flex justify-between items-end mb-2">
                    <h1 className="font-['Inter'] font-black text-5xl uppercase tracking-tighter leading-none">TODAY</h1>
                    <span className="font-['Space_Grotesk'] text-primary font-bold tracking-widest text-sm">{formattedDate}</span>
                </div>
                <div className="h-1 w-12 kinetic-gradient"></div>
            </header>

            {/* Coach's Purpose / Highlight Block */}
            <section className="mb-12 relative overflow-hidden group">
                <div className="absolute inset-0 bg-surface-container-low opacity-50"></div>
                <div className={`relative p-6 border-l-4 ${focus.label === 'OFF / Inactivo' ? 'border-zinc-700' : 'border-primary'} bg-surface-container-low`}>
                    <div className="flex items-center gap-2 mb-4">
                        <span className={`material-symbols-outlined text-sm ${focus.label === 'OFF / Inactivo' ? 'text-zinc-600' : 'text-primary'}`}>rocket_launch</span>
                        <span className={`font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-[0.2em] ${focus.label === 'OFF / Inactivo' ? 'text-zinc-600' : 'text-primary'}`}>Valencia 2026 Protocol</span>
                    </div>
                    <h2 className="font-['Inter'] font-extrabold text-2xl mb-2 text-on-surface">Focus: {focus.label}</h2>
                    <p className="text-on-surface-variant text-sm leading-relaxed max-w-md">
                        {detailMock}
                    </p>
                    <div className="mt-6 flex gap-4 border-t border-white/5 pt-6">
                        <div className="flex flex-col">
                            <span className="font-['Space_Grotesk'] text-[10px] text-outline uppercase tracking-widest mb-1">Expected Volume</span>
                            <span className="font-['Inter'] font-black text-2xl">{metricMock}</span>
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
                                <div className="flex flex-col border-l border-white/10 pl-4">
                                    <span className={`font-['Space_Grotesk'] text-[10px] uppercase tracking-widest mb-1 ${colorClass.replace('400', '500/70').replace('500', '500/70')}`}>
                                        Target HR (Zonas {hrZonesTarget[0].toUpperCase()}{hrZonesTarget.length > 1 ? `-${maxZone.toUpperCase()}` : ''})
                                    </span>
                                    <span className={`font-['Inter'] font-black text-2xl ${colorClass}`}>
                                        {hrZones[hrZonesTarget[0]][0]} - {hrZones[maxZone][1]} <span className="text-[10px] font-['Space_Grotesk']">LPM</span>
                                    </span>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </section>

            {/* Registration Form */}
            <form className="space-y-10" onSubmit={handleSubmit}>
                <div className="group">
                    <div className="flex gap-6">
                        <div className="flex-1 relative border-b-2 border-transparent focus-within:border-primary/30 transition-all">
                            <label className="block font-['Space_Grotesk'] text-xs uppercase font-bold tracking-widest text-outline group-focus-within:text-primary transition-colors mb-2">Distance</label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="00.0"
                                value={distance}
                                onChange={(e) => setDistance(e.target.value)}
                                className="w-full bg-surface-container-lowest border-none text-on-surface font-['Inter'] font-black text-4xl py-2 px-0 placeholder:text-surface-container-highest focus:ring-0"
                            />
                            <div className="absolute right-0 bottom-3 font-['Inter'] font-bold text-xs text-surface-container-highest uppercase tracking-tighter">KM</div>
                        </div>
                        <div className="flex-1 relative border-b-2 border-transparent focus-within:border-primary/30 transition-all">
                            <label className="block font-['Space_Grotesk'] text-xs uppercase font-bold tracking-widest text-outline group-focus-within:text-primary transition-colors mb-2">Time</label>
                            <input
                                type="number"
                                step="1"
                                placeholder="00"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="w-full bg-surface-container-lowest border-none text-on-surface font-['Inter'] font-black text-4xl py-2 px-0 placeholder:text-surface-container-highest focus:ring-0"
                            />
                            <div className="absolute right-0 bottom-3 font-['Inter'] font-bold text-xs text-surface-container-highest uppercase tracking-tighter">MINS</div>
                        </div>

                    </div>
                </div>

                {/* RPE Selector */}
                <div className="bg-surface-container-low p-8 rounded-lg">
                    <div className="flex justify-between items-center mb-8">
                        <label className="font-['Space_Grotesk'] text-xs uppercase font-bold tracking-widest text-primary">Rate of Perceived Exertion</label>
                        <div className="font-['Inter'] font-black text-4xl text-primary">{rpe}</div>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={rpe}
                        onChange={(e) => setRpe(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-surface-variant rounded-lg appearance-none cursor-pointer rpe-slider"
                    />
                    <div className="flex justify-between mt-4 font-['Space_Grotesk'] text-[10px] text-outline uppercase tracking-tighter">
                        <span>Rest</span>
                        <span>Moderate</span>
                        <span>Max Effort</span>
                    </div>
                </div>

                {/* Feelings Textarea */}
                <div>
                    <label className="block font-['Space_Grotesk'] text-xs uppercase font-bold tracking-widest text-outline mb-4">Post-Session Feelings</label>
                    <textarea
                        rows={3}
                        placeholder="How did the engine feel today? ¿Dolor articular?"
                        value={feelings}
                        onChange={(e) => setFeelings(e.target.value)}
                        className="w-full bg-surface-container-low border-none rounded-lg p-6 text-on-surface font-['Inter'] text-base placeholder:text-outline-variant focus:ring-1 focus:ring-primary/30 transition-all"
                    />
                </div>

                {/* Save Button */}
                <button
                    type="submit"
                    className="w-full kinetic-gradient py-6 rounded-lg font-['Inter'] font-black text-lg uppercase tracking-widest text-on-primary-fixed shadow-[0_8px_32px_rgba(255,102,0,0.2)] active:scale-[0.98] transition-all"
                >
                    Submit Session Data
                </button>
            </form>

            {/* Floating Action Button (FAB) */}
            <button className="fixed bottom-24 right-6 w-14 h-14 bg-surface-variant/80 backdrop-blur-xl rounded-xl flex items-center justify-center text-primary shadow-2xl border border-white/5 z-40 active:scale-90 transition-transform">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
            </button>
        </div>
    );
}
