import { useState, useMemo } from 'react';
import { useWorkoutEngine } from './hooks/useWorkoutEngine';
import { HeaderNavbar } from './components/HeaderNavbar';
import { WorkloadAdvisorCard } from './components/WorkloadAdvisorCard';
import { WorkoutLogger } from './components/WorkoutLogger';
import { ScheduleCustomizer } from './components/ScheduleCustomizer';
import { SmartwatchSyncCard } from './components/SmartwatchSyncCard';
import { Footer } from './components/Footer';
import { PostWorkoutDebriefModal, PostWorkoutDebriefData } from './components/PostWorkoutDebriefModal';
import { GeminiCoachWidget } from './components/GeminiCoachWidget';
import { AthleteContext } from './lib/ai/geminiCoach';

export default function App() {
  const [activeTab, setActiveTab] = useState<'training' | 'schedule' | 'smartwatch'>('training');

  // Post-Workout Celebration Modal State
  const [isDebriefOpen, setIsDebriefOpen] = useState(false);
  const [debriefData, setDebriefData] = useState<PostWorkoutDebriefData>({
    sessionLoad: 0,
    projectedACWR: 1.0,
    acwrStatus: 'optimal',
    hasLegWorkout: false,
    hasRunWorkout: false,
    hasUpperWorkout: false,
    totalDurationMin: 0,
  });

  // Prompt to pass into Gemini Coach from debrief modal
  const [externalCoachPrompt, setExternalCoachPrompt] = useState<string>('');

  const {
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
  } = useWorkoutEngine();

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
        {/* Tab 1: Menu Utama - Latihan & Evaluasi Beban */}
        {activeTab === 'training' && (
          <>
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

        {/* Tab 2: Jadwal Mingguan Kustom */}
        {activeTab === 'schedule' && (
          <ScheduleCustomizer
            weeklySchedule={weeklySchedule}
            scheduleConflicts={scheduleConflicts}
            onUpdateDay={updateDaySchedule}
            onApplyTemplate={applyScheduleTemplate}
          />
        )}

        {/* Tab 3: Integrasi Jam Pintar Universal (Smartwatch Hub) */}
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

      {/* Minimalist Dark Footer */}
      <Footer />
    </div>
  );
}
