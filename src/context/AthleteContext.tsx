import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { zonesForMaxHR, DEFAULT_MAX_HR, PLAN_START } from '../data/marathonPlan';

interface HRZones {
    z1: [number, number];
    z2: [number, number];
    z3: [number, number];
    z4: [number, number];
    z5: [number, number];
    maxHR: number;
}

interface AthleteContextProps {
    weight: number;
    setWeight: (weight: number) => void;
    targetWeight: number;
    setTargetWeight: (weight: number) => void;
    name: string;
    setName: (name: string) => void;
    avatarUrl: string;
    setAvatarUrl: (url: string) => void;
    height: number;
    setHeight: (height: number) => void;
    birthDate: string;
    setBirthDate: (date: string) => void;
    restingHR: number;
    setRestingHR: (hr: number) => void;
    maxHR: number;
    setMaxHR: (hr: number) => void;
    geminiApiKey: string;
    setGeminiApiKey: (key: string) => void;
    complianceScore: number;
    weeklyComplianceScore: number;
    hrZones: HRZones;
    stravaTokens: any;
    setStravaTokens: (tokens: any) => void;
}

const AthleteContext = createContext<AthleteContextProps | undefined>(undefined);

const getInitialState = <T,>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return defaultValue;
        }
    }
    return defaultValue;
};

export function AthleteProvider({ children }: { children: ReactNode }) {
    const [weight, setWeight] = useState<number>(() => getInitialState('athlete_weight', 105.0));
    const [targetWeight, setTargetWeight] = useState<number>(() => getInitialState('athlete_targetWeight', 102.0));
    const [name, setName] = useState<string>(() => getInitialState('athlete_name', "ATLETA HÍBRIDO"));
    const [avatarUrl, setAvatarUrl] = useState<string>(() => getInitialState('athlete_avatarUrl', "https://lh3.googleusercontent.com/aida-public/AB6AXuDe-3o1ulhMOZ9i_ZhHaKAoylggu4X9jusm_yyaho8X5s_2IhOx8J0VIK2xJzMQLMkqGhgWkDM5wjQEk1fxsmiJAEvtrkFnF9_GhxgV9a7gUz_DQTJSUZN9_CmDCwK0-spJMdVGnHvSs8yWFqnxJv-E-10c-kyQBtTjMMYL_Pt8D7V7MDh4N-pTfFIHqHe9KKrP43958s2yrJJMcyWN8MFLWabfnoZzfB8iP294IsPqedCAG8ZrOfR1pnDG94e9b1H759pf2jn49Jt9"));
    const [height, setHeight] = useState<number>(() => getInitialState('athlete_height', 180));
    const [birthDate, setBirthDate] = useState<string>(() => getInitialState('athlete_birthDate', "1990-01-01"));
    const [restingHR, setRestingHR] = useState<number>(() => getInitialState('athlete_restingHR', 50));
    const [maxHR, setMaxHR] = useState<number>(() => getInitialState('athlete_maxHR', DEFAULT_MAX_HR));
    const [geminiApiKey, setGeminiApiKey] = useState<string>(() => getInitialState('athlete_geminiApiKey', ""));
    const [stravaTokens, setStravaTokens] = useState<any>(() => getInitialState('strava_tokens', null));
    const [complianceScore, setComplianceScore] = useState<number>(0);
    const [weeklyComplianceScore, setWeeklyComplianceScore] = useState<number>(0);

    useEffect(() => {
        const fetchRemoteState = async () => {
            const { data, error } = await supabase.from('perfil_atleta').select('*').limit(1).maybeSingle();

            if (data && !error) {
                // Determine if we should update local state from DB
                // We prioritize DB value if it exists, otherwise keep local
                if (data.peso_objetivo) setTargetWeight(data.peso_objetivo);
                if (data.nombre) setName(data.nombre);
                if (data.avatar_url) setAvatarUrl(data.avatar_url);
                if (data.altura) setHeight(data.altura);
                if (data.fecha_nacimiento) setBirthDate(data.fecha_nacimiento);
                if (data.fc_reposo) setRestingHR(data.fc_reposo);
                // FC máx se guarda en localStorage (la tabla no tiene columna fc_maxima).
                if (data.fc_maxima) setMaxHR(data.fc_maxima); // se usará si añades la columna

                // Fetch latest weigh-in from records
                const { data: latestWeight, error: weightError } = await supabase
                    .from('registros_peso')
                    .select('peso_kg')
                    .eq('atleta_id', data.id)
                    .order('fecha', { ascending: false })
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (!weightError && latestWeight) {
                    setWeight(parseFloat(latestWeight.peso_kg));
                } else if (data.peso_actual) {
                    setWeight(parseFloat(data.peso_actual));
                }

                // ✅ Strava persistence
                if (data.strava_tokens && Object.keys(data.strava_tokens).length > 0) {
                    setStravaTokens(data.strava_tokens);
                    localStorage.setItem('strava_tokens', JSON.stringify(data.strava_tokens));
                } else if (stravaTokens && stravaTokens.accessToken) {
                    // Sync local to DB
                    await supabase.from('perfil_atleta').update({ strava_tokens: stravaTokens }).eq('id', data.id);
                }

                // ✅ Gemini persistence (Enhanced protection)
                if (data.gemini_api_key && data.gemini_api_key.trim().length > 5) {
                    setGeminiApiKey(data.gemini_api_key);
                    localStorage.setItem('athlete_geminiApiKey', JSON.stringify(data.gemini_api_key));
                } else if (geminiApiKey && geminiApiKey.trim().length > 5) {
                    // Sync local to DB if DB is empty but we have a key locally
                    await supabase.from('perfil_atleta').update({ gemini_api_key: geminiApiKey }).eq('id', data.id);
                }
            }


            // Calculate Compliance Score from logs
            const { count: logsCount } = await supabase
                .from('logs_entrenamiento')
                .select('*', { count: 'exact', head: true });

            const macroStart = PLAN_START.getTime(); // 22 jun 2026 (inicio del plan)
            const now = Date.now();
            if (now > macroStart) {
                const daysPassed = Math.floor((now - macroStart) / (1000 * 60 * 60 * 24));
                // El plan tiene 5 sesiones/semana (2 días de descanso).
                const expectedSessions = Math.max(1, Math.floor(daysPassed * (5 / 7)));
                const actualLogs = logsCount || 0;
                const score = Math.round((actualLogs / expectedSessions) * 100);
                setComplianceScore(Math.min(100, Math.max(0, score)));
            } else {
                setComplianceScore(0);
            }

            // Calculate Weekly Compliance (Logs from this Monday)
            const monday = new Date();
            const currentDay = monday.getDay();
            const diff = monday.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
            monday.setDate(diff);
            monday.setHours(0, 0, 0, 0);

            const { count: weeklyLogsCount } = await supabase
                .from('logs_entrenamiento')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', monday.toISOString());

            if (now > macroStart) {
                const todayIndex = currentDay === 0 ? 7 : currentDay;
                const expectedWeekly = Math.max(1, Math.floor(todayIndex * (5 / 7)));
                const weeklyScore = Math.round(((weeklyLogsCount || 0) / expectedWeekly) * 100);
                setWeeklyComplianceScore(Math.min(100, Math.max(0, weeklyScore)));
            } else {
                setWeeklyComplianceScore(0);
            }
        };
        fetchRemoteState();
    }, []);

    // Sync state changes to local storage & DB
    useEffect(() => { localStorage.setItem('athlete_weight', JSON.stringify(weight)); }, [weight]);
    useEffect(() => { localStorage.setItem('athlete_targetWeight', JSON.stringify(targetWeight)); }, [targetWeight]);
    useEffect(() => { localStorage.setItem('athlete_name', JSON.stringify(name)); }, [name]);
    useEffect(() => { localStorage.setItem('athlete_avatarUrl', JSON.stringify(avatarUrl)); }, [avatarUrl]);
    useEffect(() => { localStorage.setItem('athlete_height', JSON.stringify(height)); }, [height]);
    useEffect(() => { localStorage.setItem('athlete_birthDate', JSON.stringify(birthDate)); }, [birthDate]);
    useEffect(() => { localStorage.setItem('athlete_restingHR', JSON.stringify(restingHR)); }, [restingHR]);
    useEffect(() => { localStorage.setItem('athlete_maxHR', JSON.stringify(maxHR)); }, [maxHR]);

    useEffect(() => {
        localStorage.setItem('athlete_geminiApiKey', JSON.stringify(geminiApiKey));
        if (geminiApiKey) {
            supabase.from('perfil_atleta').select('id, gemini_api_key').limit(1).maybeSingle().then(({ data }) => {
                if (data?.id && data.gemini_api_key !== geminiApiKey) {
                    supabase.from('perfil_atleta').update({ gemini_api_key: geminiApiKey }).eq('id', data.id).then();
                }
            });
        }
    }, [geminiApiKey]);

    useEffect(() => {
        localStorage.setItem('strava_tokens', JSON.stringify(stravaTokens));
        if (stravaTokens?.accessToken) {
            supabase.from('perfil_atleta').select('id, strava_tokens').limit(1).maybeSingle().then(({ data }) => {
                const needsUpdate = data?.id && JSON.stringify(data.strava_tokens) !== JSON.stringify(stravaTokens);
                if (needsUpdate) {
                    supabase.from('perfil_atleta').update({ strava_tokens: stravaTokens }).eq('id', data.id).then();
                }
            });
        }
    }, [stravaTokens]);

    // Zonas por % de FC máx (modelo del plan Valencia 2026). FC máx configurable
    // en Ajustes (172 por defecto); se recalibra tras la prueba de esfuerzo.
    const z = zonesForMaxHR(maxHR);
    const hrZones: HRZones = { ...z, maxHR };

    return (
        <AthleteContext.Provider value={{
            weight, setWeight,
            targetWeight, setTargetWeight,
            name, setName,
            avatarUrl, setAvatarUrl,
            height, setHeight,
            birthDate, setBirthDate,
            restingHR, setRestingHR,
            maxHR, setMaxHR,
            geminiApiKey, setGeminiApiKey,
            complianceScore,
            weeklyComplianceScore,
            hrZones,
            stravaTokens,
            setStravaTokens
        }}>
            {children}
        </AthleteContext.Provider>
    );
}

export function useAthlete() {
    const context = useContext(AthleteContext);
    if (!context) {
        throw new Error('useAthlete must be used within an AthleteProvider');
    }
    return context;
}
