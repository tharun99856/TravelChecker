import axios from 'axios';
import * as cheerio from 'cheerio';
import { TravelProvider } from './provider.interface.js';
import { TravelMode, TravelOption, Location } from '../utils/types.js';
import { getComfortScore } from '../config/comfort_index.js';

// Scraping AbhiBus (APSRTC partner) - lighter anti-bot than RedBus, but if their
// DOM changes or Cloudflare kicks in, the scraper returns 0 and we fall back to mock.
const SCRAPE_TIMEOUT = 7_000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/124.0.0.0 Safari/537.36';

function toSlug(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-');
}

interface ScrapedBus {
  operator:  string;
  busType:   string;       // e.g. "Volvo A/C Sleeper (2+1)"
  fare:      number;
  duration:  number;       // minutes
  departure: string;
}

async function scrapeAbhiBus(
  from: string,
  to:   string,
  date: string,            // YYYY-MM-DD
): Promise<ScrapedBus[]> {
  // AbhiBus search URL pattern: /bus-tickets/from-to/date
  const [yyyy, mm, dd] = date.split('-');
  const dateSlug = `${dd}-${mm}-${yyyy}`;
  const url = `https://www.abhibus.com/bus_search/${toSlug(from)}-to-${toSlug(to)}/${dateSlug}/1`;

  const response = await axios.get(url, {
    timeout: SCRAPE_TIMEOUT,
    headers: {
      'User-Agent': USER_AGENT,
      'Accept':     'text/html,application/xhtml+xml',
      'Accept-Language': 'en-IN,en;q=0.9',
      'Referer':    'https://www.abhibus.com/',
    },
  });

  const $ = cheerio.load(response.data as string);
  const buses: ScrapedBus[] = [];

  // AbhiBus bus result cards — selector targets the fare and type fields.
  // These selectors are best-effort; the scraper may return 0 results if
  // AbhiBus changes their DOM, which triggers the fallback automatically.
  $('.search-result-item, .bus-list-item, [data-testid="bus-card"]').each((_i, el) => {
    const fareText = $(el).find('.seat-fare, .fare-amount, .price, [class*="fare"]').first().text();
    const typeText = $(el).find('.bus-type, .bus-name, [class*="busType"]').first().text();
    const deptText = $(el).find('.departure-time, .dept-time, [class*="departure"]').first().text();
    const durnText = $(el).find('.duration, .travel-time, [class*="duration"]').first().text();
    const oprText  = $(el).find('.operator-name, .travels-name, [class*="operator"]').first().text();

    const fareMatch = fareText.match(/[\d,]+/);
    const fare = fareMatch ? parseInt(fareMatch[0].replace(/,/g, ''), 10) : 0;

    if (!fare || fare < 100) return; // skip malformed entries

    // Parse duration "6h 30m" or "6:30"
    let durationMins = 0;
    const durnH = durnText.match(/(\d+)\s*h/i);
    const durnM = durnText.match(/(\d+)\s*m/i);
    const colonM = durnText.match(/(\d+):(\d{2})/);
    if (colonM) {
      durationMins = parseInt(colonM[1], 10) * 60 + parseInt(colonM[2], 10);
    } else {
      durationMins = (durnH ? parseInt(durnH[1], 10) * 60 : 0) + (durnM ? parseInt(durnM[1], 10) : 0);
    }

    buses.push({
      operator:  oprText.trim()  || 'Private Travels',
      busType:   typeText.trim() || 'AC',
      fare,
      duration:  durationMins,
      departure: deptText.trim() || '',
    });
  });

  return buses;
}

function classifyBusType(busType: string): { subMode: string; label: string } {
  const t = busType.toLowerCase();
  if (t.includes('sleeper') && t.includes('a/c')) return { subMode: 'bus_ac_sleeper',  label: 'Volvo AC Sleeper'  };
  if (t.includes('sleeper'))                        return { subMode: 'bus_ac_sleeper',  label: 'AC Sleeper'        };
  if ((t.includes('volvo') || t.includes('a/c')) && !t.includes('non'))
                                                    return { subMode: 'bus_ac_seater',   label: 'Volvo AC Seater'   };
  return { subMode: 'bus_non_ac', label: 'Non-AC Bus' };
}

export class BusProvider implements TravelProvider {
  mode: TravelMode = 'bus';
  name = 'AbhiBus';

  async getOptions(
    from: Location,
    to:   Location,
    date: string,
    distanceKm: number,
  ): Promise<TravelOption[]> {
    // Bus stand buffer: 30 min each end
    const busStandBufferMins = 45;

    try {
      const scraped = await scrapeAbhiBus(from.name, to.name, date);

      if (scraped.length > 0) {
        // Dedupe by subMode, keep the cheapest fare per type
        const bySubMode = new Map<string, ScrapedBus & { subMode: string; label: string }>();

        for (const bus of scraped) {
          const { subMode, label } = classifyBusType(bus.busType);
          const existing = bySubMode.get(subMode);
          if (!existing || bus.fare < existing.fare) {
            bySubMode.set(subMode, { ...bus, subMode, label });
          }
        }

        return Array.from(bySubMode.values()).map((bus) => ({
          mode:          'bus' as TravelMode,
          subMode:       bus.subMode,
          provider:      bus.operator,
          name:          bus.label,
          fare:          bus.fare,
          duration:      (bus.duration || Math.round((distanceKm / 50) * 60)) + busStandBufferMins,
          distance:      distanceKm,
          departureTime: bus.departure || undefined,
          comfortScore:  getComfortScore(bus.subMode),
          confidence:    'medium', // Scraped data (less reliable than API)
          details:       { source: 'AbhiBus scrape', rawType: bus.busType },
        }));
      }
    } catch (err: any) {
      console.error(
        `[BusProvider] HTTP scrape failed for ${from.name}→${to.name}. ` +
        `Falling back to mock data. Error: ${err?.message ?? err}`,
      );
    }

    // Mock fallback. Avg bus speed 50 kmph (highway + town stops blended).
    const travelMins   = Math.round((distanceKm / 50) * 60);
    const durationMins = travelMins + busStandBufferMins;

    const options: TravelOption[] = [
      {
        mode:         'bus',
        subMode:      'bus_non_ac',
        provider:     'APSRTC',
        name:         'State RTC Non-AC',
        fare:         Math.round(distanceKm * 1.3),
        duration:     durationMins + 30,  // more stops
        distance:     distanceKm,
        comfortScore: getComfortScore('bus_non_ac'),
        confidence:   'medium',
        details:      { source: 'mock' },
      },
      {
        mode:         'bus',
        subMode:      'bus_ac_seater',
        provider:     'Private Travels',
        name:         'AC Seater',
        fare:         Math.round(distanceKm * 1.8),
        duration:     durationMins,
        distance:     distanceKm,
        comfortScore: getComfortScore('bus_ac_seater'),
        confidence:   'medium',
        details:      { source: 'mock' },
      },
    ];

    // AC Sleeper only makes sense for routes > 250 km (overnight journeys)
    if (distanceKm > 250) {
      options.push({
        mode:         'bus',
        subMode:      'bus_ac_sleeper',
        provider:     'Premium Travels',
        name:         'Volvo AC Sleeper',
        fare:         Math.round(distanceKm * 2.5),
        duration:     Math.round(durationMins * 0.9),  // fewer stops
        distance:     distanceKm,
        comfortScore: getComfortScore('bus_ac_sleeper'),
        confidence:   'medium',
        details:      { source: 'mock' },
      });
    }

    return options;
  }
}
