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
    const meta = typeof import.meta !== 'undefined' ? (import.meta as any) : undefined;
    if (meta && meta.env && meta.env.VITE_GEMINI_API_KEY) {
      return String(meta.env.VITE_GEMINI_API_KEY).trim();
    }
  } catch {
    // Ignore
  }
  try {
    const proc = typeof process !== 'undefined' ? process : undefined;
    if (proc && proc.env && (proc.env.VITE_GEMINI_API_KEY || proc.env.GEMINI_API_KEY)) {
      return String(proc.env.VITE_GEMINI_API_KEY || proc.env.GEMINI_API_KEY).trim();
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
  'beban', 'acwr', 'workload', 'volume', 'intensitas', 'intensity',
  'training', 'latihan', 'jadwal', 'menu', 'saran', 'rekomen', 'rekomendasi',
  'besok', 'hari ini', 'pagi', 'sore', 'malam', 'program', 'plan', 'workout',
  'olahraga', 'olga', 'gym', 'fitness', 'angkat', 'cardio', 'kardio',
  'lari', 'run', 'jogging', 'sprint', 'tempo', 'interval', 'norwegian', '4x4',
  'vo2', 'zone', 'zona', 'pace', 'km', 'speed', 'jarak', 'durasi',
  'squat', 'leg', 'legs', 'kaki', 'push', 'pull', 'bench', 'deadlift', 'dada',
  'punggung', 'bahu', 'tangan', 'lengan', 'overhead', 'row', 'curl',
  'recovery', 'pemulihan', 'otot', 'soreness', 'doms', 'capek', 'lelah', 'pegal',
  'trimp', 'rpe', 'tidur', 'sleep', 'rhr', 'detak jantung', 'denyut', 'bpm', 'hrv',
  'protein', 'nutrisi', 'nutrition', 'karbo', 'makan', 'hidrasi', 'minum',
  'elektrolit', 'deload', 'progression', 'progres', 'reps', 'set', '1rm',
  'istirahat', 'target', 'boleh',
];

export function isQueryInSportsDomain(prompt: string): boolean {
  const p = prompt.toLowerCase().trim();
  const greetings = ['halo', 'hai', 'hi', 'hello', 'pagi', 'siang', 'sore', 'malam', 'thanks', 'terima kasih', 'makasih'];
  if (greetings.some(g => p === g || p.startsWith(g + ' '))) return true;
  return IN_DOMAIN_KEYWORDS.some((kw) => new RegExp('\\b' + kw.replace(/[.*+?^\$\{\}()|\[\]\\]/g, '\$&') + '\\b').test(p));
}

// =============================================================================
// SYSTEM INSTRUCTION BUILDER (AGGREGATED TELEMETRY ONLY)
// =============================================================================

export function buildSystemInstruction(ctx?: AthleteContext): string {
  const baseInstruction = `You are rkbot, an elite hybrid athletic coach, exercise physiologist, and sports science decision engine for RKStride.
You coach athletes combining Push-Pull-Legs (PPL) resistance training and cardiovascular running (from Zone 2 aerobic base to Norwegian 4x4 VO2 Max intervals).
Always introduce and refer to yourself simply as "rkbot". Never mention Google, Gemini, or underlying AI models.

CORE PRINCIPLES & SAFEGUARDS:
1. NON-MEDICAL DISCLAIMER & BOUNDARY:
   You are an athletic decision-support tool. You NEVER provide medical diagnoses or prescribe medical treatment.
   If the athlete mentions chest pain, severe palpitations, sudden dizziness/fainting, or acute joint/ligament injuries, immediately instruct them to stop exercising and consult a medical doctor.
2. EVIDENCE-BASED SPORTS SCIENCE:
   - ACWR (Dr. Tim Gabbett): Sweet Spot (0.8 - 1.3), Warning (1.3 - 1.5), Danger (> 1.5 triggers deload -20% to -40%).
   - Concurrent Training Interference (Hickson / Baar): 48-hour recovery window between leg day and high-speed running (Norwegian 4x4, track intervals, tempo). Zone 1-2 easy recovery running (<= 45 min) is always permitted.
   - Foster Session RPE (sRPE): Universal workload metric (duration * RPE).
3. COACHING VOICE & STYLE:
   - Always respond in natural, authoritative, motivating Indonesian language.
   - Answer directly to the point. Never include technical notes, meta-disclaimers, or footnotes like "Catatan:".
   - Keep answers clear, well-structured, and immediately actionable for the athlete.`;

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
    return `### Lingkup Pelatih Olahraga (rkbot)

Halo! Sebagai asisten pelatih performa atletik hibrida, keahlian saya berfokus pada:
- **Manajemen Beban Latihan (ACWR)** dan pencegahan kelelahan akut.
- **Jadwal Hibrida & Interference Effect** (kombinasi Push-Pull-Legs dengan lari).
- **Protokol Lari Kardiorespirasi** (Norwegian 4x4, Zona 2 aerobik, tempo).
- **Nutrisi & Hidrasi Pemulihan** pasca latihan.

Silakan tanyakan menu latihan, jadwal besok, atau analisis beban fisik Anda!`;
  }

  const p = prompt.toLowerCase();

  // 3. Smart Daily / Tomorrow Recommendation Handler
  if (
    p.includes('rekomen') ||
    p.includes('saran') ||
    p.includes('besok') ||
    p.includes('menu') ||
    p.includes('jadwal') ||
    p.includes('program')
  ) {
    const legHours = ctx?.lastLegsHoursAgo ?? 999;
    const isLegLocked = legHours < 48;
    const acwr = ctx?.acwrRatio ?? 1.0;
    const readiness = ctx?.readinessScore ?? 80;

    if (acwr > 1.5) {
      return `### Rekomendasi Menu Latihan Besok (rkbot)

Status Beban Latihan: Lonjakan Akut (ACWR ${acwr}).
Kesiapan Fisik: ${readiness}/100.

Menu Utama yang Dianjurkan Besok:
- Active Recovery & Mobility: Sesi peregangan dinamis, foam rolling, atau jalan santai selama 30 menit.
- Hindari beban intensitas tinggi untuk mencegah kelelahan berlebih pada sistem saraf pusat.

Tujuan: Menurunkan rasio beban akut ke zona aman tanpa menghilangkan adaptasi kebugaran.`;
    }

    if (isLegLocked) {
      return `### Rekomendasi Menu Latihan Besok (rkbot)

Status Pemulihan Kaki: ${legHours < 900 ? `${legHours} jam` : '> 72 jam'} pasca Leg Day (Proteksi 48 Jam Aktif).
Rasio ACWR: ${acwr} | Kesiapan Fisik: ${readiness}/100.

Menu Utama yang Dianjurkan Besok:
1. Latihan Beban Tubuh Bagian Atas (Push / Pull):
   - Fokus: Bench press, pull-ups, overhead press, atau barbell rows.
   - Intensitas: RPE 7-8 (sesuai target progresif beban).
2. Kardio Pemulihan (Opsional):
   - Lari santai aerobik Zona 2 (durasi 30-40 menit, pace percakapan) atau sepeda statis low-impact.

Menu yang Dihindari Besok:
- Sesi lari cepat (Norwegian 4x4, interval VO2 max, sprint tempo) dan latihan beban kaki berat (squat/deadlift) agar sintesis kolagen tendon patela dan paha tidak terganggu.`;
    }

    return `### Rekomendasi Menu Latihan Besok (rkbot)

Status Pemulihan Kaki: Siap / Clear (> 48 jam pasca latihan kaki).
Rasio ACWR: ${acwr} (Zona Optimal) | Kesiapan Fisik: ${readiness}/100.

Menu Utama yang Dianjurkan Besok:
1. Sesi Kardiorespirasi Intensitas Tinggi:
   - Norwegian 4x4 Interval VO2 Max (4 ronde x 4 menit Zona 4 @ 85-95% HRmax, jeda 3 menit Zona 2).
   - ATAU Tempo Run 30-45 menit pada ambang laktat.
2. Alternatif Latihan Beban:
   - Sesi Leg Day (Squat, Romanian Deadlift, Bulgarian Split Squats) dengan target beban progresif.

Pastikan melakukan pemanasan mobilitas 10 menit sebelum memulai sesi berintensitas tinggi.`;
  }

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
}`;
  }

  if (p.includes('lari') || p.includes('run') || p.includes('leg') || p.includes('kaki')) {
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
}`;
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

Protokol dari *Norwegian University of Science and Technology* terbukti sangat efektif meningkatkan $VO_2 \\max$:
- **Pemanasan:** 10 menit di Zone 2 (60–70% HRR).
- **Interval Utama:** 4 ronde x (4 menit di Zone 4 @ 85–95% HRmax).
- **Pemulihan Aktif:** 3 menit lari santai di Zone 2 di antara setiap interval (total 4 kali).
- **Pendinginan:** 6 menit di Zone 1 flush.
- **Total Durasi:** 44 menit | **Edwards TRIMP Score:** Tepat 114 poin.

*Kunci Keberhasilan:* Jaga ritme agar denyut jantung bertahan stabil di 85–95% HRmax selama 4 menit interval, jangan biarkan berubah menjadi sprint anaerobik murni (Zone 5).`;
  }

  return `### Panduan Pelatih Olahraga (rkbot)

Sebagai sistem pendukung keputusan latihan atletik hibrida Anda:
- **Rasio ACWR:** **${ctx?.acwrRatio ?? 'N/A'}** (${ctx?.acwrStatus ?? 'N/A'})
- **Kesiapan Fisik:** **${ctx?.readinessScore ?? 'N/A'}/100**

Anda dapat menanyakan rekomendasi beban latihan hari ini, jadwal lari pasca leg day, nutrisi pemulihan, atau protokol interval VO2 max.`;
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
      return generateOfflineSportsScienceResponse(userMessage, effectiveCtx);
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

    // Try robust candidate models in priority order: gemini-3.5-flash, gemini-flash-latest, gemini-3.1-flash-lite
    const candidateModels = [
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
    ];

    let lastError: any = null;

    for (const modelName of candidateModels) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          }

          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });

          const outputText = response.text || '';
          if (outputText.trim()) {
            return outputText.trim();
          }
        } catch (err: any) {
          lastError = err;
          const errMsg = String(err?.message || '');
          const isRetryable =
            errMsg.includes('503') ||
            errMsg.includes('429') ||
            errMsg.includes('UNAVAILABLE') ||
            errMsg.includes('high demand') ||
            errMsg.includes('404');
          if (!isRetryable) {
            break;
          }
        }
      }
    }

    console.warn('All Gemini models attempted, falling back to local engine:', lastError?.message || lastError);
    return generateOfflineSportsScienceResponse(userMessage, effectiveCtx);
  } catch (err: any) {
    console.error('Gemini API Dispatch Error:', err);
    return generateOfflineSportsScienceResponse(userMessage, effectiveCtx);
  }
}









