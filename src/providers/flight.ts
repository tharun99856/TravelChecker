import { TravelProvider } from './provider.interface.js';
import { TravelMode, TravelOption, Location } from '../utils/types.js';
import { getComfortScore } from '../config/comfort_index.js';
import { getIataCode } from '../utils/airports.js';
import { createHash } from 'crypto';

type TravelpayoutsConfig = {
  token: string;
  marker: string;
  host: string;
  locale: string;
  currency: string;
};

function getTravelpayoutsConfig(): TravelpayoutsConfig | null {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  const marker = process.env.TRAVELPAYOUTS_MARKER;
  if (!token || !marker) return null;

  return {
    token,
    marker,
    host: process.env.TRAVELPAYOUTS_HOST ?? 'travelwithus.local',
    locale: process.env.TRAVELPAYOUTS_LOCALE ?? 'en-us',
    currency: process.env.TRAVELPAYOUTS_CURRENCY ?? 'inr',
  };
}

function isLocalIp(ip?: string): boolean {
  if (!ip) return true;
  return ip === '::1' || ip === 'localhost' || ip.startsWith('127.');
}

function collectSignatureValues(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.flatMap(item => collectSignatureValues(item));

  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .filter(key => key !== 'signature' && key !== 'marker')
      .sort()
      .flatMap(key => collectSignatureValues((value as Record<string, unknown>)[key]));
  }

  return [String(value)];
}

function signTravelpayoutsPayload(payload: Record<string, unknown>, config: TravelpayoutsConfig): string {
  const raw = [config.token, config.marker, ...collectSignatureValues(payload)].join(':');
  return createHash('md5').update(raw).digest('hex');
}

function firstFlight(proposal: any) {
  return proposal?.segment?.[0]?.flight?.[0] ?? null;
}

function getBestTerm(proposal: any) {
  const entries = Object.entries(proposal?.terms ?? {})
    .map(([gateId, term]: [string, any]) => ({ gateId, term }))
    .filter(entry => Number.isFinite(Number(entry.term?.price)));

  return entries.sort((a, b) => Number(a.term.price) - Number(b.term.price))[0] ?? null;
}

function mapTravelpayoutsResults(
  results: any[],
  searchId: string,
  distanceKm: number,
  airportBufferMins: number,
): TravelOption[] {
  const options: TravelOption[] = [];

  for (const result of results) {
    const proposals = Array.isArray(result?.proposals) ? result.proposals : [];
    const airlines = result?.airlines ?? {};
    const gates = result?.gates_info ?? {};

    for (const proposal of proposals) {
      const bestTerm = getBestTerm(proposal);
      const flight = firstFlight(proposal);
      if (!bestTerm || !flight) continue;

      const carrier = proposal.validating_carrier ?? flight.marketing_carrier ?? flight.operating_carrier ?? 'Airline';
      const airlineName = airlines[carrier]?.name ?? carrier;
      const gateName = gates[bestTerm.gateId]?.label ?? 'Travelpayouts partner';
      const duration = Number(proposal.total_duration ?? proposal.segment_durations?.[0] ?? flight.duration ?? 90);
      const flightNumber = `${flight.operating_carrier ?? carrier}${flight.number ?? ''}`;

      options.push({
        mode: 'flight',
        subMode: 'flight_economy',
        provider: airlineName,
        name: `${airlineName} Economy`,
        fare: Math.round(Number(bestTerm.term.price)),
        duration: Math.round(duration + airportBufferMins),
        distance: distanceKm,
        departureTime: flight.departure_date && flight.departure_time
          ? `${flight.departure_date}T${flight.departure_time}`
          : undefined,
        arrivalTime: flight.arrival_date && flight.arrival_time
          ? `${flight.arrival_date}T${flight.arrival_time}`
          : undefined,
        comfortScore: getComfortScore('flight_economy'),
        confidence: 'high',
        details: {
          source: 'Travelpayouts',
          currency: bestTerm.term.currency?.toUpperCase() ?? 'INR',
          bookingProvider: gateName,
          searchId,
          clickRef: bestTerm.term.url,
          stops: Number(proposal.max_stops ?? 0),
          airline: carrier,
          flightNo: flightNumber,
          userInitiatedSearch: true,
          requiresClickToBook: true,
        },
      });
    }
  }

  return options.sort((a, b) => a.fare - b.fare);
}

async function searchTravelpayoutsFlights(
  fromIata: string,
  toIata: string,
  date: string,
  distanceKm: number,
  airportBufferMins: number,
  userIp?: string,
): Promise<TravelOption[] | null> {
  const config = getTravelpayoutsConfig();
  if (!config) return null;

  if (isLocalIp(userIp)) {
    console.warn('[FlightProvider] Travelpayouts skipped: real user IP is required; localhost IPs are not allowed.');
    return null;
  }

  const payload: Record<string, unknown> = {
    marker: config.marker,
    host: config.host,
    user_ip: userIp,
    locale: config.locale,
    trip_class: 'Y',
    currency: config.currency,
    know_english: true,
    passengers: {
      adults: 1,
      children: 0,
      infants: 0,
    },
    segments: [{ origin: fromIata, destination: toIata, date }],
  };

  payload.signature = signTravelpayoutsPayload(payload, config);

  const initResponse = await fetch('https://api.travelpayouts.com/v1/flight_search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!initResponse.ok) {
    throw new Error(`Travelpayouts search failed with HTTP ${initResponse.status}`);
  }

  const initData = await initResponse.json() as any;
  const searchId = initData.search_id ?? initData.meta?.uuid;
  if (!searchId) {
    throw new Error('Travelpayouts search response did not include search_id');
  }

  for (let attempt = 0; attempt < 4; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 1200));

    const resultsResponse = await fetch(`https://api.travelpayouts.com/v1/flight_search_results?uuid=${encodeURIComponent(searchId)}`, {
      headers: { 'Accept-Encoding': 'gzip,deflate,br' },
    });

    if (!resultsResponse.ok) {
      throw new Error(`Travelpayouts results failed with HTTP ${resultsResponse.status}`);
    }

    const results = await resultsResponse.json() as any[];
    const hasOnlySearchMarker = Array.isArray(results) && results.length === 1 && results[0]?.search_id === searchId && !results[0]?.proposals;
    if (!Array.isArray(results) || hasOnlySearchMarker) continue;

    const options = mapTravelpayoutsResults(results, searchId, distanceKm, airportBufferMins);
    if (options.length > 0) return options;
  }

  return [];
}

export async function getTravelpayoutsBookingLink(searchId: string, clickRef: string) {
  const response = await fetch(
    `https://api.travelpayouts.com/v1/flight_searches/${encodeURIComponent(searchId)}/clicks/${encodeURIComponent(clickRef)}.json`,
    { headers: { 'Accept-Encoding': 'gzip,deflate,br' } },
  );

  if (!response.ok) {
    throw new Error(`Travelpayouts booking link failed with HTTP ${response.status}`);
  }

  const data = await response.json() as { url?: string };
  if (!data.url) {
    throw new Error('Travelpayouts did not return a booking URL');
  }

  return { url: data.url };
}

// ── Airport buffer calculation ────────────────────────────────────────────────
// Metro airports (Tier 1): Higher security, longer transit times
// Regional airports (Tier 2): Faster processing, shorter distances
function getAirportBuffer(fromIata: string | null, toIata: string | null): number {
  const metroAirports = ['DEL', 'BOM', 'BLR', 'MAA', 'CCU', 'HYD'];
  const tier2Airports = ['VTZ', 'VGA', 'TIR', 'RJA', 'CDP', 'KJB'];

  const fromIsMajor = fromIata && metroAirports.includes(fromIata);
  const toIsMajor = toIata && metroAirports.includes(toIata);

  // Both major metros: 135 mins (90 check-in + 45 transit each end)
  if (fromIsMajor && toIsMajor) return 135;

  // One major, one regional: 110 mins
  if (fromIsMajor || toIsMajor) return 110;

  // Both regional: 85 mins (smaller airports are faster)
  return 85;
}

// ── FlightProvider ────────────────────────────────────────────────────────────
export class FlightProvider implements TravelProvider {
  mode: TravelMode = 'flight';
  name = 'Travelpayouts';

  async getOptions(
    from: Location,
    to: Location,
    date: string,
    distanceKm: number,
    context?: { userIp?: string },
  ): Promise<TravelOption[]> {
    if (
      distanceKm < 400 ||
      from.populationTier === 'small_town' ||
      to.populationTier === 'small_town'
    ) {
      return [];
    }

    const fromIata = getIataCode(from.name);
    const toIata   = getIataCode(to.name);
    const airportBufferMins = getAirportBuffer(fromIata, toIata);

    if (fromIata && toIata && getTravelpayoutsConfig()) {
      try {
        const liveOptions = await searchTravelpayoutsFlights(
          fromIata,
          toIata,
          date,
          distanceKm,
          airportBufferMins,
          context?.userIp,
        );

        if (liveOptions && liveOptions.length > 0) {
          return liveOptions;
        }
      } catch (err: any) {
        console.error(
          `[FlightProvider] Travelpayouts API failed for ${from.name}->${to.name}. ` +
          `Falling back to modeled flight data. Error: ${err?.message ?? err}`,
        );
      }
    }

    // ── Graceful Fallback: Realistic Mock ─────────────────────────────────────
    // Fares modelled on publicly observable IndiGo / Air India pricing bands.
    const flightTimeMins    = 60 + Math.round(distanceKm * 0.06);   // ~60 min base + 3.6 min/100 km
    const totalDurationMins = flightTimeMins + airportBufferMins;

    const options: TravelOption[] = [];

    // Economy – always available
    const economyFare = Math.round(2500 + distanceKm * 2.2);
    options.push({
      mode:         'flight',
      subMode:      'flight_economy',
      provider:     'IndiGo',
      name:         'Economy Class',
      fare:         economyFare,
      fareMin:      Math.round(economyFare * 0.85), // ±15% for date/availability variance
      fareMax:      Math.round(economyFare * 1.15),
      duration:     totalDurationMins,
      distance:     distanceKm,
      comfortScore: getComfortScore('flight_economy'),
      confidence:   'medium', // Model-based estimate
      details:      { source: 'mock' },
    });

    // Business – only between metro cities
    if (from.populationTier === 'metro' && to.populationTier === 'metro') {
      const businessFare = Math.round(9000 + distanceKm * 5.5);
      options.push({
        mode:         'flight',
        subMode:      'flight_business',
        provider:     'Air India',
        name:         'Business Class',
        fare:         businessFare,
        fareMin:      Math.round(businessFare * 0.85),
        fareMax:      Math.round(businessFare * 1.15),
        duration:     totalDurationMins,
        distance:     distanceKm,
        comfortScore: getComfortScore('flight_business'),
        confidence:   'medium',
        details:      { source: 'mock' },
      });
    }

    return options;
  }
}
