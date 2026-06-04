import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import swaggerUi from "swagger-ui-express";
import { server } from "./index.js";
import { locations } from "./config/routes_data.js";
import { getRateLimitStatus } from "./utils/distance.js";
import { getTravelpayoutsBookingLink } from "./providers/flight.js";
import { swaggerSpec } from "./swagger.js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const startedAt = Date.now();

let transport: SSEServerTransport | null = null;

// ── Rate limiter middleware ──────────────────────────────────────────────────
const ipHits = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = Number(process.env.API_RATE_LIMIT ?? 30);

function rateLimitMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = getRequestIp(req) ?? "unknown";
  const now = Date.now();
  let bucket = ipHits.get(ip);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
    ipHits.set(ip, bucket);
  }

  bucket.count += 1;
  res.setHeader("X-RateLimit-Limit", RATE_LIMIT);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, RATE_LIMIT - bucket.count));
  res.setHeader("X-RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));

  if (bucket.count > RATE_LIMIT) {
    return res.status(429).json({ error: "Rate limit exceeded. Try again in 1 minute." });
  }

  next();
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "web")));
app.use(express.json());

// Swagger UI at /docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TravelCompare API Docs',
}));
app.get("/openapi.json", (_req, res) => res.json(swaggerSpec));

// Apply rate limiting to API routes
app.use("/api", rateLimitMiddleware);

// ── MCP SSE Endpoint ─────────────────────────────────────────────────────────
app.get("/sse", async (req, res) => {
  console.log("New SSE connection");
  transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
});

app.post("/message", async (req, res) => {
  console.log("Received MCP message");
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No active transport");
  }
});

// ── Health & Diagnostics ─────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "TravelCompare MCP HTTP Server",
    uptime: Math.round((Date.now() - startedAt) / 1000),
    providers: {
      googleMaps: Boolean(process.env.GOOGLE_MAPS_API_KEY),
      flights: Boolean(process.env.TRAVELPAYOUTS_TOKEN && process.env.TRAVELPAYOUTS_MARKER),
      trains: Boolean(process.env.RAPIDAPI_KEY),
    },
  });
});

app.get("/api/rate-limit", (_req, res) => {
  res.json(getRateLimitStatus());
});

// API endpoint to serve locations for the frontend dropdowns
app.get("/api/locations", (req, res) => {
  res.json(locations.map(l => ({ name: l.name, state: l.state, populationTier: l.populationTier })));
});

// Generate Travelpayouts agency link only after the user clicks "Book".
app.post("/api/book-flight", async (req, res) => {
  try {
    const { searchId, clickRef } = req.body;
    if (!searchId || clickRef === undefined || clickRef === null) {
      return res.status(400).json({ error: "searchId and clickRef are required" });
    }

    const booking = await getTravelpayoutsBookingLink(String(searchId), String(clickRef));
    res.json(booking);
  } catch (error) {
    console.error("Error generating booking link:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
});

// Real MCP route analysis endpoint
app.post("/api/analyze-route", async (req, res) => {
  try {
    const { source, destination, weights } = req.body;
    
    // Import handlers directly
    const { getRoutesHandler } = await import("./tools/get_routes.js");
    const { compareOptionsHandler } = await import("./tools/compare_options.js");
    const { recommendHandler } = await import("./tools/recommend.js");
    
    // Get all routes
    const routesResult = await getRoutesHandler({
      source,
      destination,
      date: new Date().toISOString().split('T')[0], // Today's date
      user_ip: getRequestIp(req),
    });
    
    if (routesResult.isError) {
      return res.status(400).json({ error: routesResult.content[0].text });
    }
    
    const routesData = JSON.parse(routesResult.content[0].text);
    
    // Compare options with user weights
    const compareResult = await compareOptionsHandler({
      routes: routesResult.content[0].text,
      weights: {
        price: weights.price || 0.6,
        time: weights.time || 0.3,
        comfort: weights.comfort || 0.1,
      },
    });
    
    if (compareResult.isError) {
      return res.status(400).json({ error: compareResult.content[0].text });
    }
    
    const compareData = JSON.parse(compareResult.content[0].text);
    
    // Get recommendation
    const recommendResult = await recommendHandler({
      scored_results: compareResult.content[0].text,
    });
    
    if (recommendResult.isError) {
      return res.status(400).json({ error: recommendResult.content[0].text });
    }
    
    const recommendData = JSON.parse(recommendResult.content[0].text);
    
    res.json({
      metadata: routesData.metadata,
      scoredOptions: compareData.scoredOptions,
      recommendation: {
        topPick: recommendData.details,
        explanation: recommendData.reason,
      },
    });
  } catch (error) {
    console.error("Error in analyze-route:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.listen(port, () => {
  console.log(`TravelCompare HTTP Server running on http://localhost:${port}`);
  console.log(`API docs available at http://localhost:${port}/docs`);
  console.log(`MCP endpoint available at http://localhost:${port}/sse`);
});

function getRequestIp(req: express.Request): string | undefined {
  const forwardedFor = req.headers["x-forwarded-for"];
  const rawIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0]?.trim() || req.socket.remoteAddress || req.ip;

  return rawIp?.replace(/^::ffff:/, "");
}
