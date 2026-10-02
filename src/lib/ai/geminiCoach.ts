/**
 * RKStride - Google Gemini AI Athletic Coach Engine
 * Privacy-first architecture:
 * 1. Supports Bring Your Own Key (BYOK) stored exclusively in user's browser localStorage
 * 2. Supports Thin Backend Proxy (e.g. Cloudflare Worker / Vercel Edge Function)
 * 3. Aggregated Telemetry Only (never transmits raw 28-day historical logs)
 * 4. Privacy Toggle: User can disable telemetry transmission entirely
 * 5. Medical Safety Guardrail: Immediate medical referral for acute red flags (chest pain, dizziness, acute injury)
 * 6. Local Offline Engine: Strict athletic scope enforcement, politely rejecting out-of-domain queries
 */

import { GoogleGenAI } from '@google/genai';
import { ReadinessCheckIn, ACWRStatus } from '@/types/workout';

export interface AthleteContext {
  acwrRatio: number;
  acwrStatus: ACWRStatus;
  acuteLoad: number;
  chronicLoad: number;
  readiness: ReadinessCheckIn;
  readinessScore: number;
  lastLegsHoursAgo: number;
  recentWorkoutSummary?: {
    strengthExercisesCount: number;
    runningMinutes: number;
    runningKm: number;
    totalLoadScore: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export type AiCoachMode = 'byok' | 'proxy';

export interface AiCoachConfig {
  mode: AiCoachMode;
  byokApiKey: string;
  proxyUrl: string;
  sendTelemetry: boolean;
}

const LOCAL_STORAGE_KEY_CONFIG = 'rkstride_ai_coach_config';

/**
 * Helper to retrieve environment API key if configured in .env (Vite or Process)
 */
export function getEnvApiKey(): string {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return String(import.meta.env.VITE_GEMINI_API_KEY).trim();
    }
  } catch {
    // Ignore
  }
  try {
    if (typeof process !== 'undefined' && process.env && (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY)) {
      return String(process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY).trim();
    }
  } catch {
    // Ignore
  }
  return '';
}

/**
 * Get AI Coach settings from local browser storage with automatic .env fallback
 */
export function getAiCoachConfig(): AiCoachConfig {
  const envKey = getEnvApiKey();

  if (typeof window === 'undefined') {
    return { mode: 'byok', byokApiKey: envKey, proxyUrl: '', sendTelemetry: true };
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        mode: parsed.mode || 'byok',
        byokApiKey: (parsed.byokApiKey && parsed.byokApiKey.trim()) ? parsed.byokApiKey.trim() : envKey,
        proxyUrl: parsed.proxyUrl || '',
        sendTelemetry: parsed.sendTelemetry ?? true,
      };
    }
  } catch (err) {
    console.error('Error reading AI Coach config:', err);
  }

  // Fallback to legacy single key if present, then environment key
  const legacyKey = (localStorage.getItem('rkstride_gemini_api_key') || '').trim();
  return {
    mode: 'byok',
    byokApiKey: legacyKey || envKey,
    proxyUrl: '',
    sendTelemetry: true,
  };
}

/**
 * Save AI Coach configuration locally in user's browser
 */
export function saveAiCoachConfig(config: AiCoachConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY_CONFIG, JSON.stringify(config));
  if (config.byokApiKey) {
    localStorage.setItem('rkstride_gemini_api_key', config.byokApiKey);
  } else {
    localStorage.removeItem('rkstride_gemini_api_key');
  }
}

// Backward compatible getter & setter
export function getStoredApiKey(): string {
  return getAiCoachConfig().byokApiKey;
}
export function saveStoredApiKey(key: string): void {
  const current = getAiCoachConfig();
  saveAiCoachConfig({ ...current, byokApiKey: key });
}

// =============================================================================
// MEDICAL SAFETY RED FLAGS & SCOPE CHECK
// =============================================================================

const MEDICAL_RED_FLAGS = [
  'nyeri dada',
  'dada sakit',
  'chest pain',
  'sesak nafas',
  'sesak napas',
  'shortness of breath',
  'pingsan',
  'fainted',
  'syncope',
  'dizziness berat',
  'detak jantung tidak teratur',
  'palpitasi',
  'jantung berdebar hebat',
  'robek ligamen',
  'patah tulang',
  'pendarahan',
];

export function checkMedicalRedFlags(prompt: string): string | null {
  const p = prompt.toLowerCase();
  for (const flag of MEDICAL_RED_FLAGS) {
    if (p.includes(flag)) {
      return `⚠️ **PERINGATAN KESELAMATAN MEDIS**:\n\nGejala yang Anda sebutkan (*"${flag}"*) berpotensi menandakan kondisi klinis darurat atau cedera akut. RKStride Coach adalah sistem pendukung keputusan latihan atletik, **bukan pengganti diagnosis medis**.\n\n**Tindakan Wajib:**\n1. Hentikan seluruh aktivitas fisik atau latihan segera.\n2. Jangan memaksakan diri melakukan latihan kardiovaskular atau angkat beban.\n3. Segera konsultasikan kondisi Anda dengan dokter, IGD, atau fasilitas medis terdekat.`;
    }
  }
  return null;
}

const IN_DOMAIN_KEYWORDS = [
  'beban', 'acwr', 'workload', 'training', 'latihan', 'jadwal',
  'lari', 'run', 'squat', 'leg', 'kaki', 'push', 'pull', 'bench',
  'deadlift', 'recovery', 'pemulihan', 'otot', 'soreness', 'doms',
  'norwegian', '4x4', 'tempo', 'interval', 'vo2', 'trimp', 'rpe',
  'tidur', 'sleep', 'rhr', 'detak jantung', 'hrv', 'protein', 'nutrisi',
  'hidrasi', 'deload', 'progression', 'reps', 'set', '1rm',
];

export function isQueryInSportsDomain(prompt: string): boolean {
  const p = prompt.toLowerCase();
  // Allow greetings and short queries
  if (p.length < 15) return true;
  return IN_DOMAIN_KEYWORDS.some((kw) => p.includes(kw));
}

// =============================================================================
// SYSTEM INSTRUCTION BUILDER (AGGREGATED TELEMETRY ONLY)
// =============================================================================

export function buildSystemInstruction(ctx?: AthleteContext): string {
  const baseInstruction = `You are the RKStride AI Athletic Coach, an elite exercise physiologist, strength & conditioning specialist (CSCS), and hybrid running coach.
You coach athletes combining Push-Pull-Legs (PPL) resistance training and cardiovascular running (from Zone 2 aerobic base to Norwegian 4x4 VO2 Max intervals).

CORE PRINCIPLES & SAFEGUARDS:
1. NON-MEDICAL DISCLAIMER & BOUNDARY:
   You are an athletic decision-support tool. You NEVER provide medical diagnoses or prescribe medical treatment.
   If the athlete mentions chest pain, severe palpitations, sudden dizziness/fainting, or acute joint/ligament injuries, immediately instruct them to stop exercising and consult a medical doctor.
2. EVIDENCE-BASED SPORTS SCIENCE:
   - ACWR (Dr. Tim Gabbett): Sweet Spot (0.8 - 1.3), Warning (1.3 - 1.5), Danger (> 1.5 triggers deload -20% to -40%).
   - Concurrent Training Interference (Hickson / Baar): 48-hour recovery window between leg day and high-speed running (Norwegian 4x4, track intervals, tempo). Zone 1-2 easy recovery running (<= 45 min) is always permitted.
   - Foster Session RPE (sRPE): Universal workload metric (duration * RPE).
3. COACHING VOICE:
   Motivating, disciplined, concise, structured with bullet points. Always prioritize tissue adaptation and long-term athletic sustainability.`;

  if (!ctx) {
    return `${baseInstruction}\n\nNOTE: The user has disabled biometric telemetry sharing. Answer athletic questions based strictly on general sports science principles without personalized context.`;
  }

  const isDanger = ctx.acwrRatio > 1.5;
  const isWarning = ctx.acwrRatio > 1.3 && ctx.acwrRatio <= 1.5;
  const legLocked = ctx.lastLegsHoursAgo < 48;

  return `${baseInstruction}

ATHLETE AGGREGATED TELEMETRY (ANONYMIZED HIGH-LEVEL METRICS):
- ACWR Ratio: ${ctx.acwrRatio} (${ctx.acwrStatus.toUpperCase()})
- Acute Load (7-day avg): ${ctx.acuteLoad} pts/day | Chronic Load (28-day avg): ${ctx.chronicLoad} pts/day
- Smartwatch Readiness Score: ${ctx.readinessScore}/100
- Sleep Duration: ${ctx.readiness.sleepHours} hrs | Resting Heart Rate: ${ctx.readiness.restingHeartRate || 52} bpm
- Muscle DOMS: ${ctx.readiness.muscleSoreness}/5 | Leg Fatigue: ${ctx.readiness.legFatigue ? 'FATIGUED' : 'FRESH'}
- Hours Since Previous Leg Session: ${ctx.lastLegsHoursAgo < 900 ? `${ctx.lastLegsHoursAgo}h` : '> 72h'} (48h Window: ${legLocked ? 'ACTIVE' : 'CLEARED'})
${ctx.recentWorkoutSummary ? `- Recent Session: ${ctx.recentWorkoutSummary.strengthExercisesCount} strength exercises, ${ctx.recentWorkoutSummary.runningKm} km running (${ctx.recentWorkoutSummary.runningMinutes}m), Session Load: ${ctx.recentWorkoutSummary.totalLoadScore} pts.` : ''}

DIRECTIVES BASED ON ATHLETE STATE:
${isDanger ? '- CRITICAL: ACWR is in Danger Zone (> 1.5). Emphasize immediate volume reduction (-30% to -40%) and active mobility.' : ''}
${isWarning ? '- NOTICE: ACWR is in Warning Zone (1.3 - 1.5). Recommend holding steady volume without aggressive jumps.' : ''}
${legLocked ? '- NOTICE: 48-hour leg window is currently active. Do NOT recommend heavy squats or fast interval running today (only light Zone 1/2 < 45m or Upper Body).' : ''}`;
}

// =============================================================================
// LOCAL OFFLINE SPORTS SCIENCE ENGINE
// =============================================================================

export function generateOfflineSportsScienceResponse(
  prompt: string,
  ctx?: AthleteContext
): string {
  // 1. Red Flag Medical Check
  const medicalAlert = checkMedicalRedFlags(prompt);
  if (medicalAlert) return medicalAlert;

  // 2. Out of domain scope check
  if (!isQueryInSportsDomain(prompt)) {
    return `### Spesialisasi Pelatih Olahraga RKStride

Maaf, sebagai asisten pelatih performa atletik hibrida, keahlian saya berfokus pada:
- **Manajemen Beban Latihan (ACWR)** dan pencegahan kelelahan akut.
- **Jadwal Hibrida & Interference Effect** (menggabungkan Push-Pull-Legs dengan lari).
- **Protokol Lari Kardiorespirasi** (Norwegian 4x4, Zona 2 aerobik, tempo).
- **Nutrisi & Hidrasi Pemulihan** pasca latihan.

Silakan ajukan pertanyaan seputar rencana latihan, pemulihan, atau analisis beban fisik Anda!`;
  }

  const p = prompt.toLowerCase();

  if (p.includes('analisis') || p.includes('beban') || p.includes('acwr') || p.includes('workload')) {
    if (!ctx) {
      return `### Analisis Beban Latihan (ACWR Engine)

Pengiriman telemetri saat ini dinonaktifkan dalam preferensi privasi Anda.
Secara umum, ambang batas **Acute:Chronic Workload Ratio (ACWR)** adalah:
- **< 0.8**: *Undertraining* (aman menerapkan progressive overload bertahap).
- **0.8 - 1.3**: *Sweet Spot* (zona adaptasi kebugaran optimal dengan risiko cedera paling rendah).
- **1.3 - 1.5**: *Zona Waspada* (beban meningkat cepat, pantau pemulihan harian).
- **> 1.5**: *Zona Bahaya* (lonjakan beban akut tinggi, disarankan deload volume -20% s.d. -40%).`;
    }

    const statusText =
      ctx.acwrStatus === 'insufficient_data'
        ? 'Data Belum Cukup (Pengumpulan Baseline)'
        : ctx.acwrStatus === 'danger'
        ? 'Indikator Risiko Lonjakan Akut'
        : ctx.acwrStatus === 'warning'
        ? 'Zona Waspada (Pantau Ketat)'
        : ctx.acwrStatus === 'sweet_spot'
        ? 'Zona Manis / Sweet Spot'
        : 'Undertraining / Stimulus Ringan';

    return `### Analisis Beban Latihan Terkini (ACWR Engine)

Berdasarkan telemetri performa Anda saat ini:
- **Rasio ACWR:** **${ctx.acwrRatio}** (${statusText})
- **Beban Akut (7 Hari):** ${ctx.acuteLoad} pts/hari
- **Beban Kronis (28 Hari):** ${ctx.chronicLoad} pts/hari
- **Skor Kesiapan Biometrik:** ${ctx.readinessScore}/100 (${ctx.readiness.sleepHours} jam tidur, RHR ${ctx.readiness.restingHeartRate || 52} bpm)

${
  ctx.acwrRatio > 1.5
    ? '**Rekomendasi Utama:** Beban akut Anda melonjak melewati batas 1.5. Risiko kelelahan sistemik meningkat. Lakukan active recovery atau mobility session, hindari menambah beban berat hari ini.'
    : ctx.acwrRatio > 1.3
    ? '**Rekomendasi Utama:** Beban berada di Zona Waspada (1.3-1.5). Pertahankan beban yang ada dan monitor kualitas pemulihan.'
    : ctx.acwrRatio >= 0.8
    ? '**Rekomendasi Utama:** Anda berada di Sweet Spot ideal (0.8–1.3). Kapasitas adaptasi kardiorespirasi dan hipertrofi otot berada pada titik optimal.'
    : '**Rekomendasi Utama:** Beban Anda saat ini tergolong ringan. Aman untuk menerapkan progressive overload bertahap.'
}

*(Tip: Pasang Google Gemini API Key pada pengaturan untuk konsultasi interaktif online!)*`;
  }

  if (p.includes('lari') || p.includes('besok') || p.includes('run') || p.includes('leg') || p.includes('kaki')) {
    const legHours = ctx?.lastLegsHoursAgo ?? 999;
    const isLocked = legHours < 48;

    return `### Rekomendasi Sesi Lari & Jendela Pemulihan Kaki

Status Pemulihan Otot Kaki: **${legHours < 900 ? `${legHours} jam` : '> 72 jam'} pasca Leg Day**.

${
  isLocked
    ? `**Proteksi 48 Jam Berjalan:**
Karena sesi latihan kaki baru berlangsung ${legHours} jam lalu, otot paha dan tendon patela masih dalam fase pemulihan kolagen mikroskopis.
- **Dianjurkan Dihindari:** Sesi lari cepat (Norwegian 4x4, interval VO2 max, tempo).
- **Diperbolehkan:** Lari santai aerobik Zone 1 / Zone 2 (durasi <= 45 menit) atau alihkan ke menu Upper Body Push/Pull.`
    : `**Jendela Pemulihan Kaki Bersih (> 48 Jam):**
Otot kaki Anda telah melewati ambang batas pemulihan minimum. Anda aman mengeksekusi sesi lari berintensitas tinggi seperti **Norwegian 4x4** atau **Tempo Run**, asalkan skor kesiapan tubuh tetap prima.`
}

*(Tip: Pasang Google Gemini API Key pada pengaturan untuk konsultasi interaktif online!)*`;
  }

  if (p.includes('nutrisi') || p.includes('makan') || p.includes('protein') || p.includes('recovery')) {
    return `### Protokol Nutrisi & Hidrasi Pasca Latihan

Untuk mengoptimalkan sintesis protein otot (*MPS*) dan pengisian glikogen:
1. **Target Protein:** Konsumsi **25–35 gram protein berkualitas tinggi** (Whey, telur, daging tanpa lemak, tempe/tahu) dalam kurun 45–90 menit pasca latihan.
2. **Rehidrasi & Elektrolit:** Minum minimal **500–750 ml air** berlarutan elektrolit/natrium untuk menggantikan cairan keringat.
3. **Karbohidrat Kompleks:** Gabungkan 40–60g karbohidrat (oatmeal, nasi merah, pisang) guna mempercepat resintesis glikogen.
4. **Kualitas Tidur:** Targetkan **7.5 – 8.5 jam tidur** agar pelepasan hormon pertumbuhan (*HGH*) optimal.`;
  }

  if (p.includes('norwegian') || p.includes('4x4') || p.includes('vo2')) {
    return `### Panduan Eksekusi Protokol Norwegian 4x4 (Helgerud et al., 2007)

Protokol dari *Norwegian University of Science and Technology* terbukti sangat efektif meningkatkan $VO_2 \max$:
- **Pemanasan:** 10 menit di Zone 2 (60–70% HRR).
- **Interval Utama:** 4 ronde x (4 menit di Zone 4 @ 85–95% HRmax).
- **Pemulihan Aktif:** 3 menit lari santai di Zone 2 di antara setiap interval (total 4 kali).
- **Pendinginan:** 6 menit di Zone 1 flush.
- **Total Durasi:** 44 menit | **Edwards TRIMP Score:** Tepat 114 poin.

*Kunci Keberhasilan:* Jaga ritme agar denyut jantung bertahan stabil di 85–95% HRmax selama 4 menit interval, jangan biarkan berubah menjadi sprint anaerobik murni (Zone 5).`;
  }

  return `### Panduan Pelatih Olahraga RKStride

Terima kasih atas pertanyaan Anda! Sebagai sistem pendukung keputusan atlet hibrida:
- Rasio ACWR saat ini: **${ctx?.acwrRatio ?? 'N/A'}** (${ctx?.acwrStatus ?? 'N/A'}).
- Skor kesiapan tubuh: **${ctx?.readinessScore ?? 'N/A'}/100**.

Untuk konsultasi dinamis multi-turn:
1. Anda dapat memasukkan Google Gemini API Key di menu pengaturan AI Coach (Mode BYOK).
2. Atau tanyakan analisis beban, jadwal lari, nutrisi, atau protokol Norwegian 4x4 melalui tombol instan di bawah.`;
}

// =============================================================================
// MAIN CHAT DISPATCHER (BYOK & PROXY SUPPORT)
// =============================================================================

export async function askGeminiCoach(
  userMessage: string,
  history: ChatMessage[],
  ctx?: AthleteContext
): Promise<string> {
  // Immediate medical red flag check
  const medicalAlert = checkMedicalRedFlags(userMessage);
  if (medicalAlert) {
    return medicalAlert;
  }

  const config = getAiCoachConfig();
  const effectiveCtx = config.sendTelemetry ? ctx : undefined;

  // 1. Mode Proxy Backend (Thin Backend Proxy)
  if (config.mode === 'proxy' && config.proxyUrl) {
    try {
      const response = await fetch(config.proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: history.slice(-6),
          athleteContext: effectiveCtx,
        }),
      });

      if (!response.ok) {
        throw new Error(`Proxy status error: ${response.status}`);
      }

      const data = await response.json();
      if (data.reply) return data.reply;
      throw new Error('Invalid JSON from proxy');
    } catch (err: any) {
      console.warn('Proxy failed, falling back to local engine:', err);
      const offline = generateOfflineSportsScienceResponse(userMessage, effectiveCtx);
      return `${offline}\n\n*(Catatan: Proxy backend tidak merespons (${err.message}). Respon di atas dihasilkan oleh engine lokal RKStride.)*`;
    }
  }

  // 2. Mode BYOK (Bring Your Own Key)
  const apiKey = config.byokApiKey.trim();

  if (!apiKey) {
    // Artificial brief delay for realistic natural chat feel
    await new Promise((resolve) => setTimeout(resolve, 500));
    return generateOfflineSportsScienceResponse(userMessage, effectiveCtx);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = buildSystemInstruction(effectiveCtx);

    const contents = history
      .filter((m) => m.role === 'user' || m.role === 'model')
      .slice(-6)
      .map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const outputText = response.text || '';
    if (!outputText) {
      throw new Error('Empty response received from Gemini.');
    }

    return outputText;
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    const offlineReply = generateOfflineSportsScienceResponse(userMessage, effectiveCtx);
    return `${offlineReply}\n\n*(Catatan koneksi: Terjadi kendala API key (${err.message || 'Error'}). Respon di atas dihasilkan oleh engine fisiologi lokal RKStride.)*`;
  }
}
