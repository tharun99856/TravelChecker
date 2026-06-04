import { TravelProvider } from './provider.interface.js';
import { TravelMode, TravelOption, Location } from '../utils/types.js';
import { getFuelPrice } from '../config/fuel_prices.js';
import { getComfortScore } from '../config/comfort_index.js';

/**
 * PersonalVehicleProvider — Own car/bike fuel costs
 * 
 * Calculates realistic ownership costs for personal vehicles:
 * - Fuel cost: (distance / mileage) × fuel_price_per_liter
 * - Area-dependent fuel prices (Andhra Pradesh has highest rates)
 * - Realistic mileage assumptions based on Indian vehicle averages
 * - No surge pricing (you own the vehicle)
 * - No distance constraints for personal bike (unlike Rapido)
 * 
 * NOTE: This does NOT include:
 * - Vehicle depreciation, insurance, maintenance, parking
 * - Toll charges (varies by route)
 * - Driver fatigue considerations
 * 
 * This is FUEL COST ONLY for a fair comparison with ride-hailing services.
 */
export class PersonalVehicleProvider implements TravelProvider {
  mode: TravelMode = 'cab'; // Will be overridden per vehicle type
  name = 'PersonalVehicle';

  async getOptions(
    from: Location,
    to: Location,
    date: string,
    distanceKm: number,
  ): Promise<TravelOption[]> {
    // Use source city fuel prices (where you start)
    const fuelPrice = getFuelPrice(from.name);

    // ── Speed & Duration Model ─────────────────────────────────────────────────
    // Personal vehicles follow similar speed patterns as ride-hailing
    // but slightly faster (no passenger pickup/drop, familiar routes)
    let avgSpeedBike = 40; // Bikes are faster in traffic
    let avgSpeedCar = 38;  // Cars match ride-hailing speeds

    if (distanceKm > 150) {
      avgSpeedBike = 55; // Highway cruise (bikes are faster)
      avgSpeedCar = 50;  // Highway cruise
    } else if (distanceKm < 25) {
      avgSpeedBike = 28; // City traffic
      avgSpeedCar = 25;  // City traffic
    }

    const travelMinsBike = Math.round((distanceKm / avgSpeedBike) * 60);
    const travelMinsCar = Math.round((distanceKm / avgSpeedCar) * 60);

    const options: TravelOption[] = [];

    // ── Personal Bike (NO distance constraint) ────────────────────────────────
    // Unlike Rapido (50 km limit), your own bike can go any distance
    // Solo trips are possible — no passenger safety restrictions
    const bikeMileage = 50; // km/l (realistic Indian bike average: 45-55 km/l)
    const bikeFuelCost = (distanceKm / bikeMileage) * fuelPrice.petrol;

    // ±8% confidence range (fuel price variance, traffic-based consumption)
    const bikeFareMin = Math.round(bikeFuelCost * 0.92);
    const bikeFareMax = Math.round(bikeFuelCost * 1.08);

    options.push({
      mode: 'bike',
      subMode: 'personal_bike',
      provider: 'Own',
      name: 'Personal Bike',
      fare: Math.round(bikeFuelCost),
      fareMin: bikeFareMin,
      fareMax: bikeFareMax,
      duration: travelMinsBike,
      distance: distanceKm,
      comfortScore: getComfortScore('personal_bike'),
      confidence: 'high', // You know your bike's mileage
      details: {
        source: 'Fuel cost calculation',
        fuelType: 'Petrol',
        fuelPricePerLiter: fuelPrice.petrol,
        mileage: bikeMileage,
        litersConsumed: Math.round((distanceKm / bikeMileage) * 100) / 100,
        note: 'Fuel cost only (excludes maintenance, toll, depreciation)',
      },
    });

    // ── Personal Car — Petrol Variant ─────────────────────────────────────────
    const carPetrolMileage = 17; // km/l (realistic Indian car average: 15-20 km/l)
    const carPetrolCost = (distanceKm / carPetrolMileage) * fuelPrice.petrol;

    const carPetrolMin = Math.round(carPetrolCost * 0.92);
    const carPetrolMax = Math.round(carPetrolCost * 1.08);

    options.push({
      mode: 'cab',
      subMode: 'personal_car_petrol',
      provider: 'Own',
      name: 'Personal Car (Petrol)',
      fare: Math.round(carPetrolCost),
      fareMin: carPetrolMin,
      fareMax: carPetrolMax,
      duration: travelMinsCar,
      distance: distanceKm,
      comfortScore: getComfortScore('personal_car'),
      confidence: 'high',
      details: {
        source: 'Fuel cost calculation',
        fuelType: 'Petrol',
        fuelPricePerLiter: fuelPrice.petrol,
        mileage: carPetrolMileage,
        litersConsumed: Math.round((distanceKm / carPetrolMileage) * 100) / 100,
        note: 'Fuel cost only (excludes maintenance, toll, depreciation)',
      },
    });

    // ── Personal Car — Diesel Variant ─────────────────────────────────────────
    const carDieselMileage = 22; // km/l (realistic Indian diesel car: 20-25 km/l)
    const carDieselCost = (distanceKm / carDieselMileage) * fuelPrice.diesel;

    const carDieselMin = Math.round(carDieselCost * 0.92);
    const carDieselMax = Math.round(carDieselCost * 1.08);

    options.push({
      mode: 'cab',
      subMode: 'personal_car_diesel',
      provider: 'Own',
      name: 'Personal Car (Diesel)',
      fare: Math.round(carDieselCost),
      fareMin: carDieselMin,
      fareMax: carDieselMax,
      duration: travelMinsCar,
      distance: distanceKm,
      comfortScore: getComfortScore('personal_car'),
      confidence: 'high',
      details: {
        source: 'Fuel cost calculation',
        fuelType: 'Diesel',
        fuelPricePerLiter: fuelPrice.diesel,
        mileage: carDieselMileage,
        litersConsumed: Math.round((distanceKm / carDieselMileage) * 100) / 100,
        note: 'Fuel cost only (excludes maintenance, toll, depreciation)',
      },
    });

    return options;
  }
}
