import axios from 'axios';
import { TravelProvider } from './provider.interface.js';
import { TravelMode, TravelOption, Location } from '../utils/types.js';
import { getComfortScore } from '../config/comfort_index.js';

// ── Station code lookup ───────────────────────────────────────────────────────
// Maps city names to their primary IRCTC station codes.
const stationCodes: Record<string, string> = {
  // Metros
  'Hyderabad':          'HYB',
  'Delhi':              'NDLS',
  'Mumbai':             'CSTM',
  'Bangalore':          'SBC',
  'Chennai':            'MAS',
  'Kolkata':            'HWH',
  'Pune':               'PUNE',
  'Ahmedabad':          'ADI',
  'Jaipur':             'JP',
  'Lucknow':            'LKO',

  // Andhra Pradesh
  'Visakhapatnam':      'VSKP',
  'Vijayawada':         'BZA',
  'Guntur':             'GNT',
  'Tirupati':           'TPTY',
  'Nellore':            'NLR',
  'Kurnool':            'KRNT',
  'Rajahmundry':        'RJY',
  'Kakinada':           'CCT',
  'Anantapur':          'ATP',
  'Kadapa':             'HX',
  'Eluru':              'EE',
  'Ongole':             'OGL',
  'Machilipatnam':      'MTM',
  'Srikakulam':         'CHE',

  // Telangana
  'Warangal':           'WL',
  'Karimnagar':         'KMC',
  'Nizamabad':          'NZB',
  'Khammam':            'KMT',
  'Mahbubnagar':        'MBD',
  'Nalgonda':           'NLDA',
  'Adilabad':           'ADB',
  'Miryalaguda':        'MGA',
  'Jagtial':            'JGLL',
  'Bhadrachalam':       'BDCR',

  // Karnataka
  'Mysore':             'MYS',
  'Hubli':              'UBL',
  'Mangalore':          'MAJN',
  'Belgaum':            'BGM',

  // Tamil Nadu
  'Coimbatore':         'CBE',
  'Madurai':            'MDU',
  'Trichy':             'TPJ',
  'Salem':              'SA',

  // Kerala
  'Thiruvananthapuram': 'TVC',
  'Kochi':              'ERS',
  'Kozhikode':          'CLT',
  'Thrissur':           'TCR',

  // Maharashtra
  'Nagpur':             'NGP',
  'Nashik':             'NK',
  'Aurangabad':         'AWB',
  'Kolhapur':           'KOP',

  // Gujarat
  'Surat':              'ST',
  'Vadodara':           'BRC',
  'Rajkot':             'RJT',

  // Rajasthan
  'Jodhpur':            'JU',
  'Udaipur':            'UDZ',
  'Kota':               'KOTA',
  'Ajmer':              'AII',

  // UP
  'Varanasi':           'BSB',
  'Agra':               'AGC',
  'Kanpur':             'CNB',
  'Prayagraj':          'PRYJ',
  'Gorakhpur':          'GKP',
  'Ayodhya':            'AY',

  // MP
  'Bhopal':             'BPL',
  'Indore':             'INDB',
  'Jabalpur':           'JBP',
  'Gwalior':            'GWL',

  // Bihar
  'Patna':              'PNBE',
  'Gaya':               'GAYA',

  // West Bengal
  'Siliguri':           'SGUJ',

  // Odisha
  'Bhubaneswar':        'BBS',
  'Puri':               'PURI',
  'Cuttack':            'CTC',

  // Jharkhand
  'Ranchi':             'RNC',
  'Jamshedpur':         'TATA',

  // Chhattisgarh
  'Raipur':             'R',
  'Bilaspur':           'BSP',

  // Punjab
  'Chandigarh':         'CDG',
  'Amritsar':           'ASR',
  'Ludhiana':           'LDH',

  // Uttarakhand
  'Dehradun':           'DDN',
  'Haridwar':           'HW',
  'Rishikesh':          'RKSH',

  // HP
  'Shimla':             'SML',

  // J&K
  'Jammu':              'JAT',

  // Goa
  'Goa':                'MAO',

  // Northeast
  'Guwahati':           'GHY',
  'Dibrugarh':          'DBRG',
};

function getStationCode(cityName: string): string | null {
  return stationCodes[cityName] ?? null;
}

// ── Duration parser ───────────────────────────────────────────────────────────
// Converts "16:30" or "16h 30m" style strings to total minutes.
function parseDurationToMins(raw: string): number {
  const colonMatch = raw.match(/^(\d+):(\d{2})$/);
  if (colonMatch) return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);

  const hMatch = raw.match(/(\d+)\s*h/i);
  const mMatch = raw.match(/(\d+)\s*m/i);
  return (hMatch ? parseInt(hMatch[1], 10) * 60 : 0) + (mMatch ? parseInt(mMatch[1], 10) : 0);
}

// ── IRCTC RapidAPI integration ────────────────────────────────────────────────
// Uses the "IRCTC19" API on RapidAPI.  Free tier: 100 req/day.
// Docs: https://rapidapi.com/IRCTC/api/irctc19
const RAPIDAPI_HOST = 'irctc19.p.rapidapi.com';
const API_TIMEOUT   = 8_000; // ms – fall back to mock if slow

interface RapidTrain {
  train_name?:   string;
  train_number?: string;
  duration?:     string;
  from_sta?:     string;   // scheduled departure HH:MM
  to_sta?:       string;   // scheduled arrival  HH:MM
  class_type?:   string[]; // e.g. ["SL","3A","2A","1A"]
  fare?:         Record<string, number>; // { SL: 350, "3A": 900, ... }
}

async function fetchLiveTrains(
  fromCode: string,
  toCode:   string,
  date:     string,
): Promise<RapidTrain[]> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return [];

  // date must be in DD-MM-YYYY for this API
  const [yyyy, mm, dd] = date.split('-');
  const apiDate = `${dd}-${mm}-${yyyy}`;

  const response = await axios.get(
    `https://${RAPIDAPI_HOST}/api/v3/trainBetweenStations`,
    {
      params:  { fromStationCode: fromCode, toStationCode: toCode, dateOfJourney: apiDate },
      headers: { 'x-rapidapi-host': RAPIDAPI_HOST, 'x-rapidapi-key': key },
      timeout: API_TIMEOUT,
    },
  );

  return response.data?.data ?? [];
}

// ── TrainProvider ─────────────────────────────────────────────────────────────
export class TrainProvider implements TravelProvider {
  mode: TravelMode = 'train';
  name = 'IRCTC';

  async getOptions(
    from: Location,
    to:   Location,
    date: string,
    distanceKm: number,
  ): Promise<TravelOption[]> {
    // Buffer: 30 min to reach station + 30 min from destination station
    const stationBufferMins = 60;

    // ── Try live IRCTC API ────────────────────────────────────────────────────
    const fromCode = getStationCode(from.name);
    const toCode   = getStationCode(to.name);

    if (fromCode && toCode && process.env.RAPIDAPI_KEY) {
      try {
        const trains = await fetchLiveTrains(fromCode, toCode, date);

        if (trains.length > 0) {
          const options: TravelOption[] = [];

          for (const train of trains.slice(0, 6)) {  // cap at 6 trains
            const name     = train.train_name ?? 'Express';
            const durationMins = train.duration
              ? parseDurationToMins(train.duration) + stationBufferMins
              : null;

            if (!durationMins) continue;

            const classes = train.class_type ?? [];
            const fares   = train.fare ?? {};

            // Sleeper
            if (classes.includes('SL')) {
              options.push({
                mode:          'train',
                subMode:       'train_sleeper',
                provider:      'IRCTC',
                name:          `${name} (Sleeper)`,
                fare:          fares['SL'] ?? Math.round(200 + distanceKm * 0.7),
                duration:      durationMins,
                distance:      distanceKm,
                departureTime: train.from_sta,
                arrivalTime:   train.to_sta,
                comfortScore:  getComfortScore('train_sleeper'),
                confidence:    'high', // Live IRCTC API
                details:       { source: 'IRCTC RapidAPI', trainNo: train.train_number },
              });
            }

            // 3AC
            if (classes.includes('3A')) {
              options.push({
                mode:          'train',
                subMode:       'train_3ac',
                provider:      'IRCTC',
                name:          `${name} (3AC)`,
                fare:          fares['3A'] ?? Math.round(500 + distanceKm * 1.8),
                duration:      durationMins,
                distance:      distanceKm,
                departureTime: train.from_sta,
                arrivalTime:   train.to_sta,
                comfortScore:  getComfortScore('train_3ac'),
                confidence:    'high',
                details:       { source: 'IRCTC RapidAPI', trainNo: train.train_number },
              });
            }

            // 2AC (long-distance routes)
            if (classes.includes('2A') && distanceKm > 300) {
              options.push({
                mode:          'train',
                subMode:       'train_2ac',
                provider:      'IRCTC',
                name:          `${name} (2AC)`,
                fare:          fares['2A'] ?? Math.round(700 + distanceKm * 2.5),
                duration:      Math.round(durationMins * 0.95),
                distance:      distanceKm,
                departureTime: train.from_sta,
                arrivalTime:   train.to_sta,
                comfortScore:  getComfortScore('train_2ac'),
                confidence:    'high',
                details:       { source: 'IRCTC RapidAPI', trainNo: train.train_number },
              });
            }
          }

          if (options.length > 0) return options;
        }
      } catch (err: any) {
        console.error(
          `[TrainProvider] IRCTC API failed for ${from.name}→${to.name}. ` +
          `Falling back to mock data. Error: ${err?.message ?? err}`,
        );
      }
    }

    // ── Graceful Fallback: Realistic Mock ─────────────────────────────────────
    // Realistic Indian railway average speeds (including stops, signals):
    // Express trains: ~55 kmph average (not 65)
    // Superfast: ~65 kmph average (not 80)
    // Rajdhani/Shatabdi: ~75 kmph (premium only)
    const expressDuration  = Math.round((distanceKm / 55) * 60) + stationBufferMins;
    const superfastDuration = Math.round((distanceKm / 65) * 60) + stationBufferMins;

    const options: TravelOption[] = [
      {
        mode:         'train',
        subMode:      'train_sleeper',
        provider:     'IRCTC',
        name:         'Express Sleeper',
        fare:         Math.round(200 + distanceKm * 0.7),
        duration:     expressDuration,
        distance:     distanceKm,
        comfortScore: getComfortScore('train_sleeper'),
        confidence:   'medium', // Model-based estimate
        details:      { source: 'mock' },
      },
      {
        mode:         'train',
        subMode:      'train_3ac',
        provider:     'IRCTC',
        name:         'Express 3AC',
        fare:         Math.round(500 + distanceKm * 1.8),
        duration:     expressDuration,
        distance:     distanceKm,
        comfortScore: getComfortScore('train_3ac'),
        confidence:   'medium',
        details:      { source: 'mock' },
      },
    ];

    // 2AC on longer routes
    if (distanceKm > 300) {
      options.push({
        mode:         'train',
        subMode:      'train_2ac',
        provider:     'IRCTC',
        name:         'Superfast 2AC',
        fare:         Math.round(700 + distanceKm * 2.5),
        duration:     superfastDuration,
        distance:     distanceKm,
        comfortScore: getComfortScore('train_2ac'),
        confidence:   'medium',
        details:      { source: 'mock' },
      });
    }

    return options;
  }
}
