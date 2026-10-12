import { useState, useMemo, useEffect } from 'react';
import { useWorkoutEngine } from './hooks/useWorkoutEngine';
import { HeaderNavbar } from './components/HeaderNavbar';
import { BottomNav, AppTab } from './components/BottomNav';
import { useOnlineStatus } from './lib/platform';
import { WorkloadAdvisorCard } from './components/WorkloadAdvisorCard';
import { WorkoutLogger } from './components/WorkoutLogger';
import { ScheduleCustomizer } from './components/ScheduleCustomizer';
import { SmartwatchSyncCard } from './components/SmartwatchSyncCard';
import { Footer } from './components/Footer';
import { PostWorkoutDebriefModal, PostWorkoutDebriefData } from './components/PostWorkoutDebriefModal';
import { GeminiCoachWidget } from './components/GeminiCoachWidget';
import { AboutDisclaimerModal } from './components/AboutDisclaimerModal';
import { OnboardingDisclaimerModal } from './components/OnboardingDisclaimerModal';
import { DataManagementModal } from './components/DataManagementModal';
import { PeriodizationTaperCard } from './components/PeriodizationTaperCard';
import { NutritionBodyCompCard } from './components/NutritionBodyCompCard';
import { TrendsDashboardCard } from './components/TrendsDashboardCard';
import { OnboardingProfileModal } from './components/OnboardingProfileModal';
import { AICoachSettingsModal } from './components/AICoachSettingsModal';
import { AthleteContext } from './lib/ai/geminiCoach';
import { db, seedInitialDataIfEmpty } from './lib/db/database';
import { UserProfile } from './types/workout';
import { RaceTargetConfig } from './types/productFeatures';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const isOnline = useOnlineStatus();

  const tabTitles: Record<AppTab, string> = {
    today: 'Latihan Hari Ini',
    load: 'Beban & Kesiapan',
    program: 'Program Mingguan',
    fuel: 'Nutrisi & Energi',
    coach: 'Pelatih & Perangkat',
  };

  // Modals state
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);

  // Athlete Profile & Race Target State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    age: 28,
    weightKg: 72,
    heightCm: 175,
    restingHrBaseline: 52,
    maxHr: 190,
    hrMaxFormula: 'tanaka',
  });

  const [raceConfig, setRaceConfig] = useState<RaceTargetConfig>({
    eventName: 'Jakarta Half Marathon',
    category: 'half_marathon',
    raceDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Post-Workout Celebration Modal State
  const [isDebriefOpen, setIsDebriefOpen] = useState(false);
  const [debriefData, setDebriefData] = useState<PostWorkoutDebriefData>({
    sessionLoad: 0,
    projectedACWR: 1.0,
    acwrStatus: 'sweet_spot',
    hasLegWorkout: false,
    hasRunWorkout: false,
    hasUpperWorkout: false,
    totalDurationMin: 0,
  });

  // Prompt to pass into Gemini Coach from debrief modal
  const [externalCoachPrompt, setExternalCoachPrompt] = useState<string>('');

  const {
    history,
    acwrResult,
    recommendation,
    readinessScore,
    todayReadiness,
    setTodayReadiness,
    lastLegsTrainedHoursAgo,
    weeklySchedule,
    scheduleConflicts,
    updateDaySchedule,
    applyScheduleTemplate,
    smartwatchState,
    connectBluetooth,
    importSmartwatchFile,
    applyPreset,
    calculateProjectedImpact,
    logTodayWorkout,
    reloadFromDb,
    dbError,
  } = useWorkoutEngine();

  // Initialize Dexie IndexedDB baseline seed and check onboarding disclaimer consent
  useEffect(() => {
    const initAppPersistence = async () => {
      await seedInitialDataIfEmpty();
      try {
        const storedProfile = await db.userProfile.get('current_user');
        if (storedProfile) {
          setUserProfile(storedProfile);
        }
        const storedRace = await db.appSettings.get('targetRaceConfig');
        if (storedRace && storedRace.value) {
          setRaceConfig(storedRace.value);
        }
        const storedDebrief = await db.postWorkoutDebrief.get('latest');
        if (storedDebrief) {
          const { id: _ignored, ...debrief } = storedDebrief;
          setDebriefData(debrief);
        }
        const acceptedLocal = localStorage.getItem('rkstride_disclaimer_accepted');
        const acceptedDbSetting = await db.appSettings.get('disclaimerAccepted');
        if (!acceptedLocal && (!acceptedDbSetting || !acceptedDbSetting.value)) {
          setIsOnboardingOpen(true);
        }
      } catch (err) {
        console.error('Error checking stored settings state:', err);
      }
    };
    initAppPersistence();
  }, []);

  const handleAcceptDisclaimer = async () => {
    try {
      localStorage.setItem('rkstride_disclaimer_accepted', 'true');
      await db.appSettings.put({
        key: 'disclaimerAccepted',
        value: true,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to persist disclaimer acceptance:', err);
    }
    setIsOnboardingOpen(false);
  };

  // Dynamic Athlete Context for Google Gemini AI Coach
  const athleteContext: AthleteContext = useMemo(() => ({
    acwrRatio: acwrResult.ratio,
    acwrStatus: acwrResult.status,
    acuteLoad: acwrResult.acuteLoad,
    chronicLoad: acwrResult.chronicLoad,
    readiness: todayReadiness,
    readinessScore,
    lastLegsHoursAgo: lastLegsTrainedHoursAgo,
    recentWorkoutSummary: debriefData.sessionLoad > 0 ? {
      strengthExercisesCount: debriefData.hasLegWorkout || debriefData.hasUpperWorkout ? 3 : 0,
      runningMinutes: debriefData.totalDurationMin,
      runningKm: Math.round(debriefData.totalDurationMin * 0.15 * 10) / 10,
      totalLoadScore: debriefData.sessionLoad,
    } : undefined,
  }), [acwrResult, todayReadiness, readinessScore, lastLegsTrainedHoursAgo, debriefData]);

  const handleWorkoutCompletedDebrief = (data: PostWorkoutDebriefData) => {
    setDebriefData(data);
    setIsDebriefOpen(true);
    db.postWorkoutDebrief.put({ id: 'latest', ...data }).catch((err) => {
      console.error('Failed to persist debrief data:', err);
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sticky Top Header */}
      <HeaderNavbar
        smartwatchState={smartwatchState}
        isOnline={isOnline}
        onOpenSmartwatchModal={() => setActiveTab('coach')}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onOpenAboutModal={() => setIsAboutModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenAiSettingsModal={() => setIsAiSettingsOpen(true)}
      />

      {/* Main Container */}
      <main
        className="app-main dock-safe-bottom"
        style={{
          flex: 1,
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          {tabTitles[activeTab]}
        </h1>
        {/* Storage error banner (Phase 5: errors surface inline, never alert()) */}
        {dbError && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger)',
              fontSize: '0.85rem',
              color: 'var(--color-danger)',
            }}
          >
            <strong>Gagal memuat data lokal:</strong> {dbError}
          </div>
        )}
        {/* Hari Ini: Menu Utama - Latihan & Evaluasi Beban */}
        {activeTab === 'today' && (
          <>
            {/* Kartu Target Kompetisi & Tapering Dinamis */}
            {raceConfig.category !== 'none' && (
              <PeriodizationTaperCard
                raceConfig={raceConfig}
                onEditRaceConfig={() => setIsProfileModalOpen(true)}
              />
            )}

            {/* Kartu Evaluasi Beban (ACWR & Rekomendasi Pintar) */}
            <WorkloadAdvisorCard
              acwr={acwrResult}
              recommendation={recommendation}
              readiness={todayReadiness}
              readinessScore={readinessScore}
              lastLegsHoursAgo={lastLegsTrainedHoursAgo}
            />

            {/* Modul Input Latihan Interaktif dengan Katalog Gerakan Lengkap & Dropdown */}
            <WorkoutLogger
              onSaveWorkout={logTodayWorkout}
              calculateProjectedImpact={calculateProjectedImpact}
              liveSmartwatchHeartRate={smartwatchState.liveHeartRate}
              lastLegsHoursAgo={lastLegsTrainedHoursAgo}
              onWorkoutCompletedDebrief={handleWorkoutCompletedDebrief}
            />
          </>
        )}

        {/* Beban: Dashboard Tren ACWR & Beban Kerja 28 Hari */}
        {activeTab === 'load' && (
          <TrendsDashboardCard history={history} onNavigateToLogger={() => setActiveTab('today')} />
        )}

        {/* Nutrisi: Nutrisi & Kebutuhan Energi Atlet Hibrida */}
        {activeTab === 'fuel' && (
          <NutritionBodyCompCard
            userProfile={userProfile}
            todayWorkoutDurationMinutes={debriefData.totalDurationMin || 0}
            todayWorkoutCaloriesBurned={debriefData.sessionLoad > 0 ? Math.round(debriefData.sessionLoad * 1.5) : 0}
            isWorkoutEstimated={!(debriefData.sessionLoad > 0)}
          />
        )}

        {/* Program: Jadwal Mingguan Kustom */}
        {activeTab === 'program' && (
          <ScheduleCustomizer
            weeklySchedule={weeklySchedule}
            scheduleConflicts={scheduleConflicts}
            onUpdateDay={updateDaySchedule}
            onApplyTemplate={applyScheduleTemplate}
          />
        )}

        {/* Coach: Integrasi Jam Pintar Universal (Smartwatch Hub) */}
        {activeTab === 'coach' && (
          <SmartwatchSyncCard
            smartwatchState={smartwatchState}
            readiness={todayReadiness}
            onUpdateReadiness={setTodayReadiness}
            onConnectBluetooth={connectBluetooth}
            onImportFile={importSmartwatchFile}
            onApplyPreset={applyPreset}
          />
        )}
      </main>

      {/* Post-Workout Celebration & Immediate Recovery Debrief Modal */}
      <PostWorkoutDebriefModal
        isOpen={isDebriefOpen}
        onClose={() => setIsDebriefOpen(false)}
        debriefData={debriefData}
        onOpenAiCoachWithPrompt={(prompt) => {
          setExternalCoachPrompt(prompt);
        }}
      />

      {/* Google Gemini AI Athletic Coach Floating Chat Widget */}
      <GeminiCoachWidget
        athleteContext={athleteContext}
        externalPrompt={externalCoachPrompt}
        onClearExternalPrompt={() => setExternalCoachPrompt('')}
      />

      {/* Scientific Basis & Non-Medical Disclaimer Modal */}
      <AboutDisclaimerModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

      {/* First-Run Onboarding Non-Medical Disclaimer Modal */}
      <OnboardingDisclaimerModal
        isOpen={isOnboardingOpen}
        onAccept={handleAcceptDisclaimer}
        onOpenAboutDetails={() => {
          setIsOnboardingOpen(false);
          setIsAboutModalOpen(true);
        }}
      />

      {/* Offline Data Management, JSON/CSV Export & Zod Import Modal */}
      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onDataImported={() => {
          reloadFromDb();
        }}
      />

      {/* Athlete Physiology Profile & Target Race Modal */}
      <OnboardingProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onProfileUpdated={(updated, race) => {
          setUserProfile(updated);
          if (race) setRaceConfig(race);
        }}
      />

      {/* AI Coach Settings (BYOK key, proxy, telemetry toggle) */}
      <AICoachSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
      />

            {/* Bottom dock: primary destinations in thumb reach */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0 });
        }}
        coachBadgeCount={scheduleConflicts.length}
      />

      {/* Minimalist Dark Footer */}
      <Footer />
    </div>
  );
}

