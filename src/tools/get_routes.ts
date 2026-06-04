import { z } from 'zod';
import { getLocation, getDistance } from '../utils/distance.js';
import { getAvailableModesForDistance } from '../config/mode_filters.js';
import { CabProvider } from '../providers/cab.js';
import { TrainProvider } from '../providers/train.js';
import { BusProvider } from '../providers/bus.js';
import { FlightProvider } from '../providers/flight.js';
import { PersonalVehicleProvider } from '../providers/personal_vehicle.js';
import { TravelOption } from '../utils/types.js';
import { buildLegs } from '../utils/hubs.js';

export const getRoutesSchema = {
  source: z.string().describe("Source city/town name"),
  destination: z.string().describe("Destination city/town name"),
  date: z.string().describe("Travel date in YYYY-MM-DD format"),
  source_coords: z.object({ lat: z.number(), lng: z.number() }).optional(),
  destination_coords: z.object({ lat: z.number(), lng: z.number() }).optional(),
  user_ip: z.string().optional().describe("IP address of the user who initiated the search")
};

const providers = [
  new CabProvider(),
  new PersonalVehicleProvider(),
  new TrainProvider(),
  new BusProvider(),
  new FlightProvider()
];

export async function getRoutesHandler(args: { source: string, destination: string, date: string, source_coords?: any, destination_coords?: any, user_ip?: string }) {
  const fromLoc = getLocation(args.source);
  const toLoc = getLocation(args.destination);

  if (!fromLoc) {
    return { isError: true, content: [{ type: "text" as const, text: `Source location '${args.source}' not found in database.` }] };
  }
  if (!toLoc) {
    return { isError: true, content: [{ type: "text" as const, text: `Destination location '${args.destination}' not found in database.` }] };
  }

  const { distanceKm } = await getDistance(fromLoc.name, toLoc.name);
  const availableModes = getAvailableModesForDistance(distanceKm);

  let allOptions: TravelOption[] = [];

  // Run providers in parallel
  const promises = providers
    .filter(p => availableModes.includes(p.mode))
    .map(p => p.getOptions(fromLoc, toLoc, args.date, distanceKm, { userIp: args.user_ip }).catch(e => {
      console.error(`Error in ${p.name} provider:`, e);
      return []; // graceful fallback
    }));

  const results = await Promise.all(promises);
  results.forEach(res => allOptions.push(...res));

  // Attach journey legs to every option
  for (const opt of allOptions) {
    if (!opt.legs || opt.legs.length === 0) {
      opt.legs = buildLegs(fromLoc, toLoc, opt.mode, opt.fare, opt.duration, opt.provider);
    }
  }

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({
        metadata: {
          from: fromLoc,
          to: toLoc,
          distanceKm,
          totalOptions: allOptions.length
        },
        options: allOptions
      }, null, 2)
    }]
  };
}
