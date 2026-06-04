// Travel modes
export type TravelMode = 'flight' | 'train' | 'bus' | 'cab' | 'auto' | 'bike';

// Sub-modes (e.g., "ola_mini", "train_2ac", "bus_ac_sleeper")
export type SubMode = string;

// A single leg within a journey (e.g., cab to airport, then flight)
export interface JourneyLeg {
  mode: TravelMode;
  from: string;
  to: string;
  fare: number;
  duration: number;         // minutes
  provider?: string;
  label?: string;           // e.g. "Cab to airport"
}

// A single travel option returned by a provider
export interface TravelOption {
  mode: TravelMode;
  subMode: SubMode;
  provider: string;         // "IndiGo", "IRCTC", "RedBus", "Ola", etc.
  name: string;             // "Shatabdi Express", "Ola Mini", etc.
  fare: number;             // in INR (midpoint estimate)
  fareMin?: number;         // Lower bound estimate (for uncertain pricing)
  fareMax?: number;         // Upper bound estimate (for uncertain pricing)
  duration: number;         // in minutes
  distance: number;         // in km
  departureTime?: string;   // ISO time
  arrivalTime?: string;
  comfortScore: number;     // 0-100 from comfort index
  confidence?: 'high' | 'medium' | 'low'; // Data source confidence
  legs?: JourneyLeg[];      // Multi-leg journey breakdown
  details?: Record<string, any>;
}

// Scored option after applying weights
export interface ScoredOption extends TravelOption {
  priceScore: number;       // 0-100
  timeScore: number;        // 0-100
  compositeScore: number;   // 0-100 weighted
}

// User preference weights
export interface Weights {
  price: number;   // 0-1
  time: number;    // 0-1
  comfort: number; // 0-1
}

// City/town location
export interface Location {
  name: string;
  state: string;
  district?: string;
  lat: number;
  lng: number;
  populationTier: 'metro' | 'city' | 'town' | 'small_town';
}
