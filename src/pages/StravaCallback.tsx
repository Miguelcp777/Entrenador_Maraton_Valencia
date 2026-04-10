import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAthlete } from '../context/AthleteContext';

export default function StravaCallback() {
    const [status, setStatus] = useState('Autorizando conexión con Strava...');
    const navigate = useNavigate();
    const location = useLocation();
    const { setStravaTokens } = useAthlete();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            setStatus(`Error al conectar con Strava: ${error}`);
            setTimeout(() => navigate('/settings'), 3000);
            return;
        }

        if (code) {
            exchangeToken(code);
        } else {
            setStatus('No se recibió código de autorización.');
            setTimeout(() => navigate('/settings'), 3000);
        }
    }, [location]);

    const exchangeToken = async (code: string) => {
        try {
            // Hardcoded user secrets for local individual app
            const clientId = '223033';
            const clientSecret = '6c9623a2953e6faa2d540e0ac3421f43f74bec8d';

            const response = await fetch('https://www.strava.com/api/v3/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code: code,
                    grant_type: 'authorization_code'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error en el intercambio de tokens.');
            }

            const data = await response.json();

            setStravaTokens({
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: data.expires_at
            });

            setStatus('¡Conexión establecida con éxito! Redirigiendo...');
            setTimeout(() => navigate('/settings'), 2000);

        } catch (error: any) {
            console.error('Strava Auth Error:', error);
            setStatus(`Fallo crítico de autenticación: ${error.message}`);
            setTimeout(() => navigate('/settings'), 4000);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <span className="material-symbols-outlined text-6xl text-orange-500 mb-6 animate-pulse">
                sync
            </span>
            <h2 className="font-['Inter'] font-black uppercase text-2xl mb-2">Conectando Strava</h2>
            <p className="font-['Space_Grotesk'] text-zinc-400">{status}</p>
        </div>
    );
}
