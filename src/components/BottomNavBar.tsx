import { Link, useLocation } from 'react-router-dom';

export default function BottomNavBar() {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Dashboard', icon: 'dashboard' },
        { path: '/calendar', label: 'Plan', icon: 'calendar_month' },
        { path: '/week', label: 'My Week', icon: 'calendar_view_week' },
        { path: '/today', label: 'Today', icon: 'bolt' },
        { path: '/coach', label: 'Coach', icon: 'smart_toy' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pt-3 pb-8 bg-[#131316]/90 backdrop-blur-xl z-50 rounded-t-xl border-t border-white/5 shadow-[0_-4px_24px_rgba(255,102,0,0.12)]">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex flex-col items-center justify-center transition-all duration-300 ease-in-out ${isActive
                            ? 'text-orange-500 bg-orange-500/10 rounded-lg py-1 px-3'
                            : 'text-zinc-500 hover:text-zinc-200'
                            }`}
                    >
                        <span
                            className="material-symbols-outlined mb-1"
                            style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}
                        >
                            {item.icon}
                        </span>
                        <span className="font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest">
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
