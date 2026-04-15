import { supabase } from '../supabaseClient';

export const refreshStravaTokens = async (refreshToken: string) => {
    try {
        const clientId = '223033';
        const clientSecret = '6c9623a2953e6faa2d540e0ac3421f43f74bec8d';

        const response = await fetch('https://www.strava.com/api/v3/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to refresh Strava token');
        }

        const data = await response.json();
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: data.expires_at
        };
    } catch (error) {
        console.error("Error refreshing Strava token:", error);
        throw error;
    }
};

export const syncStravaActivities = async (
    tokens: { accessToken: string; refreshToken: string; expiresAt: number },
    atletaId: string,
    athleteWeightKg = 75
) => {
    let currentAccessToken = tokens.accessToken;
    let updatedTokens = null;

    try {
        // 1. Check if token is expired (or about to expire in 5 mins)
        const now = Math.floor(Date.now() / 1000);
        if (tokens.expiresAt < now + 300) {
            console.log("Strava token expired, refreshing...");
            updatedTokens = await refreshStravaTokens(tokens.refreshToken);
            currentAccessToken = updatedTokens.accessToken;
        }

        // Fetch last 15 days of activities
        const afterTimestamp = Math.floor((Date.now() - 15 * 24 * 60 * 60 * 1000) / 1000);

        const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${afterTimestamp}&per_page=30`, {
            headers: {
                Authorization: `Bearer ${currentAccessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Strava API error: ${response.status}`);
        }

        const activities = await response.json();

        let syncedCount = 0;

        for (const activity of activities) {
            // We sync Runs, Walks and Strength/Workouts
            if (
                activity.type === 'Run' ||
                activity.type === 'VirtualRun' ||
                activity.type === 'TrailRun' ||
                activity.type === 'Walk' ||
                activity.type === 'WeightTraining' ||
                activity.type === 'Workout' ||
                activity.type === 'Crossfit'
            ) {

                const targetDate = new Date(activity.start_date_local);
                targetDate.setHours(12, 0, 0, 0); // Noon anchor

                const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

                // Calculate values
                const distanceKm = parseFloat((activity.distance / 1000).toFixed(2));
                const durationMins = Math.round(activity.moving_time / 60);

                // RPE estimation based on Strava suffer_score or heart rate 
                let estimatedRpe = 5;
                if (activity.suffer_score) {
                    if (activity.suffer_score < 40) estimatedRpe = 4;
                    else if (activity.suffer_score < 80) estimatedRpe = 6;
                    else if (activity.suffer_score < 120) estimatedRpe = 7;
                    else if (activity.suffer_score < 160) estimatedRpe = 8;
                    else estimatedRpe = 9;
                }

                // Optional calculation for steps based on cadence
                let steps = 0;
                if (activity.average_cadence) {
                    steps = Math.round(activity.average_cadence * 2 * (activity.moving_time / 60));
                }

                // Calculate Calories Fallback if missing
                let calories = activity.calories || activity.kilojoules;
                if (!calories) {
                    if (activity.type === 'Run' || activity.type === 'TrailRun' || activity.type === 'VirtualRun') {
                        calories = athleteWeightKg * distanceKm * 1.036;
                    } else if (activity.type === 'Walk') {
                        calories = athleteWeightKg * distanceKm * 0.73;
                    } else if (activity.type === 'WeightTraining' || activity.type === 'Crossfit') {
                        calories = durationMins * 6;
                    } else {
                        calories = durationMins * 5; // Generic fallback
                    }
                }

                const payload = {
                    atleta_id: atletaId,
                    fecha_completada: targetDate.toISOString(),
                    distancia_real_km: distanceKm,
                    duracion_real_mins: durationMins,
                    rpe_real: estimatedRpe,
                    sentimientos: `Sincronizado vía Garmin/Strava: ${activity.name}`,
                    metricas_extra: {
                        strava_id: activity.id,
                        average_heartrate: activity.average_heartrate,
                        max_heartrate: activity.max_heartrate,
                        total_elevation_gain: activity.total_elevation_gain,
                        average_speed: activity.average_speed,
                        suffer_score: activity.suffer_score,
                        type: activity.type,
                        calories: Math.round(calories),
                        steps: steps > 0 ? steps : undefined,
                        map_polyline: activity.map?.summary_polyline
                    }
                };

                // Check DB
                const { data: existingLogs } = await supabase.from('logs_entrenamiento')
                    .select('id, metricas_extra')
                    .gte('fecha_completada', startOfDay.toISOString())
                    .lte('fecha_completada', endOfDay.toISOString());

                const existingStravaLog = existingLogs?.find(e => e.metricas_extra?.strava_id === activity.id);

                if (existingStravaLog) {
                    await supabase.from('logs_entrenamiento').update({
                        distancia_real_km: distanceKm,
                        duracion_real_mins: durationMins,
                        metricas_extra: payload.metricas_extra
                    }).eq('id', existingStravaLog.id);
                } else {
                    await supabase.from('logs_entrenamiento').insert([payload]);
                    syncedCount++;
                }
            }
        }

        return { success: true, count: syncedCount, updatedTokens };

    } catch (error: any) {
        console.error("Strava Sync Error:", error);
        return { success: false, error: error.message };
    }
};
