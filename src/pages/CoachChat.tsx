import { useState, useEffect, useRef } from 'react';
import { useAthlete } from '../context/AthleteContext';
import { supabase } from '../supabaseClient';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Link } from 'react-router-dom';

export default function CoachChat() {
    const { name, weight, targetWeight, height, hrZones, complianceScore, geminiApiKey } = useAthlete();
    const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatSessionRef = useRef<any>(null);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Init Gemini Chat Session
    useEffect(() => {
        const initChat = async () => {
            if (!geminiApiKey) return;

            try {
                // Fetch Atleta ID
                const { data: atleta } = await supabase.from('perfil_atleta').select('id').limit(1).single();
                const currentAtletaId = atleta?.id;

                // Fetch recent logs
                const { data: logs } = await supabase
                    .from('logs_entrenamiento')
                    .select('*')
                    .order('fecha_completada', { ascending: false })
                    .limit(7);

                const logsContext = logs && logs.length > 0
                    ? logs.map((l: any) => `Día: ${l.fecha_completada}, RPE: ${l.rpe_real}, Dist/T: ${l.distancia_real_km}km/${l.duracion_real_mins}mins, Sensación: ${l.sensaciones}`).join(' | ')
                    : 'Sin registros aún.';

                // Fetch Chat History
                let dbChatHistory = null;
                if (currentAtletaId) {
                    const { data } = await supabase
                        .from('interacciones_chat')
                        .select('contexto_fatiga, mensaje_coach')
                        .eq('atleta_id', currentAtletaId)
                        .order('fecha', { ascending: true })
                        .limit(30);
                    dbChatHistory = data;
                }

                const systemInstruction = `Eres Aurelio, un entrenador personal exigente, directo e implacable. Tu objetivo es preparar al atleta para la Maratón de Valencia 2026 (Valencia 2026 Protocol). 
No seas cursi ni complaciente. Sé agresivo y empuja siempre al límite, pero con conocimiento técnico biomecánico y de programación del entrenamiento real. No uses hashtags ni formato de asistente.
Datos del Atleta: Nombre: ${name}, Peso Actual: ${weight}kg, Peso Objetivo: ${targetWeight}kg, Altura: ${height}cm.
Cumplimiento Actual del Plan: ${complianceScore}%. Muestra desprecio si el cumplimiento es bajo y orgullo rudo si es alto.
Zonas de Frecuencia Cardíaca (Karvonen): Z1: ${hrZones.z1[0]}-${hrZones.z1[1]}, Z2: ${hrZones.z2[0]}-${hrZones.z2[1]}, Z3: ${hrZones.z3[0]}-${hrZones.z3[1]}, Z4: ${hrZones.z4[0]}-${hrZones.z4[1]}, Z5: ${hrZones.z5[0]}-${hrZones.z5[1]}, MaxHR: ${hrZones.maxHR}.
Últimos entrenamientos completados en BD: ${logsContext}.
Si el RPE acumulado en los logs es consistentemente muy alto (ej. múltiples días > 8), o menciona dolores articulares, MÁNDALE AL DESCANSO. 
Tus respuestas deben ser concisas, al punto, llenas de determinación técnica y psicológicamente duras.`;

                const genAI = new GoogleGenerativeAI(geminiApiKey);
                // Usando Gemini 2.5 Flash por velocidad
                const model = genAI.getGenerativeModel({
                    model: "gemini-2.5-flash",
                    systemInstruction,
                    tools: [{
                        functionDeclarations: [
                            {
                                name: "registrar_entrenamiento",
                                description: "Registra un entrenamiento completado en la base de datos (calendario) para un día específico. Úsalo cuando el atleta te reporte que ha terminado de correr u otra actividad. IMPORTANTE: La fecha actual de hoy es " + new Date().toISOString().split('T')[0] + ".",
                                parameters: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        fecha: { type: SchemaType.STRING, description: "Fecha en formato YYYY-MM-DD" },
                                        distancia_km: { type: SchemaType.NUMBER, description: "Distancia en km (0 si es descanso o gym)" },
                                        duracion_mins: { type: SchemaType.INTEGER, description: "Duración en minutos totales (ej: 45)" },
                                        rpe: { type: SchemaType.INTEGER, description: "RPE (Esfuerzo Peribido) del 1 al 10" },
                                        notas: { type: SchemaType.STRING, description: "Resumen de las sensaciones" }
                                    },
                                    required: ["fecha", "distancia_km", "duracion_mins", "rpe", "notas"]
                                }
                            }
                        ]
                    }]
                });

                // Build history array
                const geminiHistory: any[] = [
                    { role: 'user', parts: [{ text: 'Hola Coach. Empieza la sesión.' }] },
                    { role: 'model', parts: [{ text: `¡ROMPAMOS ESTO, ${name.toUpperCase()}! Estás en un ${complianceScore}% de cumplimiento. ¿A qué estás esperando? ¡Háblame de tu entreno, de tus números o de tus excusas!` }] }
                ];

                const uiMessages: { role: string, text: string }[] = [
                    { role: 'model', text: `¡ROMPAMOS ESTO, ${name.toUpperCase()}! Estás en un ${complianceScore}% de cumplimiento. ¿A qué estás esperando? ¡Háblame de tu entreno, de tus números o de tus excusas!` }
                ];

                if (dbChatHistory && dbChatHistory.length > 0) {
                    dbChatHistory.forEach((row) => {
                        if (row.contexto_fatiga) {
                            geminiHistory.push({ role: 'user', parts: [{ text: row.contexto_fatiga }] });
                            uiMessages.push({ role: 'user', text: row.contexto_fatiga });
                        }
                        if (row.mensaje_coach) {
                            geminiHistory.push({ role: 'model', parts: [{ text: row.mensaje_coach }] });
                            uiMessages.push({ role: 'model', text: row.mensaje_coach });
                        }
                    });
                }

                chatSessionRef.current = model.startChat({ history: geminiHistory });
                setMessages(uiMessages);

            } catch (err) {
                console.error("Error init chat:", err);
            }
        };

        if (!chatSessionRef.current) {
            initChat();
        }
    }, [geminiApiKey, name, weight, targetWeight, height, complianceScore, hrZones]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || !chatSessionRef.current || !geminiApiKey) return;

        const userText = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setIsLoading(true);

        try {
            const result = await chatSessionRef.current.sendMessage(userText);
            const response = result.response;
            const functionCalls = response.functionCalls ? response.functionCalls() : null;
            const call = functionCalls && functionCalls.length > 0 ? functionCalls[0] : null;

            let responseText = "";

            if (call && call.name === "registrar_entrenamiento") {
                const args = call.args;

                let targetDate = new Date(args.fecha as string);
                if (isNaN(targetDate.getTime())) targetDate = new Date();
                targetDate.setHours(12, 0, 0, 0);

                const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

                const { data: atletaInfo } = await supabase.from('perfil_atleta').select('id').limit(1).single();

                if (atletaInfo?.id) {
                    const { data: existing } = await supabase.from('logs_entrenamiento')
                        .select('id')
                        .gte('fecha_completada', startOfDay.toISOString())
                        .lte('fecha_completada', endOfDay.toISOString())
                        .maybeSingle();

                    const payload = {
                        atleta_id: atletaInfo.id,
                        fecha_completada: targetDate.toISOString(),
                        distancia_real_km: parseFloat(args.distancia_km as any) || 0,
                        duracion_real_mins: parseInt(args.duracion_mins as any) || 0,
                        rpe_real: parseInt(args.rpe as any) || 7,
                        sentimientos: args.notas as string,
                    };

                    if (existing) {
                        await supabase.from('logs_entrenamiento').update(payload).eq('id', existing.id);
                    } else {
                        await supabase.from('logs_entrenamiento').insert([payload]);
                    }

                    const toolResult = await chatSessionRef.current.sendMessage([{
                        functionResponse: {
                            name: "registrar_entrenamiento",
                            response: { status: "success", message: "Entrenamiento insertado en Base de Datos. Confírmale al usuario con furia que el log está computado." }
                        }
                    }]);

                    responseText = toolResult.response.text();
                } else {
                    responseText = "Error interno DB.";
                }
            } else {
                responseText = response.text();
            }

            setMessages(prev => [...prev, { role: 'model', text: responseText }]);

            // Save interaction to Supabase Memory
            const { data: atleta } = await supabase.from('perfil_atleta').select('id').limit(1).single();
            if (atleta?.id) {
                await supabase.from('interacciones_chat').insert({
                    atleta_id: atleta.id,
                    contexto_fatiga: userText,
                    mensaje_coach: responseText
                });
            }

        } catch (error: any) {
            console.error("Gemini Error:", error);
            setMessages(prev => [...prev, { role: 'model', text: `ERROR DEL SISTEMA: ${error.message} - ¡Ajusta tu API Key o revisa tu conexión limitante!` }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!geminiApiKey) {
        return (
            <div className="max-w-2xl mx-auto px-6 pb-32 pt-4 flex flex-col justify-center items-center h-[80vh] text-center">
                <span className="material-symbols-outlined text-6xl text-primary mb-4">smart_toy</span>
                <h1 className="font-['Inter'] font-black text-3xl uppercase tracking-tighter mb-4">Coach Desconectado</h1>
                <p className="font-['Space_Grotesk'] text-zinc-400 mb-8 max-w-sm leading-relaxed">
                    El motor de inteligencia artificial necesita una API Key de Google Gemini para arrancar. Sin ella, el feedback cognitivo está muerto.
                </p>
                <Link to="/settings" className="bg-primary text-black px-8 py-3 rounded-xl font-['Inter'] font-black uppercase text-sm tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-transform">
                    Conectar Motor en Ajustes
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-24 pt-4 flex flex-col h-screen">
            <header className="mb-6 flex-shrink-0">
                <div className="flex justify-between items-end mb-2">
                    <h1 className="font-['Inter'] font-black text-4xl uppercase tracking-tighter leading-none">AI COACH</h1>
                    <span className="font-['Space_Grotesk'] text-primary font-bold tracking-widest text-[10px] flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        ONLINE
                    </span>
                </div>
                <div className="h-1 w-12 kinetic-gradient"></div>
            </header>

            <div className="flex-1 overflow-y-auto min-h-0 bg-surface-container/30 backdrop-blur-md rounded-2xl border border-white/5 p-4 mb-4 space-y-6 shadow-inner custom-scrollbar relative">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 md:p-5 ${msg.role === 'user' ? 'bg-surface-high border border-white/10 rounded-br-sm text-on-surface' : 'bg-primary/5 shadow-[0_0_15px_rgba(255,102,0,0.05)] border-l-2 border-primary rounded-bl-sm text-on-surface'}`}>
                            {msg.role === 'model' && (
                                <div className="flex items-center gap-2 mb-2 text-primary">
                                    <span className="material-symbols-outlined text-[12px]">smart_toy</span>
                                    <span className="font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest">Aurelio</span>
                                </div>
                            )}
                            <p className="font-['Inter'] font-medium text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl p-4 bg-primary/5 border-l-2 border-primary/50 rounded-bl-sm">
                            <span className="font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-primary/70 animate-pulse flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm animate-spin">sync</span> Procesando feedback...
                            </span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-2" />
            </div>

            <form onSubmit={handleSendMessage} className="flex-shrink-0 flex gap-2 relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Reporta un problema, pide consejo o rinde cuentas..."
                    className="flex-1 bg-surface-container-lowest border border-white/5 rounded-2xl px-5 py-4 font-['Space_Grotesk'] text-sm focus:ring-1 focus:ring-primary/50 text-on-surface placeholder:text-surface-highest transition-all"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="aspect-square bg-primary text-black rounded-2xl p-4 flex items-center justify-center hover:bg-white transition-colors disabled:opacity-50 active:scale-90 shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                </button>
            </form>
        </div>
    );
}
