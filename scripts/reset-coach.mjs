// Script de un solo uso: resetea la memoria del coach (tabla interacciones_chat).
// NO toca logs_entrenamiento, registros_peso ni perfil_atleta.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

// Cargar .env.local manualmente (Vite no inyecta VITE_ en Node).
const env = {};
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const { count: before } = await supabase
    .from('interacciones_chat')
    .select('*', { count: 'exact', head: true });
console.log(`Mensajes del coach antes: ${before ?? 0}`);

if ((before ?? 0) > 0) {
    // PostgREST exige un filtro en DELETE; este matchea todas las filas.
    const { error } = await supabase
        .from('interacciones_chat')
        .delete()
        .not('id', 'is', null);
    if (error) {
        console.error('Error al borrar:', error.message);
        process.exit(1);
    }
}

const { count: after } = await supabase
    .from('interacciones_chat')
    .select('*', { count: 'exact', head: true });
console.log(`Mensajes del coach después: ${after ?? 0}`);
console.log('✅ Coach reseteado.');
