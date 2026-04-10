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
        <div className="px-6 mt-8 max-w-2xl mx-auto">
            {/* Dynamic Coach Banner */}
            <section className="relative mb-12 overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent z-10"></div>
                <img
                    alt="Valencia Track"
                    className="w-full h-48 object-cover opacity-40 grayscale hover:grayscale-0 transition-all duration-700"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoVFXboJ3QSHDNrysgea6TLPetIAYd1RBtHPcKTDmjD3QTz0BsUEO2LdfdYLWAMtZFT3on8EDNTkioac73CI6B7h9JpG4wSXJ4uPcvhrnwWB5oYow9VQVUfov-Gl3JpZJLGoGAeoieg7_Z7P3AIHnf0MPuxYJnJAR5OAj1U8gmDhlzs73UOiPQD_QOtSatsZoytQ-0rjRf5IsMGEycTgNU6TpBfRpxmZj3WjBG_JeyubX-IeQC4i5Hp8PfprcJoDzhcxSjCdYfGLhd"
                />
                <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                    <span className="font-['Space_Grotesk'] text-primary text-[10px] uppercase font-bold tracking-[0.2em] mb-1">
                        Valencia 2026 Strategy
                    </span>
                    <h2 className="font-['Inter'] font-black text-2xl leading-tight uppercase italic text-on-surface max-w-[80%]">
                        Strategy of the Week: <span className="text-primary-dim">Threshold Adaptation</span>
                    </h2>
                    <p className="text-on-surface-variant text-xs mt-2 font-['Space_Grotesk']">
                        "Valencia's flat course rewards metabolic efficiency. We are stacking 10k pace intervals with heavy posterior chain loading." — Coach Mendez
                    </p>
                </div>
            </section>

            {/* Vertical Calendar List */}
            <div className="space-y-4">
                {weekDatesArray.map((dateObj, idx) => {
                    const currentDayOfWeek = dateObj.getDay();
                    const phase = getPhaseForDate(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
                    const focus = getDailyFocus(currentDayOfWeek, phase.name);
                    const { detailMock, metricMock } = getTrainingDetails(focus.label, phase.name);
                    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

                    const isInactive = phase.name === 'Pre/Post Temporada';

                    return (
                        <div key={idx} className={`bg-surface-container-low rounded-xl p-5 flex items-center justify-between group transition-all duration-300 ${isInactive ? 'opacity-50' : ''}`}>
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-center">
                                    <span className={`font-['Space_Grotesk'] text-[10px] uppercase font-bold ${isInactive ? 'text-zinc-600' : focus.color}`}>{dayNames[currentDayOfWeek]}</span>
                                    <span className="font-['Inter'] font-black text-2xl text-on-surface">{dateObj.getDate()}</span>
                                </div>
                                <div className={`h-10 w-[1px] ${isInactive ? 'bg-outline-variant/10' : 'bg-outline-variant/20'}`}></div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`material-symbols-outlined text-sm ${focus.color}`}>{focus.icon}</span>
                                        <span className={`font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest ${focus.color}`}>{focus.label}</span>
                                    </div>
                                    <h3 className={`font-['Inter'] font-extrabold text-sm md:text-md text-on-surface max-w-[150px] md:max-w-xs overflow-hidden text-ellipsis whitespace-nowrap`} title={detailMock}>{detailMock}</h3>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`font-['Inter'] font-black text-xl md:text-3xl ${isInactive ? 'text-zinc-700' : 'text-on-surface/50 group-hover:text-primary tracking-tighter'} transition-colors`}>{metricMock}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
