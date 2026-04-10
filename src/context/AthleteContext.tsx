import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabaseClient';

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
    geminiApiKey: string;
    setGeminiApiKey: (key: string) => void;
    complianceScore: number;
    weeklyComplianceScore: number;
    hrZones: HRZones;
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
    const [geminiApiKey, setGeminiApiKey] = useState<string>(() => getInitialState('athlete_geminiApiKey', ""));
    const [complianceScore, setComplianceScore] = useState<number>(0);
    const [weeklyComplianceScore, setWeeklyComplianceScore] = useState<number>(0);

    useEffect(() => {
        const fetchRemoteState = async () => {
            const { data, error } = await supabase.from('perfil_atleta').select('*').limit(1).single();
            if (data && !error) {
                if (data.peso_actual) setWeight(data.peso_actual);
                if (data.peso_objetivo) setTargetWeight(data.peso_objetivo);
                if (data.nombre) setName(data.nombre);
                if (data.avatar_url) setAvatarUrl(data.avatar_url);
                if (data.altura) setHeight(data.altura);
                if (data.fecha_nacimiento) setBirthDate(data.fecha_nacimiento);
                if (data.fc_reposo) setRestingHR(data.fc_reposo);
            }

            // Calculate Compliance Score from logs
            const { count: logsCount } = await supabase
                .from('logs_entrenamiento')
                .select('*', { count: 'exact', head: true });

            const macroStart = new Date(2026, 3, 20).getTime();
            const now = Date.now();
            if (now > macroStart) {
                const daysPassed = Math.floor((now - macroStart) / (1000 * 60 * 60 * 24));
                const expectedSessions = Math.max(1, Math.floor(daysPassed * (6 / 7)));
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
                // Determine how many days passed this week (Monday=1, Sunday=7)
                const todayIndex = currentDay === 0 ? 7 : currentDay;
                // Assuming training schedule is 6 sessions a week. If today is early in the week, expected is lower.
                const expectedWeekly = Math.max(1, Math.floor(todayIndex * (6 / 7)));
                const weeklyScore = Math.round(((weeklyLogsCount || 0) / expectedWeekly) * 100);
                setWeeklyComplianceScore(Math.min(100, Math.max(0, weeklyScore)));
            } else {
                setWeeklyComplianceScore(0);
            }
        };
        fetchRemoteState();
    }, []);

    useEffect(() => {
        localStorage.setItem('athlete_weight', JSON.stringify(weight));
    }, [weight]);

    useEffect(() => {
        localStorage.setItem('athlete_targetWeight', JSON.stringify(targetWeight));
    }, [targetWeight]);

    useEffect(() => {
        localStorage.setItem('athlete_name', JSON.stringify(name));
    }, [name]);

    useEffect(() => {
        localStorage.setItem('athlete_avatarUrl', JSON.stringify(avatarUrl));
    }, [avatarUrl]);

    useEffect(() => {
        localStorage.setItem('athlete_height', JSON.stringify(height));
    }, [height]);

    useEffect(() => {
        localStorage.setItem('athlete_birthDate', JSON.stringify(birthDate));
    }, [birthDate]);

    useEffect(() => {
        localStorage.setItem('athlete_restingHR', JSON.stringify(restingHR));
    }, [restingHR]);

    useEffect(() => {
        localStorage.setItem('athlete_geminiApiKey', JSON.stringify(geminiApiKey));
    }, [geminiApiKey]);

    const dob = new Date(birthDate);
    const todayDate = new Date();
    let age = todayDate.getFullYear() - dob.getFullYear();
    const m = todayDate.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && todayDate.getDate() < dob.getDate())) age--;

    const maxHR = 220 - (age || 30);
    const hrr = maxHR - restingHR;

    const hrZones: HRZones = {
        z1: [Math.round(hrr * 0.5 + restingHR), Math.round(hrr * 0.6 + restingHR)],
        z2: [Math.round(hrr * 0.6 + restingHR), Math.round(hrr * 0.7 + restingHR)],
        z3: [Math.round(hrr * 0.7 + restingHR), Math.round(hrr * 0.8 + restingHR)],
        z4: [Math.round(hrr * 0.8 + restingHR), Math.round(hrr * 0.9 + restingHR)],
        z5: [Math.round(hrr * 0.9 + restingHR), maxHR],
        maxHR
    };

    return (
        <AthleteContext.Provider value={{
            weight, setWeight,
            targetWeight, setTargetWeight,
            name, setName,
            avatarUrl, setAvatarUrl,
            height, setHeight,
            birthDate, setBirthDate,
            restingHR, setRestingHR,
            geminiApiKey, setGeminiApiKey,
            complianceScore,
            weeklyComplianceScore,
            hrZones
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
