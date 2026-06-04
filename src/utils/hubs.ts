import { locations } from '../config/routes_data.js';
import { hasAirport } from './airports.js';
import { Location, JourneyLeg, TravelMode } from './types.js';

// Station codes from train provider - cities that have a railway station
const stationCities = new Set([
  'Hyderabad','Delhi','Mumbai','Bangalore','Chennai','Kolkata','Pune','Ahmedabad',
  'Jaipur','Lucknow','Visakhapatnam','Vijayawada','Guntur','Tirupati','Nellore',
  'Kurnool','Rajahmundry','Kakinada','Anantapur','Kadapa','Eluru','Ongole',
  'Machilipatnam','Srikakulam','Warangal','Karimnagar','Nizamabad','Khammam',
  'Mahbubnagar','Nalgonda','Adilabad','Miryalaguda','Jagtial','Bhadrachalam',
  'Mysore','Hubli','Mangalore','Belgaum','Coimbatore','Madurai','Trichy','Salem',
  'Thiruvananthapuram','Kochi','Kozhikode','Thrissur','Nagpur','Nashik','Aurangabad',
  'Kolhapur','Surat','Vadodara','Rajkot','Jodhpur','Udaipur','Kota','Ajmer',
  'Varanasi','Agra','Kanpur','Prayagraj','Gorakhpur','Ayodhya','Bhopal','Indore',
  'Jabalpur','Gwalior','Patna','Gaya','Siliguri','Bhubaneswar','Puri','Cuttack',
  'Ranchi','Jamshedpur','Raipur','Bilaspur','Chandigarh','Amritsar','Ludhiana',
  'Dehradun','Haridwar','Rishikesh','Shimla','Jammu','Goa','Guwahati','Dibrugarh',
]);

function haversineKm(a: Location, b: Location): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function roadDistance(a: Location, b: Location): number {
  return Math.round(haversineKm(a, b) * 1.35);
}

export interface NearestHub {
  hub: Location;
  distanceKm: number;
  durationMins: number;   // estimated cab/bus time
  fare: number;           // estimated cab fare
}

/**
 * Find the nearest airport city for a given location.
 * Returns null if the location itself has an airport.
 */
export function findNearestAirport(loc: Location): NearestHub | null {
  if (hasAirport(loc.name)) return null;

  let best: NearestHub | null = null;

  for (const candidate of locations) {
    if (candidate.name === loc.name) continue;
    if (!hasAirport(candidate.name)) continue;

    const km = roadDistance(loc, candidate);
    if (km > 500) continue; // too far to be a reasonable connection

    if (!best || km < best.distanceKm) {
      best = {
        hub: candidate,
        distanceKm: km,
        durationMins: Math.round((km / 45) * 60), // avg 45 kmph by cab
        fare: Math.round(80 + km * 12),            // realistic cab fare
      };
    }
  }

  return best;
}

/**
 * Find the nearest railway station city for a given location.
 * Returns null if the location itself has a station.
 */
export function findNearestStation(loc: Location): NearestHub | null {
  if (stationCities.has(loc.name)) return null;

  let best: NearestHub | null = null;

  for (const candidate of locations) {
    if (candidate.name === loc.name) continue;
    if (!stationCities.has(candidate.name)) continue;

    const km = roadDistance(loc, candidate);
    if (km > 300) continue;

    if (!best || km < best.distanceKm) {
      best = {
        hub: candidate,
        distanceKm: km,
        durationMins: Math.round((km / 45) * 60),
        fare: Math.round(80 + km * 12),
      };
    }
  }

  return best;
}

/**
 * Build journey legs for an option.
 * Shows: origin → [connecting hub] → [main transport] → [connecting hub] → destination
 */
export function buildLegs(
  from: Location,
  to: Location,
  mode: TravelMode,
  mainFare: number,
  mainDuration: number,
  mainProvider?: string,
): JourneyLeg[] {
  const legs: JourneyLeg[] = [];

  // Check if origin needs a connection to reach a hub
  let actualFrom = from;
  let actualTo = to;

  if (mode === 'flight') {
    const fromHub = findNearestAirport(from);
    const toHub = findNearestAirport(to);

    if (fromHub) {
      legs.push({
        mode: 'cab',
        from: from.name,
        to: fromHub.hub.name,
        fare: fromHub.fare,
        duration: fromHub.durationMins,
        provider: 'Cab',
        label: `Cab to ${fromHub.hub.name} airport`,
      });
      actualFrom = fromHub.hub;
    }

    legs.push({
      mode: 'flight',
      from: actualFrom.name,
      to: actualTo.name,
      fare: mainFare - (fromHub?.fare ?? 0) - (toHub?.fare ?? 0),
      duration: mainDuration - (fromHub?.durationMins ?? 0) - (toHub?.durationMins ?? 0),
      provider: mainProvider,
      label: 'Flight',
    });

    if (toHub) {
      legs.push({
        mode: 'cab',
        from: toHub.hub.name,
        to: to.name,
        fare: toHub.fare,
        duration: toHub.durationMins,
        provider: 'Cab',
        label: `Cab from ${toHub.hub.name} airport`,
      });
      actualTo = toHub.hub;
    }
  } else if (mode === 'train') {
    const fromHub = findNearestStation(from);
    const toHub = findNearestStation(to);

    if (fromHub) {
      legs.push({
        mode: 'cab',
        from: from.name,
        to: fromHub.hub.name,
        fare: fromHub.fare,
        duration: fromHub.durationMins,
        provider: 'Cab',
        label: `Cab to ${fromHub.hub.name} station`,
      });
      actualFrom = fromHub.hub;
    }

    legs.push({
      mode: 'train',
      from: actualFrom.name,
      to: actualTo.name,
      fare: mainFare - (fromHub?.fare ?? 0) - (toHub?.fare ?? 0),
      duration: mainDuration - (fromHub?.durationMins ?? 0) - (toHub?.durationMins ?? 0),
      provider: mainProvider,
      label: 'Train',
    });

    if (toHub) {
      legs.push({
        mode: 'cab',
        from: toHub.hub.name,
        to: to.name,
        fare: toHub.fare,
        duration: toHub.durationMins,
        provider: 'Cab',
        label: `Cab from ${toHub.hub.name} station`,
      });
    }
  } else {
    // Direct modes: bus, cab, bike, auto — single leg
    legs.push({
      mode,
      from: from.name,
      to: to.name,
      fare: mainFare,
      duration: mainDuration,
      provider: mainProvider,
      label: mode.charAt(0).toUpperCase() + mode.slice(1),
    });
  }

  return legs;
}
