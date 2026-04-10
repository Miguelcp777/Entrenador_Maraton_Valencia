import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAthlete } from '../context/AthleteContext';

export default function TopAppBar() {
    const { avatarUrl } = useAthlete();

    return (
        <nav className="w-full top-0 sticky z-50 bg-[#131316] flex justify-between items-center px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-high border-2 border-primary/20 flex items-center justify-center overflow-hidden">
                    <img
                        alt="athlete profile photo"
                        className="w-full h-full object-cover"
                        src={avatarUrl}
                    />
                </div>
                <Link to="/" className="font-['Inter'] font-black uppercase tracking-tighter text-lg italic text-orange-600 dark:text-orange-500">
                    MARATON VALENCIA TRAINING
                </Link>
            </div>
            <Link to="/settings" className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors active:scale-95 duration-150">
                <span className="material-symbols-outlined text-zinc-500 text-white">settings</span>
            </Link>
        </nav>
    );
}
