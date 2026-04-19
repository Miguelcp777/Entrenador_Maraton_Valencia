import { useState, useEffect } from 'react';
import { useAthlete } from '../context/AthleteContext';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Props {
    weightLogs: { dateStr: string; weight: number }[];
}

export default function WeightFeedback({ weightLogs }: Props) {
    const { geminiApiKey, targetWeight } = useAthlete();
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchFeedback = async () => {
            if (!geminiApiKey || weightLogs.length < 1) {
                if (isMounted) {
                    setFeedback("Aún no tienes suficientes registros para que pueda analizar tu progresión. ¡A la báscula!");
                    setIsLoading(false);
                }
                return;
            }

            setIsLoading(true);
            try {
                const genAI = new GoogleGenerativeAI(geminiApiKey);
                // We use gemini-1.5-flash as the standard model since it's the current default
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                const recentLogs = weightLogs.slice(-5).map(l => `${l.dateStr}: ${l.weight}kg`).join(', ');

                const prompt = `Eres "Aurelio", un Elite Hybrid Performance Coach exigente de maratón.
                El atleta tiene un objetivo de peso de ${targetWeight}kg. 
                Sus últimos pesajes son: ${recentLogs}.
                Dame un comentario muy breve (máximo 2 frases) analizando la tendencia del peso. Sé directo, rudo si sube injustificadamente o se estanca, y reconoce el esfuerzo si baja, pero sin ser blando. Sin formato markdown, puro texto plano. Termina con tu mantra: "Fuerza para sostener el impacto, corazón para sostener el ritmo".`;

                const result = await model.generateContent(prompt);
                const responseText = result.response.text();

                if (isMounted) {
                    setFeedback(responseText);
                }
            } catch (err) {
                console.error("Gemini err:", err);
                if (isMounted) setFeedback("La telemetría está fallando. Concéntrate en la báscula y no en mi voz ahora mismo.");
            }
            if (isMounted) setIsLoading(false);
        };

        const timeoutId = setTimeout(fetchFeedback, 1000); // debounce slightly
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [weightLogs, geminiApiKey, targetWeight]);

    if (!geminiApiKey || weightLogs.length < 1) return null;

    return (
        <div className="mt-4 bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-3 items-start relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined text-9xl">robot_2</span>
            </div>
            <div className="bg-primary/20 p-2 rounded-lg shrink-0">
                <span className="material-symbols-outlined text-primary text-xl">psychology</span>
            </div>
            <div className="flex-1">
                <span className="font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-primary mb-1 block">Aurelio AI Analysis</span>
                {isLoading || !feedback ? (
                    <div className="flex gap-1 mt-2 mb-1">
                        <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                ) : (
                    <p className="text-sm font-['Inter'] text-zinc-300 leading-relaxed italic border-l-2 border-primary/30 pl-3">"{feedback}"</p>
                )}
            </div>
        </div>
    );
}
