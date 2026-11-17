import { describe, it, expect } from 'vitest';
import {
  isQueryInSportsDomain,
  checkMedicalRedFlags,
  generateOfflineSportsScienceResponse,
  buildSystemInstruction,
  isSafeProxyUrl,
  AthleteContext,
} from '../geminiCoach';
import { buildAthleteContext } from '../buildAthleteContext';

describe('rkbot AI Coach & Local Sports Science Engine', () => {
  const mockContext: AthleteContext = {
    acwrRatio: 1.15,
    acwrStatus: 'sweet_spot',
    acuteLoad: 420,
    chronicLoad: 365,
    readinessScore: 82,
    lastLegsHoursAgo: 24, // 24 hours ago, 48h protection window is ACTIVE
    readiness: {
      sleepHours: 7.8,
      muscleSoreness: 3,
      legFatigue: true,
      energyLevel: 'moderate',
      restingHeartRate: 52,
    },
  };

  describe('isQueryInSportsDomain scope detection', () => {
    it('accepts short queries and natural athletic recommendation questions', () => {
      expect(isQueryInSportsDomain('halo')).toBe(true);
      expect(isQueryInSportsDomain('apa rekomen untuk besok')).toBe(true);
      expect(isQueryInSportsDomain('rekomendasi latihan besok')).toBe(true);
      expect(isQueryInSportsDomain('menu besok apa ya coach')).toBe(true);
      expect(isQueryInSportsDomain('jadwal lari setelah squat')).toBe(true);
      expect(isQueryInSportsDomain('nutrisi pemulihan otot')).toBe(true);
    });

    it('correctly filters non-sports out-of-domain queries', () => {
      expect(isQueryInSportsDomain('bagikan resep kue bolu coklat panggang')).toBe(false);
      expect(isQueryInSportsDomain('siapa presiden amerika serikat pertama kali')).toBe(false);
    });
  });

  describe('checkMedicalRedFlags', () => {
    it('flags acute symptoms immediately', () => {
      const alert = checkMedicalRedFlags('dada saya terasa sakit dan nyeri dada saat lari');
      expect(alert).not.toBeNull();
      expect(alert).toContain('PERINGATAN KESELAMATAN MEDIS');
      expect(alert).toContain('bukan pengganti diagnosis medis');
    });

    it('allows normal workout fatigue and DOMS through', () => {
      expect(checkMedicalRedFlags('kaki saya agak pegal setelah leg day')).toBeNull();
      expect(checkMedicalRedFlags('apa rekomen untuk besok')).toBeNull();
    });
  });

  describe('generateOfflineSportsScienceResponse', () => {
    it('provides concrete workout recommendation for tomorrow taking 48h leg recovery into account', () => {
      const response = generateOfflineSportsScienceResponse('apa rekomen untuk besok', mockContext);

      // Must be branded as rkbot
      expect(response).toContain('rkbot');
      // Must not falsely reject
      expect(response).not.toContain('Maaf, sebagai asisten pelatih');
      // Must recognize 24h post leg day active protection
      expect(response).toContain('Pemulihan Kaki');
      expect(response).toContain('Proteksi 48 Jam');
      expect(response).toContain('Tubuh Bagian Atas');
      expect(response).toContain('Norwegian 4x4');
    });

    it('recommends high intensity running when legs are cleared (> 48h)', () => {
      const clearedContext: AthleteContext = {
        ...mockContext,
        lastLegsHoursAgo: 72,
      };

      const response = generateOfflineSportsScienceResponse('apa rekomen untuk besok', clearedContext);
      expect(response).toContain('rkbot');
      expect(response).toContain('Clear');
      expect(response).toContain('Norwegian 4x4');
    });
  });

  describe('buildSystemInstruction', () => {
    it('sets bot persona strictly as rkbot', () => {
      const instruction = buildSystemInstruction(mockContext);
      expect(instruction).toContain('You are rkbot');
      expect(instruction).not.toContain('You are the RKStride AI Athletic Coach');
      expect(instruction).toContain('Always introduce and refer to yourself simply as "rkbot"');
    });
  });

  describe('buildAthleteContext & proxy URL safety', () => {
    it('omits restingHeartRate instead of fabricating a number when unmeasured', () => {
      const ctx = buildAthleteContext({
        acwrResult: {
          acuteLoad: 100,
          chronicLoad: 100,
          ratio: 1.0,
          status: 'insufficient_data',
          method: 'rolling_coupled',
          daysCollected: 5,
          coldStartProgressPercent: 24,
          weeklySpikeAlert: false,
          weeklySpikePercent: 0,
        },
        todayReadiness: {
          sleepHours: 7,
          muscleSoreness: 2,
          legFatigue: false,
          energyLevel: 'moderate',
        },
        readinessScore: 75,
        lastLegsHoursAgo: 72,
      });
      expect(ctx.readiness.restingHeartRate).toBeUndefined();
      expect(ctx.acwrStatus).toBe('insufficient_data');
    });

    it('rejects non-HTTPS external proxy URLs and allows HTTPS or localhost URLs', () => {
      expect(isSafeProxyUrl('https://coach.example.com/api/chat')).toBe(true);
      expect(isSafeProxyUrl('http://localhost:8787/api/coach')).toBe(true);
      expect(isSafeProxyUrl('http://insecure.example.com/api')).toBe(false);
    });
  });
});

