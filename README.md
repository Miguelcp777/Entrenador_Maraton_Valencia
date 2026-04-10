# Kinetic Lab | Maratón Valencia Training 🏃‍♂️⚡

![App Demo](public/vite.svg) (*Nota: Sube tus screenshots aquí en el futuro*)

**Maratón Valencia Training** (anteriormente Kinetic Lab) es una aplicación web híbrida (Dashboard + AI Coach) diseñada y construida específicamente para monitorizar, gestionar y optimizar el entrenamiento de atletas orientados a la maratón, utilizando el protocolo "Valencia 2026".

No es solo un rastreador pasivo de estadísticas; incluye un **Entrenador Analítico de IA** propulsado por Gemini 2.5, configurado bajo una personalidad férrea, implacable y con gran conocimiento fisiológico (*Aurelio*), diseñado para auditar diariamente el progreso del atleta e incluso registrar y computar datos dinámicamente mediante llamadas a funciones de base de datos.

## 🚀 Características Principales

* **🏆 Cuadro de Mandos (Dashboard) Biométrico**
  * Cuenta atrás hiper-enfocada hacia la Maratón de Valencia 2026.
  * Indicadores en tiempo real de porcentaje de cumplimiento (Compliance) obtenidos directamente del histórico de la base de datos local y estado semanal.
  * Monitorización del peso, frecuencia cardíaca en reposo (RHR) y zonas de umbral basadas en fórmulas Karvonen.

* **📅 Calendario Predictivo y Dinámico (Macrociclo)**
  * Separación por bloques fisiológicos (Fase 0: Acondicionamiento, Fase 1: Base Acumulativa, etc.).
  * Lógica determinista: Días de enfoque aeróbico, tiradas largas (Long Runs), repeticiones en umbral y recargas/descansos obligatorios.

* **🧠 Agente Cognitivo de IA (Entrenador "Aurelio")**
  * **Motor:** Desarrollado con el SDK `@google/generative-ai` apuntando a **Gemini 2.5 Flash** para latencia en tiempo real.
  * **Memoria Persistente:** Carga automática del contexto desde Supabase para conservar una memoria histórica de todas tus excusas, fatigas y sensaciones.
  * **Inyección de Biometría:** El agente conoce todos los datos de tu Perfil de Atleta actual y tu cumplimiento exacto de la base de datos al momento de iniciar la conversación.
  * **Ejecución Autónoma (Tool Calling):** Si el atleta le reporta haber completado un entreno vía chat, la IA detectará las intenciones, mapeará los parámetros (distancia, duración, RPE, fecha) e **insertará de manera autónoma los registros en el calendario de entrenamiento de Supabase**, reduciendo la fricción manual de formularios a cero.

## 🛠️ Stack Tecnológico

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-18181A?style=for-the-badge&logo=supabase&logoColor=3ECF8E)
![Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)

* **Frontend:** React (Vite.js) con TypeScript, estructurado `mobile-first`.
* **Estilos:** TailwindCSS (arquitectura dark-mode nativa) con tipografías `Inter` y `Space Grotesk`.
* **Base de Datos & Auth:** Supabase (PostgreSQL + RLS).
* **Inteligencia Artificial:** API oficial de Google AI (Gemini 2.5 Flash con Function Calling).

## 🗄️ Esquema de Base de Datos Principal

1. `perfil_atleta`: Métricas e Identidad.
2. `plan_maestro`: Configuración del Macrociclo.
3. `logs_entrenamiento`: Datos de entrenamiento bruto (Distancia, Temps, Esfuerzo Percibido - RPE).
4. `interacciones_chat`: Base de conocimiento del historial del Agente AI.

## 💻 Instalación y Uso Local

1. Asegúrate de tener Node.js instalado.
2. Clona el repositorio:
   \`\`\`bash
   git clone <https://github.com/Miguelcp777/Entrenador_Maraton_Valencia.git>
   \`\`\`
3. Instala las dependencias:
   \`\`\`bash
   npm install
   \`\`\`
4. Configura tus variables de entorno en el archivo `src/supabaseClient.ts` o a través del panel UI interno para la clave de Gemini:
   * **URL de Supabase**
   * **Anon Key Supabase**
   * Pega tu clave de API de Gemini dentro de la pestaña oculta de **Settings** en la app.

5. Levanta el servidor de desarrollo en caliente:
   \`\`\`bash
   npm run dev
   \`\`\`

---
*Construido para aniquilar los límites y reventar la marca sub-3h. No excuses.* 🏴‍☠️
