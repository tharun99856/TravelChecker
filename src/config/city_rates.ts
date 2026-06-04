/**
 * Ride-hailing rates by city (2026 pricing intelligence)
 * 
 * Sourced from publicly observable pricing in Ola/Uber/Rapido apps as of June 2026.
 * Rates are area-dependent — metro cities have higher base fares than tier-2 cities.
 * 
 * Pricing model: base + (distance × perKm) + (time × perMin)
 * 
 * NOTE: These are BASE rates. The cab provider applies surge multipliers dynamically.
 */

interface CityRate {
  base:   number; // Base fare in INR
  perKm:  number; // Per-kilometer rate in INR
  perMin: number; // Per-minute rate in INR
}

interface CityConfig {
  [cityName: string]: {
    ola_mini:    CityRate;
    ola_auto:    CityRate;
    uber_go:     CityRate;
    rapido_bike: CityRate;
  };
}

export const cityRates: CityConfig = {
  // ── Metro Cities (Tier 1) ──────────────────────────────────────────────────
  "Delhi": {
    ola_mini:    { base: 50,  perKm: 13,   perMin: 1.5  },
    ola_auto:    { base: 30,  perKm: 9,    perMin: 1.2  },
    uber_go:     { base: 50,  perKm: 14,   perMin: 1.6  },
    rapido_bike: { base: 20,  perKm: 4.5,  perMin: 0.6  },
  },

  "Mumbai": {
    ola_mini:    { base: 60,  perKm: 15,   perMin: 1.8  }, // Highest rates in India
    ola_auto:    { base: 35,  perKm: 10,   perMin: 1.3  },
    uber_go:     { base: 60,  perKm: 16,   perMin: 1.8  },
    rapido_bike: { base: 25,  perKm: 5.5,  perMin: 0.7  },
  },

  "Bangalore": {
    ola_mini:    { base: 50,  perKm: 14,   perMin: 1.6  },
    ola_auto:    { base: 30,  perKm: 8,    perMin: 1.0  },
    uber_go:     { base: 50,  perKm: 15,   perMin: 1.6  },
    rapido_bike: { base: 18,  perKm: 4.2,  perMin: 0.5  },
  },

  "Hyderabad": {
    ola_mini:    { base: 45,  perKm: 12,   perMin: 1.4  },
    ola_auto:    { base: 25,  perKm: 7,    perMin: 1.0  },
    uber_go:     { base: 45,  perKm: 13,   perMin: 1.5  },
    rapido_bike: { base: 18,  perKm: 4,    perMin: 0.5  },
  },

  "Chennai": {
    ola_mini:    { base: 48,  perKm: 13,   perMin: 1.5  },
    ola_auto:    { base: 28,  perKm: 8,    perMin: 1.1  },
    uber_go:     { base: 48,  perKm: 14,   perMin: 1.5  },
    rapido_bike: { base: 18,  perKm: 4.2,  perMin: 0.5  },
  },

  "Kolkata": {
    ola_mini:    { base: 45,  perKm: 12,   perMin: 1.3  },
    ola_auto:    { base: 25,  perKm: 7,    perMin: 1.0  },
    uber_go:     { base: 45,  perKm: 13,   perMin: 1.4  },
    rapido_bike: { base: 16,  perKm: 3.8,  perMin: 0.5  },
  },

  "Pune": {
    ola_mini:    { base: 42,  perKm: 11,   perMin: 1.3  },
    ola_auto:    { base: 22,  perKm: 7,    perMin: 0.9  },
    uber_go:     { base: 42,  perKm: 12,   perMin: 1.4  },
    rapido_bike: { base: 16,  perKm: 3.8,  perMin: 0.5  },
  },

  "Ahmedabad": {
    ola_mini:    { base: 40,  perKm: 10,   perMin: 1.2  },
    ola_auto:    { base: 20,  perKm: 6.5,  perMin: 0.9  },
    uber_go:     { base: 40,  perKm: 11,   perMin: 1.3  },
    rapido_bike: { base: 15,  perKm: 3.5,  perMin: 0.4  },
  },

  "Jaipur": {
    ola_mini:    { base: 38,  perKm: 10,   perMin: 1.2  },
    ola_auto:    { base: 20,  perKm: 6,    perMin: 0.8  },
    uber_go:     { base: 38,  perKm: 11,   perMin: 1.3  },
    rapido_bike: { base: 15,  perKm: 3.5,  perMin: 0.4  },
  },

  // ── Tier 2 Cities (Andhra Pradesh & Telangana) ─────────────────────────────
  "Visakhapatnam": {
    ola_mini:    { base: 38,  perKm: 11,   perMin: 1.2  },
    ola_auto:    { base: 22,  perKm: 6.5,  perMin: 0.9  },
    uber_go:     { base: 38,  perKm: 12,   perMin: 1.3  },
    rapido_bike: { base: 14,  perKm: 3.6,  perMin: 0.5  },
  },

  "Vijayawada": {
    ola_mini:    { base: 36,  perKm: 10,   perMin: 1.2  },
    ola_auto:    { base: 20,  perKm: 6,    perMin: 0.8  },
    uber_go:     { base: 36,  perKm: 11,   perMin: 1.2  },
    rapido_bike: { base: 14,  perKm: 3.5,  perMin: 0.4  },
  },

  "Warangal": {
    ola_mini:    { base: 35,  perKm: 10,   perMin: 1.1  },
    ola_auto:    { base: 20,  perKm: 6,    perMin: 0.8  },
    uber_go:     { base: 35,  perKm: 10.5, perMin: 1.2  },
    rapido_bike: { base: 12,  perKm: 3.2,  perMin: 0.4  },
  },

  "Guntur": {
    ola_mini:    { base: 35,  perKm: 10,   perMin: 1.1  },
    ola_auto:    { base: 18,  perKm: 6,    perMin: 0.8  },
    uber_go:     { base: 35,  perKm: 10.5, perMin: 1.2  },
    rapido_bike: { base: 12,  perKm: 3.2,  perMin: 0.4  },
  },

  "Tirupati": {
    ola_mini:    { base: 36,  perKm: 10,   perMin: 1.1  },
    ola_auto:    { base: 20,  perKm: 6,    perMin: 0.8  },
    uber_go:     { base: 36,  perKm: 10.5, perMin: 1.2  },
    rapido_bike: { base: 13,  perKm: 3.3,  perMin: 0.4  },
  },

  "Nellore": {
    ola_mini:    { base: 34,  perKm: 9.5,  perMin: 1.1  },
    ola_auto:    { base: 18,  perKm: 5.8,  perMin: 0.8  },
    uber_go:     { base: 34,  perKm: 10,   perMin: 1.1  },
    rapido_bike: { base: 12,  perKm: 3.2,  perMin: 0.4  },
  },

  "Kurnool": {
    ola_mini:    { base: 33,  perKm: 9.5,  perMin: 1.1  },
    ola_auto:    { base: 18,  perKm: 5.8,  perMin: 0.7  },
    uber_go:     { base: 33,  perKm: 10,   perMin: 1.1  },
    rapido_bike: { base: 12,  perKm: 3.2,  perMin: 0.4  },
  },

  "Rajahmundry": {
    ola_mini:    { base: 34,  perKm: 9.5,  perMin: 1.1  },
    ola_auto:    { base: 18,  perKm: 6,    perMin: 0.8  },
    uber_go:     { base: 34,  perKm: 10,   perMin: 1.1  },
    rapido_bike: { base: 12,  perKm: 3.2,  perMin: 0.4  },
  },

  "Kakinada": {
    ola_mini:    { base: 33,  perKm: 9.5,  perMin: 1.1  },
    ola_auto:    { base: 18,  perKm: 5.8,  perMin: 0.7  },
    uber_go:     { base: 33,  perKm: 10,   perMin: 1.1  },
    rapido_bike: { base: 12,  perKm: 3.2,  perMin: 0.4  },
  },

  "Anantapur": {
    ola_mini:    { base: 32,  perKm: 9,    perMin: 1.0  },
    ola_auto:    { base: 18,  perKm: 5.5,  perMin: 0.7  },
    uber_go:     { base: 32,  perKm: 9.5,  perMin: 1.1  },
    rapido_bike: { base: 12,  perKm: 3,    perMin: 0.4  },
  },

  "Kadapa": {
    ola_mini:    { base: 32,  perKm: 9,    perMin: 1.0  },
    ola_auto:    { base: 18,  perKm: 5.5,  perMin: 0.7  },
    uber_go:     { base: 32,  perKm: 9.5,  perMin: 1.1  },
    rapido_bike: { base: 11,  perKm: 3,    perMin: 0.4  },
  },

  // ── Default (Tier 3 / Small Towns) ────────────────────────────────────────
  "default": {
    ola_mini:    { base: 30,  perKm: 9,    perMin: 1.0  },
    ola_auto:    { base: 18,  perKm: 5.5,  perMin: 0.7  },
    uber_go:     { base: 30,  perKm: 9.5,  perMin: 1.1  },
    rapido_bike: { base: 11,  perKm: 3,    perMin: 0.4  },
  },
};

/**
 * Returns the rate config for a given city name.
 * Falls back to 'default' rates if city is not in the map.
 */
export function getCityRates(cityName: string) {
  return cityRates[cityName] || cityRates['default'];
}
