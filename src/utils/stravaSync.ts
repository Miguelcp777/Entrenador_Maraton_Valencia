import { supabase } from '../supabaseClient';

export const syncStravaActivities = async (accessToken: string, atletaId: string) => {
    try {
        // Fetch last 15 days of activities
        const afterTimestamp = Math.floor((Date.now() - 15 * 24 * 60 * 60 * 1000) / 1000);

        const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${afterTimestamp}&per_page=30`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
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
                // Strava suffer_score typically ranges from 10 to 200+
                // We'll fallback to a neutral 5 if we don't have enough data
                let estimatedRpe = 5;
                if (activity.suffer_score) {
                    if (activity.suffer_score < 40) estimatedRpe = 4;
                    else if (activity.suffer_score < 80) estimatedRpe = 6;
                    else if (activity.suffer_score < 120) estimatedRpe = 7;
                    else if (activity.suffer_score < 160) estimatedRpe = 8;
                    else estimatedRpe = 9;
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
                        type: activity.type
                    }
                };

                // Check DB
                const { data: existingLogs } = await supabase.from('logs_entrenamiento')
                    .select('id, metricas_extra')
                    .gte('fecha_completada', startOfDay.toISOString())
                    .lte('fecha_completada', endOfDay.toISOString());

                const existingStravaLog = existingLogs?.find(e => e.metricas_extra?.strava_id === activity.id);

                if (existingStravaLog) {
                    // Update the matched strava activity
                    await supabase.from('logs_entrenamiento').update({
                        distancia_real_km: distanceKm,
                        duracion_real_mins: durationMins,
                        metricas_extra: payload.metricas_extra
                    }).eq('id', existingStravaLog.id);
                } else {
                    // It's a new strava activity! Insert it.
                    await supabase.from('logs_entrenamiento').insert([payload]);
                    syncedCount++;
                }
            }
        }

        return { success: true, count: syncedCount };

    } catch (error: any) {
        console.error("Strava Sync Error:", error);
        return { success: false, error: error.message };
    }
};
