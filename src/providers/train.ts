import axios from 'axios';
import { TravelProvider } from './provider.interface.js';
import { TravelMode, TravelOption, Location } from '../utils/types.js';
import { getComfortScore } from '../config/comfort_index.js';

// City -> primary IRCTC station code. Hyderabad uses SC (Secunderabad Jn) - the
// "HYB" code only serves a small subset of trains so it returns 0 results.
const stationCodes: Record<string, string> = {
  // Metros
  'Hyderabad':          'SC',     // Secunderabad Jn (main hub, more trains than HYB)
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

// IRCTC returns duration in mixed formats: "5:20", "5h 20m", or rarely just minutes
function parseDurationToMins(raw?: string): number {
  if (!raw) return 0;

  const colonMatch = raw.match(/^(\d+):(\d+)$/);
  if (colonMatch) return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);

  const hMatch = raw.match(/(\d+)\s*h/i);
  const mMatch = raw.match(/(\d+)\s*m/i);
  if (hMatch || mMatch) {
    return (hMatch ? parseInt(hMatch[1], 10) * 60 : 0) + (mMatch ? parseInt(mMatch[1], 10) : 0);
  }

  const numMatch = raw.match(/^(\d+)$/);
  if (numMatch) return parseInt(numMatch[1], 10);

  return 0;
}

// IRCTC RapidAPI (irctc1) - free tier is 100 req/day, so we cap+cache aggressively
const RAPIDAPI_HOST = 'irctc1.p.rapidapi.com';
const API_TIMEOUT = 8_000;

interface RapidTrain {
  train_name?: string;
  train_number?: string;
  duration?: string;
  from_sta?: string;
  to_sta?: string;
  from_day?: number;
  to_day?: number;
  class_type?: string[];
  fare?: Record<string, number>;
}

// Fallback when API "duration" is missing or "0:00" - happens on some long-haul trains
function durationFromTimes(fromTime?: string, toTime?: string, dayDiff = 0): number {
  if (!fromTime || !toTime) return 0;
  const [fh, fm] = fromTime.split(':').map(Number);
  const [th, tm] = toTime.split(':').map(Number);
  if ([fh, fm, th, tm].some(n => Number.isNaN(n))) return 0;

  let mins = (th * 60 + tm) - (fh * 60 + fm) + (Math.max(0, dayDiff) * 24 * 60);
  if (mins <= 0) mins += 24 * 60; // overnight without explicit day diff
  return mins;
}

async function fetchLiveTrains(
  fromCode: string,
  toCode:   string,
  date:     string,
): Promise<RapidTrain[]> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return [];

  // irctc1 expects YYYY-MM-DD (same as our internal format - pass through as-is)
  const response = await axios.get(
    `https://${RAPIDAPI_HOST}/api/v3/trainBetweenStations`,
    {
      params:  { fromStationCode: fromCode, toStationCode: toCode, dateOfJourney: date },
      headers: { 'x-rapidapi-host': RAPIDAPI_HOST, 'x-rapidapi-key': key },
      timeout: API_TIMEOUT,
    },
  );

  return response.data?.data ?? [];
}

export class TrainProvider implements TravelProvider {
  mode: TravelMode = 'train';
  name = 'IRCTC';

  async getOptions(
    from: Location,
    to:   Location,
    date: string,
    distanceKm: number,
  ): Promise<TravelOption[]> {
    // 30 min to reach station + 30 min from station to destination
    const stationBufferMins = 60;

    const fromCode = getStationCode(from.name);
    const toCode = getStationCode(to.name);

    if (fromCode && toCode && process.env.RAPIDAPI_KEY) {
      try {
        const trains = await fetchLiveTrains(fromCode, toCode, date);

        if (trains.length > 0) {
          const options: TravelOption[] = [];

          for (const train of trains.slice(0, 6)) {
            const name = train.train_name ?? 'Express';
            let rawMins = parseDurationToMins(train.duration);
            if (rawMins <= 0) {
              rawMins = durationFromTimes(
                train.from_sta,
                train.to_sta,
                (train.to_day ?? 0) - (train.from_day ?? 0),
              );
            }
            const durationMins = rawMins > 0 ? rawMins + stationBufferMins : 0;
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
        const status = err?.response?.status;
        const body = err?.response?.data;
        console.error(
          `[TrainProvider] IRCTC API failed for ${from.name}->${to.name}. ` +
          `HTTP ${status ?? 'unknown'}. Body: ${JSON.stringify(body).slice(0, 200)}. ` +
          `Falling back to mock data.`,
        );
      }
    }

    // Mock fallback. Avg Indian train speeds factoring stops & signals:
    // Express 55 kmph, Superfast 65 kmph, Rajdhani/Shatabdi 75 kmph.
    const expressDuration = Math.round((distanceKm / 55) * 60) + stationBufferMins;
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
