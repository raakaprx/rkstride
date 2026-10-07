/**
 * RKStride - Sports Science & Athletic Physiology Constants
 * Centralized configuration containing all mathematical thresholds, physiological models,
 * and academic literature references.
 *
 * Literature Citations:
 * 1. ACWR Models:
 *    - Gabbett, T. J. (2016). The training—injury prevention paradox: should athletes be training smarter and harder?. British Journal of Sports Medicine, 50(5), 273-280.
 *    - Blanch, P., & Gabbett, T. J. (2016). Has the code of injury prediction been solved?. British Journal of Sports Medicine, 50(8), 471-475.
 *    - Williams, S., et al. (2017). Better way to determine the acute:chronic workload ratio?. British Journal of Sports Medicine, 51(3), 209-210.
 * 2. sRPE (Session Rating of Perceived Exertion):
 *    - Foster, C., et al. (2001). A new approach to monitoring exercise training. Journal of Strength and Conditioning Research, 15(1), 109-115.
 * 3. Heart Rate & TRIMP:
 *    - Edwards, S. (1993). The Heart Rate Monitor Book. Fleet Feet Press.
 *    - Tanaka, H., Monahan, K. D., & Seals, D. R. (2001). Age-predicted maximal heart rate revisited. JACC, 37(1), 153-156.
 *    - Gellish, R. L., et al. (2007). Longitudinal modeling of the relationship between age and maximal heart rate. MSSE, 39(5), 822-829.
 * 4. Interference Effect in Concurrent Training:
 *    - Hickson, R. C. (1980). Interference of strength development by simultaneously training for strength and endurance. EJAO, 45(2-3), 255-263.
 *    - Baar, K. (2014). Using molecular biology to maximize concurrent training. Sports Medicine, 44(2), 117-125.
 * 5. One Rep Max (1RM) Estimations:
 *    - Epley, B. (1985). Poundage chart. Boyd Epley Workout. Lincoln, NE: Body Enterprises.
 *    - Brzycki, M. (1993). Strength testing—Predicting a one-rep max from reps-to-fatigue. JOPERD, 64(1), 88-90.
 */

// =============================================================================
// 1. ACWR (Acute:Chronic Workload Ratio) THRESHOLDS & METHODS
// =============================================================================

export const ACWR_THRESHOLDS = {
  /**
   * Under-training / Detraining: ACWR < 0.8
   * Low stimulus; gradual progressive overload is recommended.
   */
  UNDERTRAINING_MAX: 0.8,

  /**
   * Sweet Spot: 0.8 <= ACWR <= 1.4
   * Optimal athletic adaptation window (AGENTS.md guardrail).
   */
  SWEET_SPOT_MAX: 1.4,

  /**
   * Danger (Bahaya): ACWR > 1.4
   * Acute workload spike; triggers overtraining warning + deload guidance.
   * Single source of truth per AGENTS.md section 4.2.
   */
  DANGER_THRESHOLD: 1.4,
} as const;

/**
 * Alias for the single high-risk boundary (AGENTS.md: ACWR > 1.4).
 */
export const ACWR_HIGH_RISK_THRESHOLD = 1.4;

/**
 * Days required for baseline maturity.
 * Under 21 days is classified as 'insufficient_data' (cold start),
 * showing collection progress rather than premature high-risk alerts.
 */
export const ACWR_COLD_START_MIN_DAYS = 21;

/**
 * EWMA (Exponentially Weighted Moving Average) Smoothing Factors
 * Formula: lambda = 2 / (N + 1)
 * Reference: Williams et al. (2017)
 */
export const EWMA_LAMBDA = {
  ACUTE: 2 / (7 + 1), // 0.25 (7-day decay)
  CHRONIC: 2 / (28 + 1), // ~0.0689655 (28-day decay)
} as const;

/**
 * Weekly workload spike threshold (10–15% rule)
 * Reference: Gabbett (2016). Weekly load increases > 10-15% elevate soft-tissue vulnerability.
 */
export const WEEKLY_LOAD_SPIKE_THRESHOLD_PERCENT = 15;

/**
 * Deload Volume Attenuation Range
 * Depending on ACWR severity and bio-readiness state, volume adjustments range from -20% to -40%.
 */
export const DELOAD_ATTENUATION = {
  MILD: -20, // ACWR slightly above 1.4 with good readiness
  MODERATE: -30, // Standard ACWR > 1.4
  AGGRESSIVE: -40, // ACWR > 1.4 combined with poor bio-readiness / high DOMS
} as const;

// =============================================================================
// 2. UNIVERSAL WORKLOAD METRICS (sRPE & VOLUME LOAD)
// =============================================================================

/**
 * Foster sRPE Scale configuration.
 * Formula: sRPE = Duration (minutes) * RPE (1-10)
 * Reference: Foster et al. (2001)
 */
export const SRPE_CONFIG = {
  MIN_RPE: 1,
  MAX_RPE: 10,
  /**
   * Typical rest intervals included in strength duration estimates.
   * If session duration is not explicitly logged, estimated duration per set is ~2.5 minutes.
   */
  ESTIMATED_MINUTES_PER_STRENGTH_SET: 2.5,
} as const;

// =============================================================================
// 3. HEART RATE ZONES & EDWARDS TRIMP MULTIPLIERS
// =============================================================================

/**
 * Edwards TRIMP (Training Impulse) Zone Multipliers (Edwards, 1993)
 * Zone 1: 50–60% HRR -> 1.0x
 * Zone 2: 60–70% HRR -> 2.0x
 * Zone 3: 70–80% HRR -> 3.0x
 * Zone 4: 80–90% HRR -> 4.0x
 * Zone 5: 90–100% HRR -> 5.0x
 */
export const EDWARDS_ZONE_WEIGHTS: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 1.0,
  2: 2.0,
  3: 3.0,
  4: 4.0,
  5: 5.0,
};

/**
 * Standard Karvonen / Heart Rate Reserve (HRR) Percentage Ranges
 */
export const KARVONEN_PERCENTAGES = {
  ZONE_1: { min: 0.50, max: 0.60 },
  ZONE_2: { min: 0.60, max: 0.70 },
  ZONE_3: { min: 0.70, max: 0.80 },
  ZONE_4: { min: 0.80, max: 0.90 },
  ZONE_5: { min: 0.90, max: 1.00 },
} as const;

/**
 * Default Population Physiological Baselines (used when user profile is incomplete)
 */
export const PHYSIOLOGICAL_DEFAULTS = {
  DEFAULT_AGE: 28,
  DEFAULT_RESTING_HR: 55, // bpm
  DEFAULT_WEIGHT_KG: 72,
  DEFAULT_HEIGHT_CM: 175,
} as const;

// =============================================================================
// 4. CONCURRENT TRAINING INTERFERENCE & RECOVERY WINDOWS
// =============================================================================

export const INTERFERENCE_GUARDRAIL = {
  /**
   * Direction 1: Heavy Lower Body -> High-Intensity Running
   * 48 hours is the evidence-based window for myofibrillar repair and avoiding mTOR blunting by AMPK.
   * Reference: Hickson (1980), Baar (2014)
   */
  LEGS_TO_FAST_RUN_HOURS: 48,

  /**
   * Direction 2: High-Intensity Running -> Heavy Lower Body Lifting
   * 24 hours required for tendon stiffness recovery and glycogen replenishment.
   */
  FAST_RUN_TO_LEGS_HOURS: 24,

  /**
   * Safe aerobic recovery threshold:
   * Low intensity (Zone 1 or Zone 2) running <= 45 minutes is ALWAYS permitted regardless of window.
   */
  SAFE_AEROBIC_RECOVERY_MAX_MINUTES: 45,
} as const;

// =============================================================================
// 5. PERSONAL BASELINE BIO-READINESS (Z-SCORE WEIGHTS)
// =============================================================================

export const READINESS_Z_WEIGHTS = {
  RESTING_HR: 0.25, // Lower than personal mean is positive
  SLEEP_DURATION: 0.30, // Higher than personal mean is positive
  HRV_RMSSD: 0.25, // Higher than personal mean is positive
  SUBJECTIVE_DOMS_FATIGUE: 0.20, // Muscle soreness & systemic fatigue
} as const;

export const READINESS_MIN_BASELINE_DAYS = 14;
export const READINESS_PROVISIONAL_DAYS = 7;

// =============================================================================
// 6. STRENGTH HYPERTROPHY & 1RM CONSTANTS
// =============================================================================

export const HARD_SET_MIN_RPE = 7.0; // Sets with RPE >= 7.0 qualify as productive hard sets

// =============================================================================
// 7. PERIODIZATION & COMPETITION TAPERING CONSTANTS
// Literature: Mujika, I., & Padilla, S. (2003). Scientific Bases for Precompetition Tapering in Endurance Athletes. MSSE, 35(7), 1182-1187.
// =============================================================================

export const TAPERING_CONSTANTS = {
  /**
   * Optimal pre-competition volume reduction: 30% to 50%
   * Maintained training frequency (>= 80%) and high race-pace intensity.
   */
  VOLUME_REDUCTION_MIN_PERCENT: 30,
  VOLUME_REDUCTION_MAX_PERCENT: 50,
  DEFAULT_TAPER_REDUCTION_PERCENT: 40,

  /**
   * Recommended taper duration in weeks per race category
   */
  TAPER_WEEKS: {
    '5k': 1,
    '10k': 1.5,
    'half_marathon': 2,
    'marathon': 3,
    'hyrox': 2,
  },

  /**
   * Standard distances in kilometers
   */
  RACE_DISTANCES_KM: {
    '5k': 5.0,
    '10k': 10.0,
    'half_marathon': 21.0975,
    'marathon': 42.195,
    'hyrox': 8.0,
  },
} as const;

// =============================================================================
// 8. HYBRID ATHLETE NUTRITION & ENERGY EXPENDITURE CONSTANTS
// Literature:
// - Morton, R. W., et al. (2018). Protein supplementation on resistance training. BJSM, 52(6), 376-384.
// - Burke, L. M., et al. (2011). Carbohydrates for training and competition. J Sports Sci, 29(sup1), S17-S27.
// - Sawka, M. N., et al. (2007). ACSM Position Stand: Exercise and Fluid Replacement. MSSE, 39(2), 377-390.
// =============================================================================

export const NUTRITION_CONSTANTS = {
  /**
   * Daily protein targets in grams per kilogram of total body weight
   */
  PROTEIN_G_PER_KG: {
    MAINTENANCE: 1.6,
    HYPERTROPHY_ENDURANCE: 2.0,
    HYPO_CALORIC_CUTTING: 2.2,
  },

  /**
   * Daily carbohydrate targets in grams per kilogram of body weight
   */
  CARBS_G_PER_KG: {
    REST_OR_LOW_VOLUME: 3.5,
    MODERATE_HYBRID: 5.0,
    HIGH_VOLUME_OR_LONG_RUN: 7.0,
  },

  /**
   * Dietary fat percentage range of total daily calorie expenditure
   */
  FAT_CALORIE_PERCENT: {
    MIN: 0.20,
    MAX: 0.35,
    DEFAULT: 0.25,
  },

  /**
   * Hydration recommendations
   * Baseline: 35 ml per kg of bodyweight
   * Exercise replenishment: 12 ml per minute of workout
   */
  BASELINE_WATER_ML_PER_KG: 35,
  EXERCISE_WATER_ML_PER_MINUTE: 12,
} as const;

// =============================================================================
// 9. DOUBLE PROGRESSION (RESISTANCE TRAINING) CONSTANTS
// Literature: Helms, E. R., et al. (2016). Application of Repetitions in Reserve. Sports, 4(1), 12.
// =============================================================================

export const DOUBLE_PROGRESSION_CONSTANTS = {
  UPPER_BODY_WEIGHT_INCREMENT_KG: 2.5,
  LOWER_BODY_WEIGHT_INCREMENT_KG: 5.0,
  MAX_TRIGGER_RPE: 8.0, // When all sets hit max rep cap at or below RPE 8.0, increase weight
} as const;

