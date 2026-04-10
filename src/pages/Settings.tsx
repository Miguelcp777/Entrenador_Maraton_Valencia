import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAthlete } from '../context/AthleteContext';

export default function Settings() {
    const navigate = useNavigate();
    const {
        weight, setWeight, targetWeight, setTargetWeight,
        name, setName, avatarUrl, setAvatarUrl,
        height, setHeight, birthDate, setBirthDate, restingHR, setRestingHR,
        geminiApiKey, setGeminiApiKey, stravaTokens, setStravaTokens
    } = useAthlete();
    const [isUpdating, setIsUpdating] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);

        try {
            const { data } = await supabase.from('perfil_atleta').select('id').limit(1).single();

            if (data) {
                const { error } = await supabase.from('perfil_atleta').update({
                    peso_actual: weight,
                    peso_objetivo: targetWeight,
                    nombre: name,
                    avatar_url: avatarUrl,
                    altura: height,
                    fecha_nacimiento: birthDate,
                    fc_reposo: restingHR
                }).eq('id', data.id);

                if (error) {
                    alert("Error guardando en Supabase: " + error.message);
                } else {
                    alert("✅ Biometría y Perfil actualizados en la BBDD.");
                    navigate('/');
                }
            } else {
                alert("⚠ Error: No se encontró un perfil de atleta en la Base de Datos para actualizar. Revisa que el script semilla de Supabase se ejecutó y las políticas (RLS) permiten acceso.");
                navigate('/');
            }
        } catch (error: any) {
            console.error(error);
            alert("Excepción de red al guardar en Supabase: " + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-6 pb-32 pt-4">
            <header className="mb-10">
                <div className="flex justify-between items-end mb-2">
                    <h1 className="font-['Inter'] font-black text-4xl uppercase tracking-tighter leading-none">AJUSTES</h1>
                    <span className="font-['Space_Grotesk'] text-primary font-bold tracking-widest text-sm">SISTEMA</span>
                </div>
                <div className="h-1 w-12 kinetic-gradient"></div>
            </header>

            <form onSubmit={handleUpdateSettings} className="space-y-8">

                {/* User Profile Section */}
                <div className="bg-surface-container-low p-6 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-surface-container-high border-2 border-primary/20 flex flex-shrink-0 items-center justify-center overflow-hidden">
                            <img
                                alt="athlete"
                                className="w-full h-full object-cover"
                                src={avatarUrl}
                            />
                        </div>
                        <div>
                            <h2 className="font-['Inter'] font-black text-xl text-on-surface uppercase tracking-tighter">{name}</h2>
                            <span className="font-['Space_Grotesk'] text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Valencia 2026 Protocol</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="group">
                            <label className="block font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-outline group-focus-within:text-primary mb-2 transition-colors">
                                Nombre del Atleta
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-surface-container-lowest border-none rounded-lg p-4 text-on-surface font-['Inter'] focus:ring-1 focus:ring-primary/50 transition-all font-bold placeholder:text-surface-container-highest"
                                placeholder="E.g. David Goggins"
                            />
                        </div>
                        <div className="group">
                            <label className="block font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-outline group-focus-within:text-primary mb-2 transition-colors">
                                Foto de Perfil
                            </label>
                            <div className="relative w-full bg-surface-container-lowest border-none rounded-lg p-2 text-on-surface/80 font-['Inter'] text-sm focus-within:ring-1 focus-within:ring-primary/50 transition-all flex items-center justify-between group-hover:bg-surface-container-low">
                                <span className="truncate w-3/4 pl-2 opacity-60 font-medium">
                                    {avatarUrl && avatarUrl.startsWith('data:')
                                        ? '✓ Imagen cargada lista'
                                        : (avatarUrl ? 'URL o Imagen Activa' : 'Sin imagen seleccionada')}
                                </span>
                                <label className="cursor-pointer bg-primary/10 text-primary px-4 py-3 rounded text-xs font-bold font-['Space_Grotesk'] uppercase tracking-widest hover:bg-primary hover:text-black transition-all active:scale-95">
                                    Subir Archivo
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Biometrics Block */}
                <div className="bg-surface-container-low p-6 rounded-xl border border-l-4 border-l-primary border-t-white/5 border-r-white/5 border-b-white/5">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-primary text-sm">monitor_weight</span>
                        <h2 className="font-['Inter'] font-bold text-lg uppercase tracking-tighter">Biometría y Chasis</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="group">
                            <label className="block font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-outline group-focus-within:text-primary mb-2 transition-colors">
                                Peso Actual (KG)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={weight}
                                onChange={(e) => setWeight(parseFloat(e.target.value))}
                                className="w-full bg-surface-container-lowest border-none font-['Inter'] font-black text-3xl py-4 rounded-lg placeholder:text-surface-container-highest focus:ring-1 focus:ring-primary/50 transition-all text-center"
                            />
                        </div>
                        <div className="group">
                            <label className="block font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-outline group-focus-within:text-primary mb-2 transition-colors">
                                Peso Objetivo (KG)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={targetWeight}
                                onChange={(e) => setTargetWeight(parseFloat(e.target.value))}
                                className="w-full bg-surface-container-lowest border-none font-['Inter'] font-black text-3xl py-4 rounded-lg placeholder:text-surface-container-highest focus:ring-1 focus:ring-primary/50 transition-all text-center text-primary"
                            />
                        </div>
                    </div>
                    <p className="font-['Space_Grotesk'] text-[11px] text-zinc-500 mt-4 leading-relaxed">
                        El motor ajustará automáticamente el riesgo biomecánico de las tiradas largas si el peso supera los 100 kg. Nunca reduzcas calorías los días de tirada larga.
                    </p>
                    <div className="group">
                        <label className="block font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-outline group-focus-within:text-primary mb-2 transition-colors">
                            Edad / Nacimiento
                        </label>
                        <input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="w-full bg-surface-container-lowest border-none font-['Inter'] font-black text-xl py-4 rounded-lg placeholder:text-surface-container-highest focus:ring-1 focus:ring-primary/50 transition-all text-center"
                        />
                    </div>
                    <div className="group">
                        <label className="block font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-outline group-focus-within:text-primary mb-2 transition-colors">
                            Altura (CM)
                        </label>
                        <input
                            type="number"
                            value={height}
                            onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                            className="w-full bg-surface-container-lowest border-none font-['Inter'] font-black text-3xl py-4 rounded-lg placeholder:text-surface-container-highest focus:ring-1 focus:ring-primary/50 transition-all text-center"
                        />
                    </div>
                    <div className="group col-span-2">
                        <label className="block font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-outline group-focus-within:text-red-500 mb-2 transition-colors text-center">
                            Pulsaciones en Reposo (BPM)
                        </label>
                        <input
                            type="number"
                            value={restingHR}
                            onChange={(e) => setRestingHR(parseInt(e.target.value) || 0)}
                            className="w-full bg-surface-container-lowest border-none font-['Inter'] font-black text-3xl py-4 rounded-lg placeholder:text-surface-container-highest focus:ring-1 focus:ring-red-500/50 transition-all text-center text-red-500"
                        />
                    </div>
                </div>

                {(() => {
                    const dob = new Date(birthDate);
                    const today = new Date();
                    let age = today.getFullYear() - dob.getFullYear();
                    const m = today.getMonth() - dob.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

                    const maxHR = 220 - (age || 30);
                    const hrr = maxHR - restingHR;

                    const z1 = [Math.round(hrr * 0.5 + restingHR), Math.round(hrr * 0.6 + restingHR)];
                    const z2 = [Math.round(hrr * 0.6 + restingHR), Math.round(hrr * 0.7 + restingHR)];
                    const z3 = [Math.round(hrr * 0.7 + restingHR), Math.round(hrr * 0.8 + restingHR)];
                    const z4 = [Math.round(hrr * 0.8 + restingHR), Math.round(hrr * 0.9 + restingHR)];
                    const z5 = [Math.round(hrr * 0.9 + restingHR), maxHR];

                    return (
                        <div className="bg-surface-container-low p-6 rounded-xl border border-red-500/20 ambient-glow">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-red-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                <h2 className="font-['Inter'] font-bold text-lg uppercase tracking-tighter">Zonas de Ritmo Cardíaco (Karvonen)</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6 text-center">
                                <div className="bg-surface-container-lowest p-3 rounded-lg border border-white/5">
                                    <span className="block font-['Space_Grotesk'] text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Max HR</span>
                                    <span className="block text-2xl font-black font-['Inter'] text-red-500">{maxHR} <span className="text-[10px] font-['Space_Grotesk'] text-zinc-500">LPM</span></span>
                                </div>
                                <div className="bg-surface-container-lowest p-3 rounded-lg border border-white/5">
                                    <span className="block font-['Space_Grotesk'] text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Edad Activa</span>
                                    <span className="block text-2xl font-black font-['Inter'] text-zinc-300">{age || 0} <span className="text-[10px] font-['Space_Grotesk'] text-zinc-500">AÑOS</span></span>
                                </div>
                            </div>

                            <div className="space-y-3 font-['Inter'] text-sm">
                                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                    <span className="font-bold text-zinc-400">Z1 - Recuperación <span className="text-[10px] ml-1 font-['Space_Grotesk'] tracking-wider opacity-60">50-60%</span></span>
                                    <span className="font-['Space_Grotesk'] font-bold text-zinc-300">{z1[0]} - {z1[1]} LPM</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-blue-500/10 bg-blue-500/5 -mx-4 px-4 rounded">
                                    <span className="font-bold text-blue-400">Z2 - Base Aeróbica <span className="text-[10px] ml-1 font-['Space_Grotesk'] tracking-wider opacity-60">60-70%</span></span>
                                    <span className="font-['Space_Grotesk'] font-bold text-blue-400">{z2[0]} - {z2[1]} LPM</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="font-bold text-green-400">Z3 - Tempo <span className="text-[10px] ml-1 font-['Space_Grotesk'] tracking-wider opacity-60">70-80%</span></span>
                                    <span className="font-['Space_Grotesk'] font-bold text-green-400">{z3[0]} - {z3[1]} LPM</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-orange-500/10 bg-orange-500/5 -mx-4 px-4 rounded">
                                    <span className="font-bold text-orange-400">Z4 - Umbral Anaeróbico <span className="text-[10px] ml-1 font-['Space_Grotesk'] tracking-wider opacity-60">80-90%</span></span>
                                    <span className="font-['Space_Grotesk'] font-bold text-orange-400">{z4[0]} - {z4[1]} LPM</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="font-bold text-red-500">Z5 - VO2 Máx <span className="text-[10px] ml-1 font-['Space_Grotesk'] tracking-wider opacity-60">90-100%</span></span>
                                    <span className="font-['Space_Grotesk'] font-bold text-red-500">{z5[0]} - {z5[1]} LPM</span>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* System Settings Block */}
                <div className="bg-surface-container-low p-6 rounded-xl border border-white/5 opacity-70">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-orange-400 text-sm">shield</span>
                            <h2 className="font-['Inter'] font-bold text-md uppercase tracking-tighter">Coach Hard Stop</h2>
                        </div>
                        <div className="w-10 h-6 bg-primary rounded-full relative">
                            <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full"></div>
                        </div>
                    </div>
                    <p className="font-['Space_Grotesk'] text-[10px] text-zinc-400">
                        Bloquear sesiones de carrera si RPE {'>'} 8 o se reporta dolor articular durante más de 3 días consecutivos.
                    </p>
                </div>

                {/* API Key Block */}
                <div className="bg-surface-container-low p-6 rounded-xl border border-white/5 opacity-70">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-teal-400 text-sm">api</span>
                            <h2 className="font-['Inter'] font-bold text-md uppercase tracking-tighter">Gemini API Key</h2>
                        </div>
                    </div>
                    <input
                        type="password"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-surface-container-lowest border-none font-['Space_Grotesk'] py-3 px-4 rounded-lg placeholder:text-surface-container-highest focus:ring-1 focus:ring-teal-500/50 transition-all text-sm mb-2 text-teal-400 font-bold tracking-widest"
                    />
                    <p className="font-['Space_Grotesk'] text-[10px] text-zinc-400 leading-relaxed">
                        Requerida para activar el Coach de IA. Almacenada estrictamente en LocalStorage. Si se borra caché, deberás introducirla de nuevo.
                    </p>
                </div>

                {/* Strava Auth Block */}
                <div className="bg-surface-container-low p-6 rounded-xl border border-white/5 opacity-70">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-orange-500 text-sm">sync</span>
                            <h2 className="font-['Inter'] font-bold text-md uppercase tracking-tighter">Strava Sync</h2>
                        </div>
                    </div>
                    {stravaTokens?.accessToken ? (
                        <div className="bg-surface-container-lowest p-3 rounded-lg border border-orange-500/30 text-center">
                            <span className="block font-['Space_Grotesk'] text-[10px] text-orange-500 uppercase tracking-widest font-bold mb-1">Estado de Conexión</span>
                            <span className="block text-sm font-bold font-['Inter'] text-zinc-200">✅ Conectado a Strava</span>
                            <button
                                type="button"
                                onClick={() => setStravaTokens({ accessToken: null, refreshToken: null, expiresAt: null })}
                                className="mt-2 text-[10px] text-zinc-500 underline uppercase"
                            >
                                Desconectar
                            </button>
                        </div>
                    ) : (
                        <a
                            href="https://www.strava.com/oauth/authorize?client_id=223033&response_type=code&redirect_uri=http://localhost:5173/strava/callback&approval_prompt=force&scope=activity:read_all"
                            className="block w-full text-center bg-[#FC4C02] text-white py-3 rounded-lg font-['Inter'] font-bold text-sm tracking-widest uppercase hover:bg-[#E34402] transition-colors"
                        >
                            Conectar con Strava
                        </a>
                    )}
                    <p className="font-['Space_Grotesk'] text-[10px] text-zinc-400 leading-relaxed mt-2">
                        Autoriza a la aplicación a leer tus actividades de Strava (Garmin) para extraer automáticamente km, ritmo y tiempo.
                    </p>
                </div>

                {/* DB Info */}
                <div className="text-center font-['Space_Grotesk'] text-[10px] text-zinc-600 font-bold tracking-widest uppercase">
                    Configuración Local v1.0<br />Supabase Connection Active
                </div>

                <button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full kinetic-gradient py-5 rounded-lg font-['Inter'] font-black text-lg uppercase tracking-widest text-on-primary-fixed shadow-[0_8px_32px_rgba(255,102,0,0.2)] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {isUpdating ? 'Actualizando Sistema...' : 'Aplicar Biometría'}
                </button>
            </form>
        </div>
    );
}
