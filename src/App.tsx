import { useState, useMemo, useEffect } from 'react';
import { useWorkoutEngine } from './hooks/useWorkoutEngine';
import { HeaderNavbar } from './components/HeaderNavbar';
import { BottomNav, AppTab } from './components/BottomNav';
import { useOnlineStatus } from './lib/platform';
import { WorkloadAdvisorCard } from './components/WorkloadAdvisorCard';
import { WorkoutLogger } from './components/WorkoutLogger';
import { ScheduleCustomizer } from './components/ScheduleCustomizer';
import { CoachHubTab } from './components/coach/CoachHubTab';
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
import { AuthLandingGate } from './components/AuthLandingGate';
import { OdooSprintDocsModal } from './components/OdooSprintDocsModal';
import { AthleteContext } from './lib/ai/geminiCoach';
import { buildAthleteContext } from './lib/ai/buildAthleteContext';
import {
  seedInitialDataIfEmpty,
  loadAuthSession,
  saveAuthSession,
  clearAuthSession,
} from './lib/db/profileRepo';
import { loadLatestDebrief, saveLatestDebrief } from './lib/db/workoutRepo';
import { useAthleteProfile } from './hooks/useAthleteProfile';
import { getLocalDateKey } from './lib/engine/dateKey';
import { AthleteAuthSession, UserProfile } from './types/workout';
import { RaceTargetConfig } from './types/productFeatures';

const DEFAULT_PROFILE: UserProfile = {
  age: 28,
  weightKg: 72,
  heightCm: 175,
  restingHrBaseline: 52,
  maxHr: 190,
  hrMaxFormula: 'tanaka',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const isOnline = useOnlineStatus();

  const [authSession, setAuthSession] = useState<AthleteAuthSession | null>(() =>
    loadAuthSession<AthleteAuthSession>()
  );

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
  const [isCoachChatOpen, setIsCoachChatOpen] = useState(false);
  const [isOdooModalOpen, setIsOdooModalOpen] = useState(false);

  const {
    profile: storedProfile,
    raceConfig: storedRaceConfig,
    disclaimerAccepted,
    isLoading: isProfileLoading,
    reload: reloadProfile,
    saveProfileAndRace,
    acceptDisclaimer,
  } = useAthleteProfile();

  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  const [raceConfig, setRaceConfig] = useState<RaceTargetConfig>(() => ({
    eventName: '',
    category: 'none',
    raceDate: getLocalDateKey(new Date(Date.now() + 42 * 24 * 60 * 60 * 1000)),
  }));

  useEffect(() => {
    if (storedProfile) setUserProfile(storedProfile);
  }, [storedProfile]);

  useEffect(() => {
    if (storedRaceConfig) setRaceConfig(storedRaceConfig);
  }, [storedRaceConfig]);

  useEffect(() => {
    if (!isProfileLoading && !disclaimerAccepted) {
      setIsOnboardingOpen(true);
    }
  }, [isProfileLoading, disclaimerAccepted]);

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
    acwrMethod,
    setAcwrMethod,
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

  // Initialize Dexie IndexedDB baseline seed and load latest debrief
  useEffect(() => {
    const initAppPersistence = async () => {
      await seedInitialDataIfEmpty();
      await reloadProfile();
      try {
        const storedDebrief = await loadLatestDebrief();
        if (storedDebrief) {
          const { id: _ignored, ...debrief } = storedDebrief;
          setDebriefData(debrief);
        }
      } catch (err) {
        console.error('Error loading latest debrief:', err);
      }
    };
    initAppPersistence();
  }, [reloadProfile]);

  const handleAcceptDisclaimer = async () => {
    await acceptDisclaimer();
    setIsOnboardingOpen(false);
  };

  const handleAuthenticated = async (
    session: AthleteAuthSession,
    profileUpdates?: Partial<UserProfile>
  ) => {
    setAuthSession(session);
    saveAuthSession(session);
    await acceptDisclaimer();
    if (profileUpdates) {
      const mergedProfile: UserProfile = {
        ...userProfile,
        ...profileUpdates,
      };
      setUserProfile(mergedProfile);
      await saveProfileAndRace({ profile: mergedProfile });
    }
    setIsOnboardingOpen(false);
  };

  const handleLogout = () => {
    setAuthSession(null);
    clearAuthSession();
  };

  const handleChangeExperienceLevel = (nextLevel: AthleteAuthSession['experienceLevel']) => {
    if (authSession) {
      const updatedSession: AthleteAuthSession = {
        ...authSession,
        experienceLevel: nextLevel,
      };
      setAuthSession(updatedSession);
      saveAuthSession(updatedSession);
    }
    const nextProfile = { ...userProfile, experienceLevel: nextLevel };
    setUserProfile(nextProfile);
    saveProfileAndRace({ profile: nextProfile }).catch(console.error);
  };

  // Dynamic Athlete Context for Google Gemini AI Coach (derived from measured logs only)
  const athleteContext: AthleteContext = useMemo(
    () =>
      buildAthleteContext({
        acwrResult,
        todayReadiness,
        readinessScore,
        lastLegsHoursAgo: lastLegsTrainedHoursAgo,
        latestDailyLog: history[0],
      }),
    [acwrResult, todayReadiness, readinessScore, lastLegsTrainedHoursAgo, history]
  );

  const handleWorkoutCompletedDebrief = (data: PostWorkoutDebriefData) => {
    setDebriefData(data);
    setIsDebriefOpen(true);
    saveLatestDebrief(data).catch((err) => {
      console.error('Failed to persist debrief data:', err);
    });
  };

  if (!authSession) {
    return (
      <>
        <AuthLandingGate
          onAuthenticated={handleAuthenticated}
          onOpenOdooModal={() => setIsOdooModalOpen(true)}
          onOpenAboutModal={() => setIsAboutModalOpen(true)}
        />
        <OdooSprintDocsModal
          isOpen={isOdooModalOpen}
          onClose={() => setIsOdooModalOpen(false)}
        />
        <AboutDisclaimerModal
          isOpen={isAboutModalOpen}
          onClose={() => setIsAboutModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sticky Top Header */}
      <HeaderNavbar
        smartwatchState={smartwatchState}
        isOnline={isOnline}
        authSession={authSession}
        experienceLevel={authSession.experienceLevel}
        onChangeExperienceLevel={handleChangeExperienceLevel}
        onOpenSmartwatchModal={() => setActiveTab('coach')}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onOpenAboutModal={() => setIsAboutModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenAiSettingsModal={() => setIsAiSettingsOpen(true)}
        onOpenOdooModal={() => setIsOdooModalOpen(true)}
        onLogout={handleLogout}
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
              experienceLevel={authSession.experienceLevel}
            />

            {/* Modul Input Latihan Interaktif dengan Katalog Gerakan Lengkap & Dropdown */}
            <WorkoutLogger
              onSaveWorkout={logTodayWorkout}
              calculateProjectedImpact={calculateProjectedImpact}
              liveSmartwatchHeartRate={smartwatchState.liveHeartRate}
              lastLegsHoursAgo={lastLegsTrainedHoursAgo}
              experienceLevel={authSession.experienceLevel}
              weeklySchedule={weeklySchedule}
              onWorkoutCompletedDebrief={handleWorkoutCompletedDebrief}
            />
          </>
        )}

        {/* Beban: Dashboard Tren ACWR & Beban Kerja 28 Hari */}
        {activeTab === 'load' && (
          <TrendsDashboardCard
            history={history}
            acwrMethod={acwrMethod}
            onChangeAcwrMethod={setAcwrMethod}
            onNavigateToLogger={() => setActiveTab('today')}
          />
        )}

        {/* Nutrisi: Nutrisi & Kebutuhan Energi Atlet Hibrida */}
        {activeTab === 'fuel' && (() => {
          const todayLog = history.find((h) => h.tanggal === getLocalDateKey());
          const todayDur = todayLog
            ? todayLog.sessions?.reduce((sum, s) => sum + s.durationMinutes, 0) ??
              todayLog.runningWorkouts.reduce((sum, r) => sum + r.durasiMenit, 0) +
                todayLog.strengthWorkouts.reduce((sum, ex) => sum + (ex.durationMinutes ?? ex.sets.length * 3), 0)
            : debriefData.totalDurationMin || 0;
          const todayLoad = todayLog ? todayLog.totalLoadScore : debriefData.sessionLoad;
          return (
            <NutritionBodyCompCard
              userProfile={userProfile}
              todayWorkoutDurationMinutes={todayDur}
              todayWorkoutCaloriesBurned={todayLoad > 0 ? Math.round(todayLoad * 1.5) : 0}
              isWorkoutEstimated={!(todayLoad > 0)}
            />
          );
        })()}

        {/* Program: Jadwal Mingguan Kustom */}
        {activeTab === 'program' && (
          <ScheduleCustomizer
            weeklySchedule={weeklySchedule}
            scheduleConflicts={scheduleConflicts}
            onUpdateDay={updateDaySchedule}
            onApplyTemplate={applyScheduleTemplate}
          />
        )}

        {/* Coach: Integrasi Pelatih AI & Jam Pintar (Coach & Devices Hub) */}
        {activeTab === 'coach' && (
          <CoachHubTab
            acwrResult={acwrResult}
            readinessScore={readinessScore}
            lastLegsTrainedHoursAgo={lastLegsTrainedHoursAgo}
            smartwatchState={smartwatchState}
            todayReadiness={todayReadiness}
            setTodayReadiness={setTodayReadiness}
            connectBluetooth={connectBluetooth}
            importSmartwatchFile={importSmartwatchFile}
            applyPreset={applyPreset}
            onOpenCoachChat={(prompt) => {
              if (prompt) setExternalCoachPrompt(prompt);
              setIsCoachChatOpen(true);
            }}
            onOpenAiSettings={() => setIsAiSettingsOpen(true)}
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
          setIsCoachChatOpen(true);
        }}
      />

      {/* Google Gemini AI Athletic Coach Floating Chat Widget */}
      <GeminiCoachWidget
        athleteContext={athleteContext}
        externalPrompt={externalCoachPrompt}
        onClearExternalPrompt={() => setExternalCoachPrompt('')}
        isOpenControlled={isCoachChatOpen}
        onToggleOpen={setIsCoachChatOpen}
        hideLauncher={activeTab === 'coach'}
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
          reloadProfile();
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

      {/* Odoo Sprint Board & Documentation Modal */}
      <OdooSprintDocsModal
        isOpen={isOdooModalOpen}
        onClose={() => setIsOdooModalOpen(false)}
      />

            {/* Bottom dock: primary destinations in thumb reach */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0 });
        }}
        programBadgeCount={scheduleConflicts.length}
      />

      {/* Minimalist Dark Footer */}
      <Footer />
    </div>
  );
}

