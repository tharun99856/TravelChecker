import { TravelOption, ScoredOption, Weights } from './types.js';

export function scoreOptions(options: TravelOption[], weights: Weights): ScoredOption[] {
  if (options.length === 0) return [];
  if (options.length === 1) {
    return [{ ...options[0], priceScore: 100, timeScore: 100, compositeScore: 100 }];
  }

  const prices = options.map(o => o.fare);
  const times = options.map(o => o.duration);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  const scored = options.map(opt => {
    // Normalize 0-100 (lower is better, so 1 - normalized)
    // Handle edge case where all prices or times are the same
    let priceScore = 100;
    if (maxPrice > minPrice) {
      priceScore = 100 * (1 - (opt.fare - minPrice) / (maxPrice - minPrice));
    }

    let timeScore = 100;
    if (maxTime > minTime) {
      timeScore = 100 * (1 - (opt.duration - minTime) / (maxTime - minTime));
    }

    const comfortScore = opt.comfortScore;

    const compositeScore = Math.min(100,
      (weights.price * priceScore) +
      (weights.time * timeScore) +
      (weights.comfort * comfortScore)
    );

    return {
      ...opt,
      priceScore: Math.round(priceScore),
      timeScore: Math.round(timeScore),
      compositeScore: Math.round(compositeScore)
    };
  });

  // Sort by composite score descending
  return scored.sort((a, b) => b.compositeScore - a.compositeScore);
}
