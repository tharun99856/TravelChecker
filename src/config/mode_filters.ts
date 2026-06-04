import { TravelMode } from '../utils/types.js';

export function getAvailableModesForDistance(distanceKm: number): TravelMode[] {
  if (distanceKm < 30) {
    return ['bike', 'auto', 'cab', 'bus'];
  } else if (distanceKm < 150) {
    return ['cab', 'bus', 'train'];
  } else if (distanceKm < 500) {
    return ['bus', 'train', 'cab', 'flight'];
  } else if (distanceKm < 1500) {
    return ['train', 'bus', 'flight'];
  } else {
    // > 1500 km
    return ['train', 'flight'];
  }
}
