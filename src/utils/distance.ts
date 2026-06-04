import { Client } from '@googlemaps/google-maps-services-js';
import { locations } from '../config/routes_data.js';
import { cache } from './cache.js';

const mapsClient = new Client({});

const MINUTE_LIMIT = Number(process.env.GOOGLE_MAPS_REQUESTS_PER_MINUTE ?? 30);
const DAILY_LIMIT = Number(process.env.GOOGLE_MAPS_REQUESTS_PER_DAY ?? 500);
const MINUTE_WINDOW_MS = 60 * 1000;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

const rateLimiter = {
  minuteCount: 0,
  dailyCount: 0,
  minuteResetAt: Date.now() + MINUTE_WINDOW_MS,
  dailyResetAt: Date.now() + DAILY_WINDOW_MS,

  refresh(now = Date.now()) {
    if (now >= this.minuteResetAt) {
      this.minuteCount = 0;
      this.minuteResetAt = now + MINUTE_WINDOW_MS;
    }

    if (now >= this.dailyResetAt) {
      this.dailyCount = 0;
      this.dailyResetAt = now + DAILY_WINDOW_MS;
    }
  },

  canUseApi() {
    this.refresh();
    return this.minuteCount < MINUTE_LIMIT && this.dailyCount < DAILY_LIMIT;
  },

  recordApiUse() {
    this.refresh();
    this.minuteCount += 1;
    this.dailyCount += 1;
  },

  status() {
    this.refresh();
    return {
      googleMaps: {
        perMinute: {
          used: this.minuteCount,
          limit: MINUTE_LIMIT,
          remaining: Math.max(0, MINUTE_LIMIT - this.minuteCount),
          resetAt: new Date(this.minuteResetAt).toISOString(),
        },
        perDay: {
          used: this.dailyCount,
          limit: DAILY_LIMIT,
          remaining: Math.max(0, DAILY_LIMIT - this.dailyCount),
          resetAt: new Date(this.dailyResetAt).toISOString(),
        },
      },
    };
  },
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const fromLat = (lat1 * Math.PI) / 180;
  const toLat = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface DistanceResult {
  distanceKm: number;
  durationMins: number;
  source: 'cache' | 'google_maps' | 'haversine_fallback';
}

/**
 * Returns road distance and travel time for two supported Indian locations.
 *
 * Resolution order:
 * 1. SQLite cache of prior Google Maps results.
 * 2. Google Maps Distance Matrix API.
 * 3. Haversine estimate if the API key is missing, rate-limited, or fails.
 */
export async function getDistance(from: string, to: string): Promise<DistanceResult> {
  const cached = cache.getDistance(from, to);
  if (cached) {
    return { ...cached, source: 'cache' };
  }

  if (process.env.GOOGLE_MAPS_API_KEY) {
    if (!rateLimiter.canUseApi()) {
      console.warn(
        `[RateLimit] Google Maps cap reached for ${from}->${to}. ` +
        `Status: ${JSON.stringify(rateLimiter.status().googleMaps)}`
      );
    } else {
      try {
        rateLimiter.recordApiUse();

        const response = await mapsClient.distancematrix({
          params: {
            origins: [`${from}, India`],
            destinations: [`${to}, India`],
            key: process.env.GOOGLE_MAPS_API_KEY,
          },
          timeout: 6000,
        });

        const element = response.data.rows[0]?.elements[0];
        if (element?.status === 'OK') {
          const distanceKm = Math.round(element.distance.value / 1000);
          const durationMins = Math.round(element.duration.value / 60);

          cache.setDistance(from, to, distanceKm, durationMins, 'google_maps');
          console.log(`[Distance] Google Maps: ${from}->${to} = ${distanceKm} km, ${durationMins} min`);

          return { distanceKm, durationMins, source: 'google_maps' };
        }

        console.warn(`[Distance] Google Maps returned ${element?.status ?? 'UNKNOWN'} for ${from}->${to}.`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Distance] Google Maps failed for ${from}->${to}: ${message}`);
      }
    }
  } else {
    console.warn('[Distance] GOOGLE_MAPS_API_KEY is not set. Using Haversine fallback.');
  }

  const locFrom = getLocation(from);
  const locTo = getLocation(to);

  if (locFrom && locTo) {
    const straightLineKm = haversineKm(locFrom.lat, locFrom.lng, locTo.lat, locTo.lng);
    const distanceKm = Math.round(straightLineKm * 1.35);
    const durationMins = Math.round((distanceKm / 50) * 60);

    console.warn(`[Distance] Haversine fallback for ${from}->${to}: ~${distanceKm} km.`);
    return { distanceKm, durationMins, source: 'haversine_fallback' };
  }

  console.warn(`[Distance] Unknown locations for ${from}->${to}. Returning default fallback distance.`);
  return { distanceKm: 500, durationMins: 540, source: 'haversine_fallback' };
}

export function getLocation(name: string) {
  return locations.find(location => location.name.toLowerCase() === name.toLowerCase()) ?? null;
}

export function getRateLimitStatus() {
  return rateLimiter.status();
}
