import { z } from 'zod';
import { ScoredOption } from '../utils/types.js';

export const recommendSchema = {
  scored_results: z.string().describe("JSON string of scored results returned by compare_options")
};

export async function recommendHandler(args: { scored_results: string }) {
  try {
    const parsed = JSON.parse(args.scored_results);
    const options: ScoredOption[] = parsed.scoredOptions || parsed;

    if (!Array.isArray(options) || options.length === 0) {
      return { isError: true, content: [{ type: "text" as const, text: "No options provided to recommend from." }] };
    }

    const topPick = options[0];
    const alternatives = options.slice(1, 4);

    let reason = `Best balance for your preferences with a score of ${topPick.compositeScore}/100. `;
    reason += `Cost: ₹${topPick.fare}, Time: ${Math.floor(topPick.duration / 60)}h ${topPick.duration % 60}m.`;

    if (alternatives.length > 0) {
      const nextBest = alternatives[0];
      const costDiff = nextBest.fare - topPick.fare;
      const timeDiff = nextBest.duration - topPick.duration;
      
      if (costDiff > 0 && timeDiff > 0) {
         reason += ` Saves ₹${costDiff} and is ${Math.floor(timeDiff/60)}h faster than the next best alternative (${nextBest.name}).`;
      } else if (costDiff > 0) {
         reason += ` Saves ₹${costDiff} vs ${nextBest.name} for only ${Math.abs(Math.floor(timeDiff/60))}h extra time.`;
      } else if (timeDiff > 0) {
         reason += ` Costs ₹${Math.abs(costDiff)} more than ${nextBest.name} but saves ${Math.floor(timeDiff/60)}h.`;
      }
    }

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          top_pick: `${topPick.mode.toUpperCase()} (${topPick.name})`,
          reason,
          details: topPick,
          alternatives: alternatives.map(a => ({
            mode: a.mode,
            name: a.name,
            fare: a.fare,
            duration: `${Math.floor(a.duration / 60)}h ${a.duration % 60}m`,
            score: a.compositeScore
          }))
        }, null, 2)
      }]
    };
  } catch (error: any) {
    return { isError: true, content: [{ type: "text" as const, text: `Error generating recommendation: ${error.message}` }] };
  }
}
