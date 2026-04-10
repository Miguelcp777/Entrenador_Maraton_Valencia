import { getPhaseForDate, getDailyFocus, getTrainingDetails } from '../utils/trainingLogic';

export default function MyWeek() {
    const todayDate = new Date();
    const currentDay = todayDate.getDay();
    const diff = todayDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const monday = new Date(todayDate.setDate(diff));

    const weekDatesArray = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });

    return (
        <div className="px-4 mt-8 w-full overflow-hidden">
            {/* Dynamic Coach Banner */}
            <section className="relative mb-8 overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent z-10"></div>
                <img
                    alt="Valencia Track"
                    className="w-full h-44 object-cover opacity-40 grayscale hover:grayscale-0 transition-all duration-700"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoVFXboJ3QSHDNrysgea6TLPetIAYd1RBtHPcKTDmjD3QTz0BsUEO2LdfdYLWAMtZFT3on8EDNTkioac73CI6B7h9JpG4wSXJ4uPcvhrnwWB5oYow9VQVUfov-Gl3JpZJLGoGAeoieg7_Z7P3AIHnf0MPuxYJnJAR5OAj1U8gmDhlzs73UOiPQD_QOtSatsZoytQ-0rjRf5IsMGEycTgNU6TpBfRpxmZj3WjBG_JeyubX-IeQC4i5Hp8PfprcJoDzhcxSjCdYfGLhd"
                />
                <div className="absolute inset-0 z-20 p-5 flex flex-col justify-end">
                    <span className="font-['Space_Grotesk'] text-primary text-[10px] uppercase font-bold tracking-[0.2em] mb-1">
                        Valencia 2026 Strategy
                    </span>
                    <h2 className="font-['Inter'] font-black text-xl leading-tight uppercase italic text-on-surface max-w-[85%]">
                        Strategy of the Week: <span className="text-primary-dim">Threshold Adaptation</span>
                    </h2>
                    <p className="text-on-surface-variant text-xs mt-2 font-['Space_Grotesk']">
                        "Valencia's flat course rewards metabolic efficiency." — Coach Mendez
                    </p>
                </div>
            </section>

            {/* Vertical Calendar List */}
            <div className="space-y-3">
                {weekDatesArray.map((dateObj, idx) => {
                    const currentDayOfWeek = dateObj.getDay();
                    const phase = getPhaseForDate(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
                    const focus = getDailyFocus(currentDayOfWeek, phase.name);
                    const { detailMock, metricMock } = getTrainingDetails(focus.label, phase.name);
                    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
                    const isInactive = phase.name === 'Pre/Post Temporada';

                    return (
                        <div
                            key={idx}
                            className={`bg-surface-container-low rounded-xl p-4 flex items-center justify-between gap-3 group transition-all duration-300 overflow-hidden ${isInactive ? 'opacity-50' : ''}`}
                        >
                            {/* Left: Day number + divider + focus */}
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                {/* Day */}
                                <div className="flex flex-col items-center flex-shrink-0 w-10">
                                    <span className={`font-['Space_Grotesk'] text-[9px] uppercase font-bold ${isInactive ? 'text-zinc-600' : focus.color}`}>
                                        {dayNames[currentDayOfWeek]}
                                    </span>
                                    <span className="font-['Inter'] font-black text-2xl text-on-surface">
                                        {dateObj.getDate()}
                                    </span>
                                </div>

                                {/* Divider */}
                                <div className={`h-10 w-px flex-shrink-0 ${isInactive ? 'bg-outline-variant/10' : 'bg-outline-variant/20'}`}></div>

                                {/* Focus info */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className={`material-symbols-outlined flex-shrink-0 ${focus.color}`} style={{ fontSize: '14px' }}>
                                            {focus.icon}
                                        </span>
                                        <span className={`font-['Space_Grotesk'] text-[9px] uppercase font-bold tracking-widest truncate ${focus.color}`}>
                                            {focus.label}
                                        </span>
                                    </div>
                                    <h3 className="font-['Inter'] font-extrabold text-sm text-on-surface truncate w-full">
                                        {detailMock}
                                    </h3>
                                </div>
                            </div>

                            {/* Right: Metric */}
                            <div className="flex-shrink-0 text-right">
                                <span className={`font-['Inter'] font-black text-base ${isInactive ? 'text-zinc-700' : 'text-on-surface/50 group-hover:text-primary tracking-tighter'} transition-colors`}>
                                    {metricMock}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
