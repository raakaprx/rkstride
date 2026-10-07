import { useState, useMemo, useEffect } from 'react';
import { useWorkoutEngine } from './hooks/useWorkoutEngine';
import { HeaderNavbar } from './components/HeaderNavbar';
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
import { AthleteContext } from './lib/ai/geminiCoach';
import { db, seedInitialDataIfEmpty } from './lib/db/database';
import { UserProfile } from './types/workout';
import { RaceTargetConfig } from './types/productFeatures';

export default function App() {
  const [activeTab, setActiveTab] = useState<'training' | 'trends' | 'nutrition' | 'schedule' | 'smartwatch'>('training');

  const tabTitles: Record<typeof activeTab, string> = {
    training: 'Latihan & Beban Kerja Hari Ini',
    trends: 'Tren Beban Kerja ACWR',
    nutrition: 'Nutrisi & Energi Atlet',
    schedule: 'Jadwal Latihan Mingguan',
    smartwatch: 'Smartwatch & Biometrik Harian',
  };

  // Modals state
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sticky Top Header */}
      <HeaderNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        smartwatchState={smartwatchState}
        onOpenSmartwatchModal={() => setActiveTab('smartwatch')}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onOpenAboutModal={() => setIsAboutModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* Main Container */}
      <main
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
        {/* Tab 1: Menu Utama - Latihan & Evaluasi Beban */}
        {activeTab === 'training' && (
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

        {/* Tab 2: Dashboard Tren ACWR & Beban Kerja 28 Hari */}
        {activeTab === 'trends' && (
          <TrendsDashboardCard history={history} onNavigateToLogger={() => setActiveTab('training')} />
        )}

        {/* Tab 3: Nutrisi & Kebutuhan Energi Atlet Hibrida */}
        {activeTab === 'nutrition' && (
          <NutritionBodyCompCard
            userProfile={userProfile}
            todayWorkoutDurationMinutes={debriefData.totalDurationMin || 0}
            todayWorkoutCaloriesBurned={debriefData.sessionLoad > 0 ? Math.round(debriefData.sessionLoad * 1.5) : 0}
            isWorkoutEstimated={!(debriefData.sessionLoad > 0)}
          />
        )}

        {/* Tab 4: Jadwal Mingguan Kustom */}
        {activeTab === 'schedule' && (
          <ScheduleCustomizer
            weeklySchedule={weeklySchedule}
            scheduleConflicts={scheduleConflicts}
            onUpdateDay={updateDaySchedule}
            onApplyTemplate={applyScheduleTemplate}
          />
        )}

        {/* Tab 5: Integrasi Jam Pintar Universal (Smartwatch Hub) */}
        {activeTab === 'smartwatch' && (
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
        onProfileUpdated={(updated) => setUserProfile(updated)}
      />

      {/* Minimalist Dark Footer */}
      <Footer />
    </div>
  );
}

