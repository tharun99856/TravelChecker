import { TravelProvider } from './provider.interface.js';
import { TravelMode, TravelOption, Location } from '../utils/types.js';
import { getCityRates } from '../config/city_rates.js';
import { getComfortScore } from '../config/comfort_index.js';

/**
 * CabProvider — Ola, Uber, Rapido pricing models
 * 
 * Uses realistic 2026 pricing intelligence:
 * - Area-dependent base fares (metro vs tier-2 cities)
 * - Dynamic surge pricing (peak hours, rain, events)
 * - Route-type multipliers (highway vs city traffic)
 * - Time-of-day adjustments
 * 
 * NOTE: Ola/Uber/Rapido do NOT provide public APIs for personal projects.
 * This model is based on publicly observable pricing from the apps themselves.
 */
export class CabProvider implements TravelProvider {
  mode: TravelMode = 'cab';
  name = 'RideHailing';

  async getOptions(
    from: Location,
    to: Location,
    date: string,
    distanceKm: number,
  ): Promise<TravelOption[]> {
    // Use source city rates (where the ride starts)
    const rates = getCityRates(from.name);

    // ── Speed & Duration Model ─────────────────────────────────────────────────
    // Realistic Indian road speeds (based on actual travel time data):
    // Pure city: 22-28 kmph (traffic signals, congestion)
    // Mixed city+highway: 35-40 kmph (most common for intercity)
    // Long highway: 45-50 kmph (NH quality, toll stops, trucks)
    let avgSpeed = 38; // Default: mixed route
    if (distanceKm > 150) avgSpeed = 48; // Long highway (best case)
    else if (distanceKm < 25) avgSpeed = 25; // Pure city

    const travelMins   = Math.round((distanceKm / avgSpeed) * 60);
    const durationMins = travelMins; // Door-to-door (no station buffer)

    // ── Dynamic Surge Pricing (2026 Model) ────────────────────────────────────
    let surgeFactor = 1.0;
    let surgeReason = '';

    try {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        const hour      = parsedDate.getHours();
        const dayOfWeek = parsedDate.getDay(); // 0=Sun, 6=Sat

        // Morning rush (8-10 AM) on weekdays
        if (hour >= 8 && hour <= 9 && dayOfWeek >= 1 && dayOfWeek <= 5) {
          surgeFactor = 1.35;
          surgeReason = 'Morning peak';
        }
        // Evening rush (6-9 PM) on weekdays — HIGHEST surge
        else if (hour >= 18 && hour <= 20 && dayOfWeek >= 1 && dayOfWeek <= 5) {
          surgeFactor = 1.5;
          surgeReason = 'Evening peak';
        }
        // Late night (11 PM - 5 AM) — safety surcharge
        else if (hour >= 23 || hour <= 4) {
          surgeFactor = 1.25;
          surgeReason = 'Late night';
        }
        // Weekend evenings (Fri/Sat 8 PM - 2 AM)
        else if ((dayOfWeek === 5 || dayOfWeek === 6) && (hour >= 20 || hour <= 1)) {
          surgeFactor = 1.3;
          surgeReason = 'Weekend night';
        }
      }
    } catch (e) {
      // Invalid date format — use no surge
    }

    // ── Route Type Multiplier ──────────────────────────────────────────────────
    // Long intercity routes (>200km) get a slight per-km discount (highway pricing)
    let routeMultiplier = 1.0;
    if (distanceKm > 200) routeMultiplier = 0.85;  // Highway discount
    else if (distanceKm < 10) routeMultiplier = 1.1; // Short-ride markup

    // ── Build Options ──────────────────────────────────────────────────────────
    const options: TravelOption[] = [];

    // Ola Mini (most economical 4-wheeler)
    options.push(
      this.createOption(
        'ola_mini',
        'Ola Mini',
        rates.ola_mini,
        distanceKm,
        durationMins,
        surgeFactor * routeMultiplier,
        surgeReason,
      ),
    );

    // Uber Go (comparable to Ola Mini, often slightly cheaper on highway routes)
    options.push(
      this.createOption(
        'uber_go',
        'Uber Go',
        rates.uber_go,
        distanceKm,
        durationMins,
        surgeFactor * routeMultiplier,
        surgeReason,
      ),
    );

    // Auto — realistic constraint: most auto drivers refuse trips > 50-60 km
    // Long-distance autos are uncomfortable and impractical for passengers
    if (distanceKm < 60) {
      options.push({
        ...this.createOption(
          'ola_auto',
          'Ola Auto',
          rates.ola_auto,
          distanceKm,
          durationMins,
          surgeFactor, // No highway discount for autos
          surgeReason,
        ),
        mode: 'auto' as TravelMode,
      });
    }

    // Rapido Bike — only for routes < 50 km (practical + safety limit)
    if (distanceKm < 50) {
      options.push({
        ...this.createOption(
          'rapido_bike',
          'Rapido Bike',
          rates.rapido_bike,
          distanceKm,
          durationMins,
          surgeFactor, // No highway discount for bikes
          surgeReason,
        ),
        mode: 'bike' as TravelMode,
      });
    }

    return options;
  }

  private createOption(
    subMode: string,
    name: string,
    rate: { base: number; perKm: number; perMin: number },
    distanceKm: number,
    durationMins: number,
    multiplier: number,
    surgeReason?: string,
  ): TravelOption {
    // Base fare model: fixed base + (distance × per-km rate) + (time × per-min rate)
    const baseFare = rate.base + rate.perKm * distanceKm + rate.perMin * durationMins;
    const finalFare = baseFare * multiplier;

    // Add ±12% confidence range for model-based estimates
    // Real-world variance from traffic, route choice, driver behavior
    const fareMin = Math.round(finalFare * 0.88);
    const fareMax = Math.round(finalFare * 1.12);

    return {
      mode:         'cab',
      subMode,
      provider:     name.split(' ')[0], // Extract 'Ola', 'Uber', 'Rapido'
      name,
      fare:         Math.round(finalFare),
      fareMin,
      fareMax,
      duration:     durationMins,
      distance:     distanceKm,
      comfortScore: getComfortScore(subMode),
      confidence:   'medium', // Model-based estimate
      details: {
        source:       'Realistic pricing model (2026)',
        surgeApplied: multiplier > 1.0,
        surgeReason:  surgeReason || undefined,
        baseFare:     Math.round(baseFare),
        multiplier:   Math.round(multiplier * 100) / 100,
      },
    };
  }
}

