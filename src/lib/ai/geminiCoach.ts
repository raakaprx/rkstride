import { GoogleGenAI } from '@google/genai';
import { ReadinessCheckIn } from '@/types/workout';

export interface AthleteContext {
  acwrRatio: number;
  acwrStatus: 'safe' | 'optimal' | 'danger_overtraining';
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

const LOCAL_STORAGE_KEY = 'rkstride_gemini_api_key';

export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem(LOCAL_STORAGE_KEY) ||
    ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) ||
    ''
  );
}

export function saveStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (!key.trim()) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } else {
    localStorage.setItem(LOCAL_STORAGE_KEY, key.trim());
  }
}

/**
 * Build personalized sports science system prompt based on athlete's live telemetry
 */
export function buildSystemInstruction(ctx: AthleteContext): string {
  const isDanger = ctx.acwrRatio > 1.4;
  const legLocked = ctx.lastLegsHoursAgo < 48;

  return `You are the RKStride AI Athletic Coach, an elite exercise physiologist, strength & conditioning specialist (CSCS), and hybrid running coach.
You coach athletes combining Push-Pull-Legs (PPL) resistance training and cardiovascular running (from Zone 2 aerobic base to Norwegian 4x4 VO2 Max intervals).

Your guidance is strictly grounded in evidence-based sports science:
1. ACWR (Acute:Chronic Workload Ratio - Dr. Tim Gabbett model):
   - Sweet Spot (0.8 - 1.3): Lowest injury incidence, optimal adaptation.
   - Danger Zone (> 1.4): Acute workload spike with 2-4x higher soft-tissue injury risk. Mandatory -30% volume reduction and deload.
   - Under-load (< 0.8): Detraining risk, recommend safe progressive overload.
2. 48-Hour Lower Body Recovery Window (Concurrent Training Interference Effect - Hickson/Baar):
   - Never recommend heavy squats or high-speed running (Norwegian 4x4, track intervals, tempo) within 48h of leg sessions to safeguard patellar and hamstring tendons, and avoid mTORC1 blunting via excessive AMPK signaling.
3. Cardiorespiratory Spectrum:
   - Zone 1 (50-60% HRmax): Active recovery & lactate clearance (< 35 min).
   - Zone 2 (60-70% HRmax): Aerobic base, mitochondrial density, high fat oxidation.
   - Zone 4 (80-90% HRmax): Lactate threshold & Norwegian 4x4 protocol.
   - Zone 5 (>90% HRmax): Anaerobic sprint & VO2 max ceiling.
4. Post-Workout Recovery:
   - 25-35g protein within 45-60 min for muscle protein synthesis (MPS).
   - 500-750ml water + sodium/electrolytes.
   - Sleep: 7.5 - 8.5 hours for slow-wave sleep and HGH release.

CURRENT ATHLETE TELEMETRY (LIVE DATA):
- Current ACWR Ratio: ${ctx.acwrRatio} (${ctx.acwrStatus.toUpperCase()})
- Acute Load (7-day): ${ctx.acuteLoad} pts/day | Chronic Load (28-day): ${ctx.chronicLoad} pts/day
- Smartwatch Bio-Readiness Score: ${ctx.readinessScore}/100
- Sleep Duration: ${ctx.readiness.sleepHours} hrs
- Resting Heart Rate: ${ctx.readiness.restingHeartRate || 52} bpm
- Muscle Soreness (DOMS): ${ctx.readiness.muscleSoreness}/5
- Leg Fatigue: ${ctx.readiness.legFatigue ? 'FATIGUED/SORE' : 'FRESH'}
- Energy Level: ${ctx.readiness.energyLevel.toUpperCase()}
- Hours Since Previous Leg Session: ${ctx.lastLegsHoursAgo < 900 ? `${ctx.lastLegsHoursAgo} hours` : '> 72 hours'} (48h Lockout: ${legLocked ? 'ACTIVE / LOCKED' : 'CLEARED / READY'})
${
  ctx.recentWorkoutSummary
    ? `- Just Logged Workout: ${ctx.recentWorkoutSummary.strengthExercisesCount} strength exercises, ${ctx.recentWorkoutSummary.runningKm} km running (${ctx.recentWorkoutSummary.runningMinutes} min), Session Load: ${ctx.recentWorkoutSummary.totalLoadScore} pts.`
    : ''
}

COACHING DIRECTIVES:
- Address the user with a confident, motivating, and disciplined athletic coach persona.
- Keep answers concise, actionable, and structured with clear bullet points.
- Always contextualize advice to the athlete's current ACWR (${ctx.acwrRatio}) and leg recovery status.
- You can respond in Indonesian or English matching the user's language. Default to Indonesian with clear international athletic terms when asked in Indonesian.
${isDanger ? 'CRITICAL: The athlete is in an ACWR OVERTRAINING SPIKE (> 1.4). Emphasize immediate deload, active mobility, and tell them NOT to push hard today.' : ''}
${legLocked ? 'NOTE: The 48-hour leg window is currently active. Do NOT recommend heavy squats or fast interval running today.' : ''}`;
}

/**
 * Generate intelligent offline sports science response if no API key is provided
 */
function generateOfflineSportsScienceResponse(
  prompt: string,
  ctx: AthleteContext
): string {
  const p = prompt.toLowerCase();
  const legLocked = ctx.lastLegsHoursAgo < 48;

  if (p.includes('analisis') || p.includes('beban') || p.includes('acwr') || p.includes('workload')) {
    return `### 📊 Analisis Beban Latihan Terkini (ACWR Engine)

Berdasarkan telemetri performa Anda saat ini:
- **Rasio ACWR:** **${ctx.acwrRatio}** (${ctx.acwrStatus === 'optimal' ? 'Zona Manis / Optimal Sweet Spot' : ctx.acwrStatus === 'danger_overtraining' ? '⚠️ Peringatan Spike Beban Akut' : 'Stimulus Ringan'})
- **Beban Akut (7 Hari):** ${ctx.acuteLoad} pts/hari
- **Beban Kronis (28 Hari):** ${ctx.chronicLoad} pts/hari
- **Skor Kesiapan Biometrik:** ${ctx.readinessScore}/100 (${ctx.readiness.sleepHours} jam tidur, RHR ${ctx.readiness.restingHeartRate || 52} bpm)

${
  ctx.acwrRatio > 1.4
    ? '⚠️ **Rekomendasi Utama:** Beban akut Anda melonjak tajam melewati batas 1.4. Risiko cedera tendon dan kelelahan sistem saraf meningkat 2-4x lipat. Lakukan *active recovery* atau *mobility session*, jangan menambah beban berat hari ini.'
    : ctx.acwrRatio >= 0.8
    ? '✅ **Rekomendasi Utama:** Anda berada di *Sweet Spot* ideal (0.8–1.3). Kapasitas adaptasi kardiorespirasi dan hipertrofi otot berada pada titik puncak. Pertahankan intensitas ini tanpa lonjakan tiba-tiba.'
    : '📈 **Rekomendasi Utama:** Beban Anda saat ini tergolong ringan. Aman untuk menerapkan *progressive overload* (tambah beban angkat 2.5 kg atau tambah durasi lari 5–10 menit).'
}

*(Tip: Pasang Google Gemini API Key Anda pada pengaturan widget di atas untuk konsultasi live tanpa batas!)*`;
  }

  if (p.includes('lari') || p.includes('besok') || p.includes('run') || p.includes('leg') || p.includes('kaki')) {
    return `### 🏃 Rekomendasi Sesi Lari & Jendela Pemulihan Kaki

Status Pemulihan Otot Kaki: **${ctx.lastLegsHoursAgo < 900 ? `${ctx.lastLegsHoursAgo} jam` : '> 72 jam'} pasca Leg Day**.

${
  legLocked
    ? `⚠️ **Proteksi 48 Jam Aktif:**
Karena latihan kaki terakhir baru berlangsung ${ctx.lastLegsHoursAgo} jam yang lalu, serat otot paha dan tendon patela masih dalam fase remodeling kolagen mikroskopis.
- **DILARANG:** Lari berkecepatan tinggi (*Norwegian 4x4, Track Intervals, Tempo Run*).
- **DIPERBOLEHKAN:** Lari santai pemulihan Zone 1 / Zone 2 ringan (< 35 menit) dengan detak jantung dijaga di bawah 140 bpm, atau alihkan ke *Upper Body Push/Pull*.`
    : `✅ **Jendela Proteksi Kaki Bersih (> 48 Jam):**
Kaki Anda sudah melewati ambang batas pemulihan minimum. Anda aman untuk menjalankan sesi lari berintensitas tinggi seperti **Norwegian 4x4** atau **Tempo Run**, asalkan skor kesiapan tubuh tetap prima.`
}

*(Tip: Pasang Google Gemini API Key Anda pada pengaturan widget di atas untuk konsultasi live tanpa batas!)*`;
  }

  if (p.includes('nutrisi') || p.includes('makan') || p.includes('protein') || p.includes('recovery')) {
    return `### 🥗 Protokol Nutrisi & Hidrasi Pasca Latihan

Untuk mengoptimalkan sintesis protein otot (*MPS*) dan pengisian kembali glikogen setelah sesi latihan:
1. **Target Protein:** Konsumsi **25–35 gram protein berkualitas tinggi** (Whey, dada ayam, telur, atau tahu/tempe) dalam jendela 45–90 menit pasca latihan.
2. **Rehidrasi & Elektrolit:** Minum minimal **500–750 ml air** yang mengandung natrium/elektrolit untuk menggantikan cairan yang hilang akibat keringat.
3. **Karbohidrat Kompleks:** Gabungkan dengan 40–60g karbohidrat (nasi merah, oatmeal, pisang) untuk mempercepat resintesis glikogen otot.
4. **Kualitas Tidur Malam Ini:** Targetkan minimal **7.5 – 8.5 jam tidur** agar pelepasan hormon pertumbuhan (*HGH*) bekerja maksimal pada fase NREM 3.`;
  }

  if (p.includes('norwegian') || p.includes('4x4') || p.includes('vo2')) {
    return `### ⚡ Panduan Eksekusi Protokol Norwegian 4x4

Protokol dari *Norwegian University of Science and Technology* (Helgerud & Wisløff) adalah metode terbukti paling efektif meningkatkan $VO_2 \max$:
- **Warm-up:** 10 menit di Zone 2 (60–70% HRmax).
- **Interval Utama:** 4 ronde $\times$ (4 menit di Zone 4 @ 85–95% HRmax).
- **Active Recovery:** 3 menit lari santai di Zone 2 di antara setiap interval (total 4 kali).
- **Cool-down:** 10 menit di Zone 1 flush.
- **Total Durasi:** 48 menit | **Estimasi Beban:** ~72 load pts.

*Kunci Keberhasilan:* Jaga ritme interval agar tidak berubah menjadi sprint murni (Zone 5). Anda harus sanggup bertahan pada 85-95% denyut jantung secara konsisten selama 4 menit penuh.`;
  }

  return `### 💡 Panduan Pelatih Atletik RKStride

Terima kasih atas pertanyaan Anda! Sebagai asisten pelatih performa hibrida:
- Rasio ACWR Anda saat ini adalah **${ctx.acwrRatio}** (${ctx.acwrStatus}).
- Skor kesiapan harian: **${ctx.readinessScore}/100**.
- Jendela pemulihan kaki: **${ctx.lastLegsHoursAgo < 900 ? `${ctx.lastLegsHoursAgo}h` : '> 72h'}**.

Untuk mengajukan pertanyaan khusus, rencana latihan spesifik, atau penyesuaian beban cedera:
1. Masukkan Google Gemini API Key Anda melalui ikon pengaturan di pojok kanan atas obrolan ini.
2. Atau coba tombol pertanyaan instan di bawah ini!`;
}

/**
 * Ask Gemini Coach with fallback and context injection
 */
export async function askGeminiCoach(
  userMessage: string,
  history: ChatMessage[],
  ctx: AthleteContext
): Promise<string> {
  const apiKey = getStoredApiKey();

  // If no API key is provided, use the offline sports science knowledge base
  if (!apiKey) {
    // Artificial brief delay for realistic conversational UX
    await new Promise((resolve) => setTimeout(resolve, 600));
    return generateOfflineSportsScienceResponse(userMessage, ctx);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = buildSystemInstruction(ctx);

    // Format chat history for multi-turn interaction
    const contents = history
      .filter((m) => m.role === 'user' || m.role === 'model')
      .map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

    // Add current user prompt
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
    // Graceful fallback to sports science engine with error hint
    const offlineReply = generateOfflineSportsScienceResponse(userMessage, ctx);
    return `${offlineReply}\n\n*(Catatan koneksi: Terjadi kendala API key (${err.message || 'Error'}). Respon di atas dihasilkan oleh engine fisiologi lokal RKStride.)*`;
  }
}
