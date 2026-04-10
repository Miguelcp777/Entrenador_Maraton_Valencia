export function getPhaseForDate(year: number, month: number, day: number) {
    const d = new Date(year, month, day).getTime();

    const phases = [
        { name: 'Fase 0: Acondicionamiento', start: new Date(2026, 3, 20), end: new Date(2026, 5, 21), color: 'text-blue-400', border: 'border-blue-400/30' },
        { name: 'Fase 1: Base Acumulativa', start: new Date(2026, 5, 22), end: new Date(2026, 7, 2), color: 'text-emerald-500', border: 'border-emerald-500/30' },
        { name: 'Fase 2: Fuerza-Resistencia', start: new Date(2026, 7, 3), end: new Date(2026, 8, 13), color: 'text-orange-400', border: 'border-orange-400/30' },
        { name: 'Fase 3: Especificidad/Pico', start: new Date(2026, 8, 14), end: new Date(2026, 10, 8), color: 'text-red-500', border: 'border-red-500/30' },
        { name: 'Fase 4: Tapering y Carga', start: new Date(2026, 10, 9), end: new Date(2026, 11, 6), color: 'text-primary', border: 'border-primary/50' }
    ];

    for (const p of phases) {
        if (d >= p.start.getTime() && d <= p.end.getTime() + 86400000) {
            return p;
        }
    }
    return { name: 'Pre/Post Temporada', color: 'text-zinc-600', border: 'border-white/5' };
}

export function getDailyFocus(dayOfWeek: number, phaseName: string) {
    if (phaseName === 'Pre/Post Temporada') {
        return { label: 'OFF / Inactivo', icon: 'power_settings_new' };
    }

    const focusMap: Record<number, { label: string; icon: string; color: string }> = {
        1: { label: 'Fuerza', icon: 'fitness_center', color: 'text-primary' },
        2: { label: 'Carrera', icon: 'directions_run', color: 'text-tertiary' },
        3: { label: 'Fuerza', icon: 'fitness_center', color: 'text-zinc-500' },
        4: { label: 'Descanso', icon: 'self_improvement', color: 'text-zinc-600' },
        5: { label: 'Velocidad', icon: 'directions_run', color: 'text-tertiary' },
        6: { label: 'Híbrido', icon: 'bolt', color: 'text-orange-400' },
        0: { label: 'Tirada Larga', icon: 'terrain', color: 'text-emerald-500' }
    };
    return focusMap[dayOfWeek] || { label: 'Esfuerzo moderado y mantenimiento general.', icon: 'radio_button_unchecked', color: 'text-zinc-400' };
}

export function getTrainingDetails(focusLabel: string, phaseName: string) {
    let detailMock = "";
    let metricMock = "";
    let hrZonesTarget: ("z1" | "z2" | "z3" | "z4" | "z5")[] = [];

    if (phaseName === 'Pre/Post Temporada') {
        detailMock = "Plan de entrenamiento inactivo. El macrociclo no ha empezado o ya estás recuperándote del maratón.";
        metricMock = "INACTIVO";
    } else {
        const phaseLevel = phaseName.charAt(5); // "Fase 0", "Fase 1"...

        switch (focusLabel) {
            case 'Fuerza':
                detailMock = phaseLevel === '2' ? "Fuerza Pura (1-5 reps). Retención agresiva de masa muscular y ganancia neural." : "Squat y Peso Muerto. RPE 8. Retención de Fuerza Máxima. Evitar fallo muscular.";
                metricMock = "45 - 60 MINS";
                break;
            case 'Carrera':
                detailMock = "Base Aeróbica pura. Heart Rate anclado debajo del umbral aeróbico. Eficiencia mecánica.";
                if (phaseLevel === '0') metricMock = "5 - 8 KM";
                else if (phaseLevel === '1') metricMock = "8 - 12 KM";
                else if (phaseLevel === '4') metricMock = "6 - 10 KM";
                else metricMock = "10 - 15 KM";
                hrZonesTarget = ['z1', 'z2'];
                break;
            case 'Velocidad':
                detailMock = (phaseLevel === '0' || phaseLevel === '1') ? "Juegos de velocidad suaves (Fartlek). Despertares neuronales limpios." : "Series o Tempo Run calibrando Ritmo Objetivo Maratón + Trabajo de lactato.";
                metricMock = (phaseLevel === '0' || phaseLevel === '4') ? "6 - 8 KM" : "10 - 14 KM";
                hrZonesTarget = (phaseLevel === '0' || phaseLevel === '1') ? ['z3', 'z4'] : ['z4', 'z5'];
                break;
            case 'Tirada Larga':
                detailMock = "Simulación de carrera en el domingo. Endurecimiento de la mente e impacto repetitivo.";
                if (phaseLevel === '0') metricMock = "8 - 12 KM";
                else if (phaseLevel === '1') metricMock = "14 - 18 KM";
                else if (phaseLevel === '2') metricMock = "18 - 24 KM";
                else if (phaseLevel === '3') metricMock = "25 - 32 KM";
                else metricMock = "15 - 20 KM"; // Tapering
                hrZonesTarget = phaseLevel === '3' ? ['z2', 'z3'] : ['z2'];
                break;
            case 'Híbrido':
                detailMock = "Cadena posterior en el gimnasio seguido de rodaje en Fartlek. Adaptación en fatiga.";
                metricMock = (phaseLevel === '0' || phaseLevel === '4') ? "60 MINS TOTAL" : "+90 MINS TOTAL";
                hrZonesTarget = ['z3'];
                break;
            case 'Descanso':
                detailMock = "Descanso total o recuperación activa (Flujo de movilidad de 20 min). Escuchar dolores articulares.";
                metricMock = "REST";
                break;
            default:
                detailMock = "Esfuerzo moderado y mantenimiento general.";
                metricMock = "VARÍABLE";
        }
    }

    return { detailMock, metricMock, hrZonesTarget };
}

export function getMacrocycleProgress(dTime: number) {
    const macroStart = new Date(2026, 3, 20).getTime(); // April 20
    const macroEnd = new Date(2026, 11, 6).getTime(); // Dec 6

    if (dTime < macroStart) return 0;
    if (dTime > macroEnd) return 100;

    const totalMacro = macroEnd - macroStart;
    const passedMacro = dTime - macroStart;
    return Math.min(100, Math.max(0, (passedMacro / totalMacro) * 100));
}

export function getPhaseProgress(dTime: number, phaseName: string) {
    const phases = [
        { name: 'Fase 0: Acondicionamiento', start: new Date(2026, 3, 20), end: new Date(2026, 5, 21) },
        { name: 'Fase 1: Base Acumulativa', start: new Date(2026, 5, 22), end: new Date(2026, 7, 2) },
        { name: 'Fase 2: Fuerza-Resistencia', start: new Date(2026, 7, 3), end: new Date(2026, 8, 13) },
        { name: 'Fase 3: Especificidad/Pico', start: new Date(2026, 8, 14), end: new Date(2026, 10, 8) },
        { name: 'Fase 4: Tapering y Carga', start: new Date(2026, 10, 9), end: new Date(2026, 11, 6) }
    ];

    const phaseKey = phaseName.split(':')[0]; // Extracts 'Fase 0' to match easily or we can match includes
    const phase = phases.find(p => p.name.includes(phaseKey));
    if (!phase) return 0;

    if (dTime < phase.start.getTime()) return 0;
    if (dTime > phase.end.getTime() + 86400000) return 100;

    const totalPhase = phase.end.getTime() - phase.start.getTime();
    const passedPhase = dTime - phase.start.getTime();
    return Math.min(100, Math.max(0, (passedPhase / totalPhase) * 100));
}

export function getWeeklyProgress(dTime: number) {
    const d = new Date(dTime);
    const day = d.getDay();
    const dayIndex = day === 0 ? 6 : day - 1; // Monday = 0, Sunday = 6
    return Math.round((dayIndex / 6) * 100);
}
