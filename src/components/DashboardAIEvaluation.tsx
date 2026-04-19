import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAthlete } from '../context/AthleteContext';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function DashboardAIEvaluation() {
    const { geminiApiKey, name, hrZones } = useAthlete();
    const [evaluation, setEvaluation] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchAndEvaluate = async () => {
            const todayStr = new Date().toDateString();
            const cachedDate = localStorage.getItem('valencia2026_ai_eval_date');
            const cachedText = localStorage.getItem('valencia2026_ai_eval_text');

            if (cachedDate === todayStr && cachedText) {
                if (isMounted) setEvaluation(cachedText);
                return; // Already evaluated today
            }

            if (!geminiApiKey) {
                if (isMounted) setEvaluation("Configura tu API Key de Gemini en Ajustes para recibir tu valoración diaria.");
                return;
            }

            setIsLoading(true);

            try {
                // Fetch last 7 days of logs
                const today = new Date();
                const startOf7Days = new Date(today);
                startOf7Days.setDate(today.getDate() - 7);
                startOf7Days.setHours(0, 0, 0, 0);

                const { data: logs, error } = await supabase
                    .from('logs_entrenamiento')
                    .select('fecha_completada, distancia_real_km, duracion_real_mins, rpe_real, sentimientos, metricas_extra')
                    .gte('fecha_completada', startOf7Days.toISOString())
                    .order('fecha_completada', { ascending: true });

                const logsStr = logs && logs.length > 0
                    ? JSON.stringify(logs, null, 2)
                    : "No hay registros en los últimos 7 días. Está en reposo total o inactivo.";

                const genAI = new GoogleGenerativeAI(geminiApiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                const prompt = `Eres "La Voz de Valencia", el AI Coach oficial y motivacional del Maratón de Valencia 2026 para el atleta ${name || 'Atleta'}.
Eres súper cálido, amable y celebras cada paso adelante.
Hoy es ${today.toLocaleDateString()}.
Zonas de Frecuencia Cardíaca del atleta: Z2 (Aeróbico) es aprox ${hrZones?.z2[0]}-${hrZones?.z2[1]} bpm.

Estos son los entrenamientos del atleta en los últimos 7 días (JSON extraído de Supabase):
${logsStr}

Tu tarea:
Proporciona una valoración extremadamente concisa y analítica de su ESTADO ACTUAL basándote ÚNICAMENTE en esos datos.
1. Analiza su carga de trabajo, sus métricas o su falta de entrenamiento.
2. Devuélveme exactamente 2 frases cortas evaluando el estado físico actual.
3. Termina con tu mantra: "Valencia es tuya, paso a paso llegaremos juntos a la meta.". No uses saludos ni formato Assistant. Si no hay datos, sé cálido e ínstalo a registrar algún entreno.`;

                const result = await model.generateContent(prompt);
                const response = result.response;
                const text = response.text();

                if (isMounted) {
                    setEvaluation(text.trim());
                    localStorage.setItem('valencia2026_ai_eval_date', todayStr);
                    localStorage.setItem('valencia2026_ai_eval_text', text.trim());
                }
            } catch (err: any) {
                console.error("AI Evaluation error:", err);
                if (isMounted) setEvaluation(`Error: ${err?.message || err}`);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchAndEvaluate();
        return () => { isMounted = false; };
    }, [geminiApiKey, name, hrZones]);

    const handleForceRefresh = () => {
        localStorage.removeItem('valencia2026_ai_eval_date');
        localStorage.removeItem('valencia2026_ai_eval_text');
        window.location.reload();
    };

    if (isLoading) {
        return (
            <div className="bg-surface-container/50 border border-primary/20 rounded-xl p-4 flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary/50 text-xl font-light">robot_2</span>
                </div>
                <div className="flex-1 space-y-2">
                    <div className="h-2 bg-surface-container rounded w-3/4"></div>
                    <div className="h-2 bg-surface-container rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (!evaluation) return null;

    return (
        <div className="bg-surface-container-low rounded-xl p-4 md:p-5 relative overflow-hidden group shadow-lg border border-white/5">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-opacity group-hover:opacity-10">
                <span className="material-symbols-outlined text-8xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>neurology</span>
            </div>

            <div className="flex items-start gap-4 relative z-10">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1 border border-primary/20">
                    <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-[#FC4C02]">Diagnóstico del Coach</span>
                        <button
                            onClick={handleForceRefresh}
                            className="text-zinc-500 hover:text-white transition-colors"
                            title="Actualizar valoración"
                        >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                        </button>
                    </div>
                    <p className="font-['Inter'] text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
                        {evaluation}
                    </p>
                </div>
            </div>
        </div>
    );
}
