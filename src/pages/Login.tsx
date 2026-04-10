import { useState } from 'react';

interface Props {
    onLogin: () => void;
}

export default function Login({ onLogin }: Props) {
    const [user, setUser] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (user.trim() === 'Aurelio' && password === 'Admin123') {
            setError(false);
            localStorage.setItem('antigravity_auth', 'true');
            onLogin();
        } else {
            setError(true);
            setTimeout(() => setError(false), 3000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-black text-white selection:bg-primary selection:text-black">
            <div className="w-full max-w-sm space-y-8 bg-surface-container-low p-8 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <span className="material-symbols-outlined text-9xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                </div>

                <div className="text-center space-y-2 relative z-10">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
                    </div>
                    <h1 className="font-['Inter'] font-black text-3xl tracking-tighter text-white">SYSTEM <span className="text-primary italic">LOCK</span></h1>
                    <p className="font-['Space_Grotesk'] text-xs uppercase tracking-widest text-zinc-500">Security Clearance Required</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="space-y-4">
                        <div>
                            <label className="block font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-2">Usuario</label>
                            <input
                                type="text"
                                value={user}
                                onChange={(e) => setUser(e.target.value)}
                                className="w-full bg-surface-container-high rounded-xl p-4 font-['Inter'] text-sm focus:outline-none focus:ring-1 focus:ring-primary border border-transparent transition-all"
                                placeholder="Ingresar identificador..."
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-['Space_Grotesk'] text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-2">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-surface-container-high rounded-xl p-4 font-['Inter'] text-sm focus:outline-none focus:ring-1 focus:ring-primary border border-transparent transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-['Inter'] text-center animate-pulse">
                            Credenciales no reconocidas por el protocolo.
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-primary text-black font-['Space_Grotesk'] font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                        Acceder
                        <span className="material-symbols-outlined text-sm">login</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
