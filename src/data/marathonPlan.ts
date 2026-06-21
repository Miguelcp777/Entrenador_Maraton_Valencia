// =============================================================================
//  PLAN MARATÓN VALENCIA 2026 · "Camino a la meta" · por pulsaciones
//  Fuente única de verdad del plan de entrenamiento (portado del plan HTML).
//
//  Atleta: Miguel · 51 años · objetivo 4:30 (6:24/km) · −15 kg en 24 semanas.
//  Inicio: lunes 22 jun 2026 · Maratón: domingo 6 dic 2026, 8:30 h.
// =============================================================================

export type ZoneKey = 'z1' | 'z2' | 'z3' | 'z4' | 'z5';
export type PhaseKey = 'adaptacion' | 'base' | 'construccion' | 'media' | 'pico' | 'taper';
export type NutritionKey = 'deficit' | 'transicion' | 'carga';

/** Fechas clave del macrociclo. */
export const PLAN_START = new Date(2026, 5, 22); // lunes 22 jun 2026 (semana 1)
export const RACE_DATE = new Date(2026, 11, 6, 8, 30); // domingo 6 dic 2026, 8:30
export const TOTAL_WEEKS = 24;

/** FC máx estimada del plan (Tanaka, 51 años ≈ 172). Configurable en Ajustes. */
export const DEFAULT_MAX_HR = 172;

/** Objetivo de carrera. */
export const RACE_GOAL = {
    finishTime: '4:30 h',
    marathonPace: '6:24 /km',
    weightLossKg: 15,
    weeklyLossKg: 0.6,
};

// -----------------------------------------------------------------------------
//  Fases (6) — colores mapeados a clases Tailwind ya usadas en la app
// -----------------------------------------------------------------------------
export interface Phase {
    key: PhaseKey;
    label: string;
    range: string;
    desc: string;
    /** Color de marca (hex) para gráficos / leyendas. */
    hex: string;
    /** Clases Tailwind para texto y bordes. */
    color: string;
    border: string;
}

export const PHASES: Record<PhaseKey, Phase> = {
    adaptacion: {
        key: 'adaptacion', label: 'Adaptación', range: 'Sem 1–4',
        desc: 'Crear el hábito sin romperse. Todo en Z2, run-walk si hace falta.',
        hex: '#34D1BF', color: 'text-teal-400', border: 'border-teal-400/30',
    },
    base: {
        key: 'base', label: 'Base', range: 'Sem 5–9',
        desc: 'Entra el 4º día y la tirada larga empieza a crecer.',
        hex: '#46B0E6', color: 'text-blue-400', border: 'border-blue-400/30',
    },
    construccion: {
        key: 'construccion', label: 'Construcción', range: 'Sem 10–14',
        desc: 'Volumen y largas de verdad. Aparece el ritmo maratón.',
        hex: '#F2B33D', color: 'text-yellow-500', border: 'border-yellow-500/30',
    },
    media: {
        key: 'media', label: 'Afinar + Media', range: 'Sem 15–18',
        desc: 'Test clave: Media de Valencia el 25 oct.',
        hex: '#FF7A33', color: 'text-orange-400', border: 'border-orange-400/30',
    },
    pico: {
        key: 'pico', label: 'Pico maratón', range: 'Sem 19–22',
        desc: 'Las largas más exigentes, hasta los 32 km.',
        hex: '#FF5C6C', color: 'text-red-500', border: 'border-red-500/30',
    },
    taper: {
        key: 'taper', label: 'Taper + Maratón', range: 'Sem 23–24',
        desc: 'Bajar carga, llegar fresco. 6 dic: a por ello.',
        hex: '#9B8CFF', color: 'text-violet-400', border: 'border-violet-400/30',
    },
};

// -----------------------------------------------------------------------------
//  Zonas de pulsaciones (% FC máx) — coinciden con el plan HTML para FC máx 172
// -----------------------------------------------------------------------------
export interface ZoneDef {
    key: ZoneKey;
    /** % FC máx [min, max] (0–1). */
    pct: [number, number];
    name: string;
    use: string;
    hex: string;
    /** Clase Tailwind de texto para esta zona. */
    color: string;
}

export const ZONES: Record<ZoneKey, ZoneDef> = {
    z1: { key: 'z1', pct: [0.50, 0.60], name: 'Recuperación', use: 'Trotes muy suaves, calentamiento, día de piernas cansadas', hex: '#46B0E6', color: 'text-blue-400' },
    z2: { key: 'z2', pct: [0.60, 0.70], name: 'Aeróbico fácil', use: 'Rodaje fácil (RF) y casi toda la tirada larga — el 80% del plan', hex: '#34D1BF', color: 'text-teal-400' },
    z3: { key: 'z3', pct: [0.70, 0.80], name: 'Medio / RM', use: 'Ritmo maratón (RM) y tramos de la larga', hex: '#F2B33D', color: 'text-yellow-500' },
    z4: { key: 'z4', pct: [0.80, 0.90], name: 'Umbral', use: 'Tempo y series largas', hex: '#FF7A33', color: 'text-orange-400' },
    z5: { key: 'z5', pct: [0.90, 1.00], name: 'VO2máx', use: 'Casi no se usa en este plan', hex: '#FF5C6C', color: 'text-red-500' },
};

/** Calcula los rangos de ppm de cada zona a partir de una FC máx dada. */
export function zonesForMaxHR(maxHR: number): Record<ZoneKey, [number, number]> {
    const r = (p: number) => Math.round(maxHR * p);
    return {
        z1: [r(ZONES.z1.pct[0]), r(ZONES.z1.pct[1])],
        z2: [r(ZONES.z2.pct[0]), r(ZONES.z2.pct[1])],
        z3: [r(ZONES.z3.pct[0]), r(ZONES.z3.pct[1])],
        z4: [r(ZONES.z4.pct[0]), r(ZONES.z4.pct[1])],
        z5: [r(ZONES.z5.pct[0]), maxHR],
    };
}

// -----------------------------------------------------------------------------
//  Nutrición periodizada
// -----------------------------------------------------------------------------
export interface NutritionPhase {
    key: NutritionKey;
    label: string;
    range: string;
    desc: string;
    hex: string;
    color: string;
}

export const NUTRITION: Record<NutritionKey, NutritionPhase> = {
    deficit: { key: 'deficit', label: 'Déficit', range: 'Sem 1–14 · jun–sep', desc: 'Ventana principal de pérdida de peso, con volumen bajo-medio. Aquí cae el grueso de los 15 kg.', hex: '#FF7A33', color: 'text-orange-400' },
    transicion: { key: 'transicion', label: 'Mantenimiento', range: 'Sem 15–22 · oct–nov', desc: 'Suaviza el déficit hacia mantenimiento: combustible para las largas de 28–32 km y para recuperar.', hex: '#34D1BF', color: 'text-teal-400' },
    carga: { key: 'carga', label: 'Carga', range: 'Sem 23–24 · dic', desc: 'Nada de déficit. Llegas alimentado y con los depósitos llenos a la salida.', hex: '#9B8CFF', color: 'text-violet-400' },
};

// -----------------------------------------------------------------------------
//  Ritmos de referencia
// -----------------------------------------------------------------------------
export const PACES = [
    { label: 'Rodaje fácil (RF)', zone: 'z2' as ZoneKey, pace: '7:00–7:45 /km', note: 'El 80% de los km. Conversación cómoda.' },
    { label: 'Ritmo maratón (RM)', zone: 'z3' as ZoneKey, pace: '~6:24 /km', note: 'Tu ritmo del día 6 dic.' },
    { label: 'Tempo / umbral', zone: 'z4' as ZoneKey, pace: '~6:00 /km', note: 'Cómodamente duro, ~1 h sostenible.' },
    { label: 'Strides', zone: null, pace: 'suelto', note: '4–6 × 20″. No mires la FC en los sprints.' },
];

// -----------------------------------------------------------------------------
//  Las 24 semanas
// -----------------------------------------------------------------------------
export interface Session {
    /** Título de la sesión. */
    title: string;
    /** Zona objetivo principal (null = fuerza/descanso sin zona). */
    zone: ZoneKey | null;
    /** Descripción/instrucción. */
    detail: string;
}

export interface Week {
    n: number;
    /** Rango de fechas legible. */
    dates: string;
    phase: PhaseKey;
    /** Resumen de estructura semanal (ej. "3C·1F·1X"). */
    structure: string;
    /** Km de la tirada larga (o distancia del hito). */
    longRun: number;
    /** Volumen semanal aproximado en km (null si es semana de carrera). */
    volume: number | null;
    /** Foco de la semana. */
    focus: string;
    /** Fase de nutrición. */
    nutrition: NutritionKey;
    /** Semana de descarga. */
    deload?: boolean;
    /** Hito especial. */
    milestone?: 'media' | 'maraton';
    /** Las 5 sesiones de la semana (orden: Lun, Mar, Mié, Jue, Dom). */
    sessions: Session[];
}

const s = (title: string, zone: ZoneKey | null, detail: string): Session => ({ title, zone, detail });

export const WEEKS: Week[] = [
    { n: 1, dates: '22–28 jun', phase: 'adaptacion', structure: '3C·1F·1X', longRun: 8, volume: 22, focus: 'Todo fácil. Consolidar rodajes', nutrition: 'deficit', sessions: [
        s('Rodaje fácil', 'z2', '30 min en Z2. Si la FC sube de zona, camina hasta recuperarla.'),
        s('Cross-training', 'z2', '30–40 min de bici o natación a ritmo cómodo (Z2).'),
        s('Fuerza', null, 'Core + glúteo + sentadilla + gemelo. 30–40 min.'),
        s('Rodaje fácil', 'z2', '30 min suave en Z2.'),
        s('Tirada larga', 'z2', '8 km muy tranquilos. Caminar en cuestas si hace falta.')]},
    { n: 2, dates: '29 jun–5 jul', phase: 'adaptacion', structure: '3C·1F·1X', longRun: 9, volume: 24, focus: '+Strides al final de un rodaje', nutrition: 'deficit', sessions: [
        s('Rodaje fácil + strides', 'z2', '35 min Z2 + 4×20″ de zancada suelta al final (sin mirar FC en los sprints).'),
        s('Cross-training', 'z2', '35–40 min bici/natación.'),
        s('Fuerza', null, 'Rutina de fuerza, 35 min.'),
        s('Rodaje fácil', 'z2', '30 min en Z2.'),
        s('Tirada larga', 'z2', '9 km, todo en Z2.')]},
    { n: 3, dates: '6–12 jul', phase: 'adaptacion', structure: '3C·1F·1X', longRun: 10, volume: 26, focus: 'Llegar a 45–50 min seguidos cómodo', nutrition: 'deficit', sessions: [
        s('Rodaje fácil', 'z2', '40 min en Z2. Objetivo: 45–50 min seguidos sin salir de zona.'),
        s('Cross-training', 'z2', '40 min bici/natación.'),
        s('Fuerza', null, '35–40 min.'),
        s('Rodaje fácil + strides', 'z2', '35 min Z2 + 4×20″.'),
        s('Tirada larga', 'z2', '10 km tranquilos.')]},
    { n: 4, dates: '13–19 jul', phase: 'adaptacion', structure: '3C·1F·1X', longRun: 7, volume: 20, focus: 'Semana de descarga · escuchar al cuerpo', nutrition: 'deficit', deload: true, sessions: [
        s('Rodaje fácil', 'z2', '30 min muy suave.'),
        s('Cross-training', 'z2', '30 min opcional y suave.'),
        s('Fuerza', null, 'Ligera, 30 min.'),
        s('Rodaje fácil', 'z2', '25 min.'),
        s('Tirada larga', 'z2', '7 km. Descarga: prioridad recuperar.')]},
    { n: 5, dates: '20–26 jul', phase: 'base', structure: '4C·1F', longRun: 11, volume: 30, focus: 'Entra el 4º día de carrera', nutrition: 'deficit', sessions: [
        s('Rodaje fácil', 'z2', '40 min en Z2.'),
        s('Rodaje fácil + strides', 'z2', '35 min Z2 + 4×20″ (este es el nuevo 4º día de carrera).'),
        s('Fuerza', null, '40 min.'),
        s('Rodaje fácil', 'z2', '35 min.'),
        s('Tirada larga', 'z2', '11 km en Z2.')]},
    { n: 6, dates: '27 jul–2 ago', phase: 'base', structure: '4C·1F', longRun: 13, volume: 33, focus: 'Calor: madrugar o noche', nutrition: 'deficit', sessions: [
        s('Rodaje fácil', 'z2', '40 min. Calor: madruga o corre de noche.'),
        s('Rodaje fácil', 'z2', '40 min en Z2.'),
        s('Fuerza', null, '40 min.'),
        s('Rodaje fácil + strides', 'z2', '30 min Z2 + 4×20″.'),
        s('Tirada larga', 'z2', '13 km. Con calor, fía la FC: el ritmo será más lento y es normal.')]},
    { n: 7, dates: '3–9 ago', phase: 'base', structure: '4C·1F', longRun: 15, volume: 36, focus: 'Primera calidad: tempo suave', nutrition: 'deficit', sessions: [
        s('Rodaje fácil', 'z2', '40 min Z2.'),
        s('Tempo (1ª calidad)', 'z4', '10 min Z2 + 2×8 min en Z4 (rec. 3 min en Z1) + 10 min Z2.'),
        s('Fuerza', null, '40 min.'),
        s('Rodaje fácil', 'z2', '35 min.'),
        s('Tirada larga', 'z2', '15 km en Z2.')]},
    { n: 8, dates: '10–16 ago', phase: 'base', structure: '4C·1F', longRun: 11, volume: 26, focus: 'Semana de descarga', nutrition: 'deficit', deload: true, sessions: [
        s('Rodaje fácil', 'z2', '35 min.'),
        s('Rodaje fácil', 'z2', '30 min suave.'),
        s('Fuerza', null, 'Ligera.'),
        s('Rodaje fácil', 'z2', '30 min.'),
        s('Tirada larga', 'z2', '11 km. Descarga.')]},
    { n: 9, dates: '17–23 ago', phase: 'base', structure: '4C·1F', longRun: 16, volume: 38, focus: 'Larga con toque de ritmo maratón', nutrition: 'deficit', sessions: [
        s('Rodaje fácil', 'z2', '45 min Z2.'),
        s('Tempo', 'z4', '10 min Z2 + 3×6 min Z4 (rec. 2 min) + 10 min Z2.'),
        s('Fuerza', null, '40 min.'),
        s('Rodaje fácil', 'z2', '35 min.'),
        s('Tirada larga + RM', 'z3', '16 km: 13 km en Z2 + 3 km finales a ritmo maratón (Z3).')]},
    { n: 10, dates: '24–30 ago', phase: 'construccion', structure: '4C·1F', longRun: 18, volume: 42, focus: 'Tempo 3×8 min', nutrition: 'deficit', sessions: [
        s('Rodaje fácil', 'z2', '45 min Z2.'),
        s('Tempo', 'z4', '15 min Z2 + 3×8 min Z4 (rec. 2 min Z1) + 10 min Z2.'),
        s('Fuerza', null, '40 min.'),
        s('Rodaje fácil + strides', 'z2', '40 min Z2 + 4×20″.'),
        s('Tirada larga', 'z2', '18 km en Z2.')]},
    { n: 11, dates: '31 ago–6 sep', phase: 'construccion', structure: '4C·1F', longRun: 20, volume: 46, focus: 'Primera larga de 20 km', nutrition: 'deficit', sessions: [
        s('Rodaje fácil', 'z2', '45 min Z2.'),
        s('Rodaje fácil', 'z2', '40 min (semana con larga exigente: calidad muy suave).'),
        s('Fuerza', null, '40 min.'),
        s('Rodaje fácil', 'z2', '35 min.'),
        s('Tirada larga', 'z2', '20 km, tu primera de 20. Toda en Z2, paciencia.')]},
    { n: 12, dates: '7–13 sep', phase: 'construccion', structure: '4C·1F', longRun: 14, volume: 32, focus: 'Semana de descarga', nutrition: 'deficit', deload: true, sessions: [
        s('Rodaje fácil', 'z2', '40 min.'),
        s('Tempo', 'z4', '10 min Z2 + 2×8 min Z4 (rec. 2 min) + 10 min Z2.'),
        s('Fuerza', null, 'Ligera.'),
        s('Rodaje fácil', 'z2', '30 min.'),
        s('Tirada larga', 'z2', '14 km. Descarga.')]},
    { n: 13, dates: '14–20 sep', phase: 'construccion', structure: '4C·1F', longRun: 22, volume: 48, focus: 'Larga con 6 km a ritmo maratón', nutrition: 'deficit', sessions: [
        s('Rodaje fácil', 'z2', '50 min Z2.'),
        s('Tempo continuo', 'z4', '15 min Z2 + 20 min continuos en Z4 + 10 min Z2.'),
        s('Fuerza', null, '40 min.'),
        s('Rodaje fácil', 'z2', '40 min.'),
        s('Tirada larga + RM', 'z3', '22 km: 16 km Z2 + 6 km a ritmo maratón (Z3).')]},
    { n: 14, dates: '21–27 sep', phase: 'construccion', structure: '4C·1F', longRun: 24, volume: 50, focus: 'Pico parcial de volumen', nutrition: 'deficit', sessions: [
        s('Rodaje fácil', 'z2', '50 min Z2.'),
        s('Tempo', 'z4', '15 min Z2 + 2×12 min Z4 (rec. 3 min) + 10 min Z2.'),
        s('Fuerza', null, '40 min.'),
        s('Rodaje fácil + strides', 'z2', '40 min Z2 + 4×20″.'),
        s('Tirada larga', 'z2', '24 km en Z2 (últimos 2 km a RM si te encuentras bien).')]},
    { n: 15, dates: '28 sep–4 oct', phase: 'media', structure: '4C·1F', longRun: 18, volume: 42, focus: 'Descarga + ritmo de media', nutrition: 'transicion', deload: true, sessions: [
        s('Rodaje fácil', 'z2', '40 min Z2.'),
        s('Ritmo media', 'z4', '10 min Z2 + 4×5 min a ritmo objetivo de media (Z4) + 10 min Z2.'),
        s('Fuerza', null, '35 min.'),
        s('Rodaje fácil', 'z2', '35 min.'),
        s('Tirada larga', 'z2', '18 km suave (descarga relativa).')]},
    { n: 16, dates: '5–11 oct', phase: 'media', structure: '4C·1F', longRun: 25, volume: 50, focus: 'Última larga antes de la media', nutrition: 'transicion', sessions: [
        s('Rodaje fácil', 'z2', '50 min Z2.'),
        s('Tempo continuo', 'z4', '15 min Z2 + 25 min continuos en Z4 + 10 min Z2.'),
        s('Fuerza', null, '40 min.'),
        s('Rodaje fácil', 'z2', '40 min.'),
        s('Tirada larga', 'z2', '25 km, toda en Z2. Tu larga más larga antes de la media.')]},
    { n: 17, dates: '12–18 oct', phase: 'media', structure: '3C·1F', longRun: 14, volume: 34, focus: 'Bajar volumen, buscar frescura', nutrition: 'transicion', sessions: [
        s('Rodaje fácil', 'z2', '40 min Z2.'),
        s('Activación', 'z4', '10 min Z2 + 3×3 min a ritmo media (Z4) + 10 min Z2. Piernas frescas.'),
        s('Fuerza ligera', null, '30 min suave.'),
        s('Rodaje fácil + strides', 'z2', '30 min Z2 + 4×20″.'),
        s('Descanso / cross suave', null, 'Día extra de descanso esta semana para llegar fresco a la media.')]},
    { n: 18, dates: '19–25 oct', phase: 'media', structure: 'Media + suaves', longRun: 21.1, volume: 32, focus: '🏁 Media Valencia 25 oct — TEST', nutrition: 'transicion', milestone: 'media', sessions: [
        s('Rodaje fácil', 'z2', 'Mar/Mié: 30 min suave en Z2.'),
        s('Activación pre-carrera', 'z3', 'Vie: 20 min Z1–Z2 + 3×1 min a ritmo media. Soltar piernas.'),
        s('Sin fuerza pesada', null, 'Solo movilidad ligera esta semana.'),
        s('Descanso', null, 'Sábado: descanso total.'),
        s('MEDIA MARATÓN', 'z3', '🏁 21,1 km. Sal controlado en Z3, sube a Z4 en la 2ª mitad. Objetivo ~2:03–2:08.')]},
    { n: 19, dates: '26 oct–1 nov', phase: 'pico', structure: '4C·1F', longRun: 21, volume: 40, focus: 'Recuperar de la media, todo fácil', nutrition: 'transicion', sessions: [
        s('Rodaje regenerativo', 'z1', '30–40 min muy suave en Z1–Z2 (recuperas de la media).'),
        s('Rodaje fácil', 'z2', '40 min Z2.'),
        s('Fuerza suave', null, '35 min.'),
        s('Rodaje fácil', 'z2', '40 min.'),
        s('Tirada larga', 'z2', '21 km tranquilos, todo Z2.')]},
    { n: 20, dates: '2–8 nov', phase: 'pico', structure: '4C·1F', longRun: 28, volume: 50, focus: 'Larga con 8–10 km a ritmo maratón', nutrition: 'transicion', sessions: [
        s('Rodaje fácil', 'z2', '50 min Z2.'),
        s('Tempo', 'z4', '15 min Z2 + 2×15 min Z4 (rec. 3 min) + 10 min Z2.'),
        s('Fuerza', null, '40 min.'),
        s('Rodaje fácil', 'z2', '40 min.'),
        s('Tirada larga + RM', 'z3', '28 km: 18 km Z2 + 8–10 km a ritmo maratón (Z3). Ensaya geles.')]},
    { n: 21, dates: '9–15 nov', phase: 'pico', structure: '4C·1F', longRun: 32, volume: 54, focus: '🔝 Tirada larga máxima', nutrition: 'transicion', sessions: [
        s('Rodaje fácil', 'z2', '50 min Z2.'),
        s('Rodaje fácil', 'z2', '40 min suave (semana de la larga clave: nada que reste).'),
        s('Fuerza ligera', null, '35 min.'),
        s('Rodaje fácil', 'z2', '40 min.'),
        s('Tirada larga máxima', 'z2', '32 km: casi todo Z2, últimos 3–4 km a RM. Practica el avituallamiento completo.')]},
    { n: 22, dates: '16–22 nov', phase: 'pico', structure: '4C·1F', longRun: 26, volume: 46, focus: 'Última larga seria', nutrition: 'transicion', sessions: [
        s('Rodaje fácil', 'z2', '45 min Z2.'),
        s('Ritmo maratón', 'z3', '10 min Z2 + 5 km a RM (Z3) + 10 min Z2.'),
        s('Fuerza', null, '35 min.'),
        s('Rodaje fácil', 'z2', '40 min.'),
        s('Tirada larga + RM', 'z3', '26 km: 20 km Z2 + 6 km a RM. Última larga seria.')]},
    { n: 23, dates: '23–29 nov', phase: 'taper', structure: '3C·1F', longRun: 18, volume: 34, focus: 'Taper · mantener la chispa', nutrition: 'carga', sessions: [
        s('Rodaje fácil', 'z2', '40 min Z2.'),
        s('Ritmo maratón', 'z3', '10 min Z2 + 4 km a RM (Z3) + 10 min Z2. Mantener la chispa.'),
        s('Fuerza ligera', null, '30 min suave.'),
        s('Rodaje fácil + strides', 'z2', '30 min Z2 + 4×20″.'),
        s('Tirada larga', 'z2', '18 km suave (última larga, ya en bajada de volumen).')]},
    { n: 24, dates: '30 nov–6 dic', phase: 'taper', structure: '3C muy suaves', longRun: 42.2, volume: null, focus: '🏆 MARATÓN · 6 dic', nutrition: 'carga', milestone: 'maraton', sessions: [
        s('Rodaje fácil', 'z2', 'Lun/Mar: 30 min suave en Z2.'),
        s('Activación', 'z3', 'Mié: 20 min Z2 + 3×2 min a RM. Soltar piernas.'),
        s('Rodaje muy suave', 'z1', 'Vie: 20–25 min flojito + 3 strides. Nada de fuerza esta semana.'),
        s('Descanso + carga', null, 'Sáb: descanso total, hidratación y carga de hidratos.'),
        s('MARATÓN', 'z2', '🏆 42,2 km. Sal en Z2 (¡aguanta las ganas!), deja que suba a Z3 sola. Avituallarte cada 30–40 min.')]},
];

// -----------------------------------------------------------------------------
//  Distribución semanal de las 5 sesiones por día de la semana.
//  Las semanas del plan van de lunes a domingo. Índices de WEEKS[].sessions:
//    0 → Lun · 1 → Mar · 2 → Mié · 3 → Jue · (Vie/Sáb descanso) · 4 → Dom (larga)
// -----------------------------------------------------------------------------
/** Devuelve el índice de sesión (0–4) para un día JS (0=Dom..6=Sáb), o null si descanso. */
export function sessionIndexForDay(jsDay: number): number | null {
    switch (jsDay) {
        case 1: return 0; // Lun
        case 2: return 1; // Mar
        case 3: return 2; // Mié
        case 4: return 3; // Jue
        case 0: return 4; // Dom (tirada larga / carrera)
        default: return null; // Vie / Sáb → descanso
    }
}
