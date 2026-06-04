/**
 * Comfort scores (0-100 scale) for different travel sub-modes.
 * Used in the scoring algorithm to compare options fairly.
 * 
 * Based on real-world passenger comfort factors:
 * - Space, seating, AC, ride quality, privacy, luggage capacity
 */
export const comfortIndex: Record<string, number> = {
  // ── Flights ─────────────────────────────────────────────────────────────────
  "flight_business": 100,
  "flight_economy":  75,

  // ── Trains ──────────────────────────────────────────────────────────────────
  "train_1ac":       90,
  "train_2ac":       80,
  "train_3ac":       70,
  "train_sleeper":   45,

  // ── Cabs (4-wheelers) ───────────────────────────────────────────────────────
  "cab_sedan":       65,  // Ola Prime, Uber Premier
  "ola_mini":        55,  // Hatchback, AC, private
  "uber_go":         55,  // Equivalent to ola_mini

  // ── Buses ───────────────────────────────────────────────────────────────────
  "bus_ac_sleeper":  55,  // Volvo AC Sleeper (2+1)
  "bus_ac_seater":   40,  // Standard AC bus
  "bus_non_ac":      25,  // State RTC Non-AC

  // ── Auto-rickshaws ──────────────────────────────────────────────────────────
  "auto":            20,  // 3-wheeler, open-air
  "ola_auto":        20,

  // ── Bikes ───────────────────────────────────────────────────────────────────
  "bike":            10,  // Pillion ride, weather-exposed
  "rapido_bike":     10,

  // ── Personal Vehicles ───────────────────────────────────────────────────────
  "personal_bike":        35,  // Own bike, solo ride, no passenger discomfort
  "personal_car":         70,  // Own car, full control, familiar vehicle
  "personal_car_petrol":  70,
  "personal_car_diesel":  70,
};

/**
 * Returns the comfort score for a given sub-mode.
 * Defaults to 50 if the sub-mode is not in the index.
 */
export function getComfortScore(subMode: string): number {
  return comfortIndex[subMode] ?? 50;
}

