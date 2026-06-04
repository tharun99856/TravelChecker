import { TravelMode, TravelOption, Location } from '../utils/types.js';

export interface TravelProvider {
  mode: TravelMode;
  name: string;
  getOptions(
    from: Location,
    to: Location,
    date: string,
    distanceKm: number,
    context?: { userIp?: string },
  ): Promise<TravelOption[]>;
}
