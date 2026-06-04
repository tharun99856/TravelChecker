/**
 * Fuel prices by city (2026 pricing intelligence)
 * 
 * Sourced from public fuel price data as of June 2026.
 * Petrol and diesel prices vary by state due to taxes and VAT.
 * 
 * NOTE: These are base retail prices per liter in INR.
 */

interface FuelPrice {
  petrol: number; // INR per liter
  diesel: number; // INR per liter
}

interface FuelPriceConfig {
  [cityName: string]: FuelPrice;
}

export const fuelPrices: FuelPriceConfig = {
  // ── Metro Cities & States ──────────────────────────────────────────────────
  
  // Delhi NCR
  "Delhi": { petrol: 96.72, diesel: 89.62 },
  
  // Maharashtra
  "Mumbai": { petrol: 106.31, diesel: 94.27 },
  "Pune": { petrol: 106.31, diesel: 94.27 },
  
  // Karnataka
  "Bangalore": { petrol: 102.86, diesel: 88.94 },
  
  // Telangana
  "Hyderabad": { petrol: 108.20, diesel: 96.82 },
  "Warangal": { petrol: 108.20, diesel: 96.82 },
  
  // Andhra Pradesh (highest fuel prices in India)
  "Visakhapatnam": { petrol: 112.45, diesel: 102.80 },
  "Vijayawada": { petrol: 112.45, diesel: 102.80 },
  "Guntur": { petrol: 112.45, diesel: 102.80 },
  "Tirupati": { petrol: 112.45, diesel: 102.80 },
  "Nellore": { petrol: 112.45, diesel: 102.80 },
  "Kurnool": { petrol: 112.45, diesel: 102.80 },
  "Rajahmundry": { petrol: 112.45, diesel: 102.80 },
  "Kakinada": { petrol: 112.45, diesel: 102.80 },
  "Anantapur": { petrol: 112.45, diesel: 102.80 },
  "Kadapa": { petrol: 112.45, diesel: 102.80 },
  
  // Tamil Nadu
  "Chennai": { petrol: 102.63, diesel: 94.24 },
  
  // West Bengal
  "Kolkata": { petrol: 104.95, diesel: 92.76 },
  
  // Rajasthan
  "Jaipur": { petrol: 103.43, diesel: 92.38 },
  
  // Gujarat
  "Ahmedabad": { petrol: 96.42, diesel: 91.23 },
  
  // ── Default (National Average) ─────────────────────────────────────────────
  "default": { petrol: 105.00, diesel: 95.00 },
};

/**
 * Returns the fuel price for a given city name.
 * Falls back to 'default' (national average) if city is not in the map.
 */
export function getFuelPrice(cityName: string): FuelPrice {
  return fuelPrices[cityName] || fuelPrices['default'];
}
