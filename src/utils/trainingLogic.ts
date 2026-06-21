// =============================================================================
//  Motor del plan — ahora alimentado por el plan real de Valencia 2026.
//  Mantiene las firmas que ya usan las páginas (getPhaseForDate, getDailyFocus,
//  getTrainingDetails, *Progress) y añade helpers más ricos basados en el plan.
// =============================================================================
import {
    WEEKS, PHASES, PLAN_START, RACE_DATE, TOTAL_WEEKS,
    sessionIndexForDay, type Week, type Session, type ZoneKey,
} from '../data/marathonPlan';

const DAY_MS = 86400000;
const WEEK_MS = 7 * DAY_MS;

/** Inicio del día (00:00) en ms. */
function dayStart(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Número de semana del plan (1–24) para una fecha, o null si está fuera del plan. */
export function getWeekIndex(date: Date): number | null {
    const diff = dayStart(date) - PLAN_START.getTime();
    if (diff < 0) return null;
    const idx = Math.floor(diff / WEEK_MS) + 1;
    return idx > TOTAL_WEEKS ? null : idx;
}

/** Datos de la semana del plan para una fecha (o null si fuera del plan). */
export function getWeekData(date: Date): Week | null {
    const idx = getWeekIndex(date);
    return idx ? WEEKS[idx - 1] : null;
}

/** Sesión concreta para una fecha (o null si descanso / fuera del plan). */
export function getSessionForDate(date: Date): { week: Week; session: Session } | null {
    const week = getWeekData(date);
    if (!week) return null;
    const si = sessionIndexForDay(date.getDay());
    if (si === null) return null;
    return { week, session: week.sessions[si] };
}

// -----------------------------------------------------------------------------
//  Compatibilidad: getPhaseForDate({year, month, day}) → { name, color, border }
// -----------------------------------------------------------------------------
const PRE_SEASON = { name: 'Pre/Post Temporada', color: 'text-zinc-600', border: 'border-white/5' };

export function getPhaseForDate(year: number, month: number, day: number) {
    const week = getWeekData(new Date(year, month, day));
    if (!week) return PRE_SEASON;
    const p = PHASES[week.phase];
    return { name: `${p.label} · ${p.range}`, color: p.color, border: p.border, phaseKey: p.key };
}

// -----------------------------------------------------------------------------
//  Iconografía por tipo de sesión (Material Symbols)
// -----------------------------------------------------------------------------
function iconForSession(session: Session | null): string {
    if (!session) return 'self_improvement';
    const t = session.title.toLowerCase();
    if (t.includes('fuerza')) return 'fitness_center';
    if (t.includes('cross')) return 'directions_bike';
    if (t.includes('descanso')) return 'self_improvement';
    if (t.includes('maratón')) return 'emoji_events';
    if (t.includes('media')) return 'flag';
    if (t.includes('tirada') || t.includes('larga')) return 'terrain';
    if (t.includes('tempo') || t.includes('ritmo') || t.includes('serie') || t.includes('activación')) return 'speed';
    return 'directions_run';
}

function colorForSession(session: Session | null): string {
    if (!session) return 'text-zinc-600';
    const t = session.title.toLowerCase();
    if (t.includes('fuerza')) return 'text-primary';
    if (t.includes('maratón') || t.includes('media')) return 'text-orange-400';
    if (t.includes('tirada') || t.includes('larga')) return 'text-emerald-500';
    if (t.includes('tempo') || t.includes('ritmo') || t.includes('serie') || t.includes('activación')) return 'text-tertiary';
    return 'text-tertiary';
}

// -----------------------------------------------------------------------------
//  Compatibilidad: getDailyFocus(dayOfWeek, phaseName) → { label, icon, color }
//  Ahora resuelve la sesión REAL del día a partir de la fecha cuando se pasa.
// -----------------------------------------------------------------------------
export function getDailyFocus(dayOfWeek: number, phaseName: string, date?: Date) {
    if (phaseName === PRE_SEASON.name) {
        return { label: 'OFF / Inactivo', icon: 'power_settings_new', color: 'text-zinc-600' };
    }
    // Si tenemos fecha, devolvemos la sesión exacta del plan.
    if (date) {
        const found = getSessionForDate(date);
        if (!found) return { label: 'Descanso', icon: 'self_improvement', color: 'text-zinc-600' };
        return { label: found.session.title, icon: iconForSession(found.session), color: colorForSession(found.session) };
    }
    // Sin fecha (compat): día de descanso si es Vie/Sáb.
    const si = sessionIndexForDay(dayOfWeek);
    if (si === null) return { label: 'Descanso', icon: 'self_improvement', color: 'text-zinc-600' };
    return { label: ['Carrera', 'Carrera', 'Fuerza', 'Carrera', 'Tirada Larga'][si], icon: 'directions_run', color: 'text-tertiary' };
}

// -----------------------------------------------------------------------------
//  Compatibilidad: getTrainingDetails → { detailMock, metricMock, hrZonesTarget }
//  Ahora devuelve el detalle y volumen REALES de la sesión del plan.
// -----------------------------------------------------------------------------
export function getTrainingDetails(_focusLabel: string, phaseName: string, date?: Date) {
    if (phaseName === PRE_SEASON.name) {
        return {
            detailMock: 'Plan de entrenamiento inactivo. El macrociclo no ha empezado o ya estás recuperándote del maratón.',
            metricMock: 'INACTIVO',
            hrZonesTarget: [] as ZoneKey[],
        };
    }

    if (date) {
        const found = getSessionForDate(date);
        if (!found) {
            return { detailMock: 'Descanso o recuperación activa. Escucha a tu cuerpo.', metricMock: 'REST', hrZonesTarget: [] as ZoneKey[] };
        }
        const { week, session } = found;
        const isLong = session === week.sessions[4];
        return {
            detailMock: session.detail,
            metricMock: isLong ? `${week.longRun} KM` : session.title.toUpperCase(),
            hrZonesTarget: session.zone ? [session.zone] : ([] as ZoneKey[]),
        };
    }

    return { detailMock: 'Esfuerzo según el plan de la semana.', metricMock: 'VARIABLE', hrZonesTarget: [] as ZoneKey[] };
}

// -----------------------------------------------------------------------------
//  Progreso (macro / fase / semanal) — ahora ancladas al plan real
// -----------------------------------------------------------------------------
export function getMacrocycleProgress(dTime: number) {
    const start = PLAN_START.getTime();
    const end = RACE_DATE.getTime();
    if (dTime < start) return 0;
    if (dTime > end) return 100;
    return Math.min(100, Math.max(0, ((dTime - start) / (end - start)) * 100));
}

export function getPhaseProgress(dTime: number, _phaseName: string) {
    const week = getWeekData(new Date(dTime));
    if (!week) return 0;
    const phaseWeeks = WEEKS.filter(w => w.phase === week.phase);
    const first = phaseWeeks[0].n;
    const last = phaseWeeks[phaseWeeks.length - 1].n;
    const phaseStart = PLAN_START.getTime() + (first - 1) * WEEK_MS;
    const phaseEnd = PLAN_START.getTime() + last * WEEK_MS;
    return Math.min(100, Math.max(0, ((dTime - phaseStart) / (phaseEnd - phaseStart)) * 100));
}

export function getWeeklyProgress(dTime: number) {
    const day = new Date(dTime).getDay();
    const dayIndex = day === 0 ? 6 : day - 1; // Lun=0 .. Dom=6
    return Math.round((dayIndex / 6) * 100);
}
