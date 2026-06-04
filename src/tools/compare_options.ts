import { z } from 'zod';
import { scoreOptions } from '../utils/scorer.js';
import { TravelOption, Weights } from '../utils/types.js';

export const compareOptionsSchema = {
  routes: z.string().describe("JSON string of routes returned by get_routes"),
  weights: z.object({
    price: z.number().min(0).max(1),
    time: z.number().min(0).max(1),
    comfort: z.number().min(0).max(1)
  }).describe("Weights for scoring, must sum to roughly 1.0")
};

export async function compareOptionsHandler(args: { routes: string, weights: Weights }) {
  try {
    let parsedRoutes;
    try {
      parsedRoutes = JSON.parse(args.routes);
      if (parsedRoutes.options) {
         parsedRoutes = parsedRoutes.options;
      }
    } catch (e) {
       return { isError: true, content: [{ type: "text" as const, text: "Failed to parse routes JSON." }] };
    }

    if (!Array.isArray(parsedRoutes)) {
      return { isError: true, content: [{ type: "text" as const, text: "Routes must be an array." }] };
    }

    const scored = scoreOptions(parsedRoutes as TravelOption[], args.weights);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          appliedWeights: args.weights,
          scoredOptions: scored
        }, null, 2)
      }]
    };
  } catch (error: any) {
    return { isError: true, content: [{ type: "text" as const, text: `Error scoring options: ${error.message}` }] };
  }
}
