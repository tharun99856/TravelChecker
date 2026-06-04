#!/usr/bin/env tsx
/**
 * API Key Verification & Testing Script
 * Run: npm run test-apis
 * 
 * This script tests each API integration and tells you exactly what's working.
 */

import dotenv from 'dotenv';
import { Client } from '@googlemaps/google-maps-services-js';
import Amadeus from 'amadeus';
import axios from 'axios';
import { getDistance } from '../src/utils/distance.js';

dotenv.config();

// ── Color output helpers ──────────────────────────────────────────────────────
const colors = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  bold:   '\x1b[1m',
};

function success(msg: string) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function error(msg: string) {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
}

function info(msg: string) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`);
}

function section(title: string) {
  console.log(`\n${colors.bold}${colors.cyan}━━━ ${title} ━━━${colors.reset}\n`);
}

// ── Test 1: Google Maps Distance Matrix ──────────────────────────────────────
async function testGoogleMaps(): Promise<boolean> {
  section('1. Google Maps Distance Matrix API');

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    error('GOOGLE_MAPS_API_KEY not set in .env');
    info('Get it at: https://console.cloud.google.com/');
    info('Enable "Distance Matrix API" in the console');
    return false;
  }

  try {
    const client = new Client({});
    const response = await client.distancematrix({
      params: {
        origins:      ['Hyderabad, India'],
        destinations: ['Mumbai, India'],
        key,
      },
      timeout: 10_000,
    });

    const element = response.data.rows[0]?.elements[0];
    if (element?.status === 'OK') {
      const distanceKm = Math.round(element.distance.value / 1000);
      const durationH  = (element.duration.value / 3600).toFixed(1);
      success(`Google Maps API working!`);
      info(`   Test route: Hyderabad → Mumbai = ${distanceKm} km, ~${durationH} hours`);
      return true;
    } else {
      error(`API returned status: ${element?.status}`);
      return false;
    }
  } catch (err: any) {
    error(`Request failed: ${err?.message ?? err}`);
    if (err?.response?.data) {
      info(`   API error: ${JSON.stringify(err.response.data)}`);
    }
    return false;
  }
}

// ── Test 2: Amadeus Flight API ───────────────────────────────────────────────
async function testAmadeus(): Promise<boolean> {
  section('2. Amadeus Flight API');

  const clientId     = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    error('AMADEUS_CLIENT_ID or AMADEUS_CLIENT_SECRET not set in .env');
    info('Get it at: https://developers.amadeus.com/register');
    info('Start with "Self-Service" (free sandbox)');
    return false;
  }

  try {
    // @ts-ignore
    const amadeus = new Amadeus({
      clientId,
      clientSecret,
      hostname: (process.env.AMADEUS_HOSTNAME as 'test' | 'production') ?? 'test',
    });

    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode:      'DEL',
      destinationLocationCode: 'BOM',
      departureDate:           '2026-07-15',
      adults:                  '1',
      max:                     '1',
    });

    if (response.data && response.data.length > 0) {
      const offer = response.data[0];
      const price = offer.price?.total ?? '?';
      const curr  = offer.price?.currency ?? '';
      success(`Amadeus API working!`);
      info(`   Test flight: DEL → BOM = ${price} ${curr}`);
      if (curr !== 'INR') {
        info(`   Note: Sandbox returns ${curr}. Production uses INR for Indian routes.`);
      }
      return true;
    } else {
      error('API returned no flight offers');
      return false;
    }
  } catch (err: any) {
    error(`Request failed: ${err?.description ?? err?.message ?? err}`);
    if (err?.response?.statusCode === 401) {
      info('   Check your Client ID and Secret are correct');
    }
    return false;
  }
}

// ── Test 3: RapidAPI IRCTC ───────────────────────────────────────────────────
async function testRapidAPI(): Promise<boolean> {
  section('3. RapidAPI IRCTC');

  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    error('RAPIDAPI_KEY not set in .env');
    info('Get it at: https://rapidapi.com/IRCTC/api/irctc19');
    info('Subscribe to "Basic" plan (100 req/day free)');
    return false;
  }

  try {
    const response = await axios.get(
      'https://irctc19.p.rapidapi.com/api/v3/trainBetweenStations',
      {
        params: {
          fromStationCode: 'HYB',
          toStationCode:   'NDLS',
          dateOfJourney:   '15-07-2026',
        },
        headers: {
          'x-rapidapi-host': 'irctc19.p.rapidapi.com',
          'x-rapidapi-key':  key,
        },
        timeout: 10_000,
      },
    );

    const trains = response.data?.data ?? [];
    if (trains.length > 0) {
      const train = trains[0];
      success(`RapidAPI IRCTC working!`);
      info(`   Test train: ${train.train_name} (${train.train_number})`);
      info(`   Duration: ${train.duration}, Fare: ₹${train.fare?.SL ?? train.fare?.['3A'] ?? '?'}`);
      return true;
    } else {
      error('API returned no trains (might be invalid date or route)');
      return false;
    }
  } catch (err: any) {
    error(`Request failed: ${err?.message ?? err}`);
    if (err?.response?.status === 403) {
      info('   Your RapidAPI key may be invalid or subscription not active');
    }
    if (err?.response?.data) {
      info(`   API error: ${JSON.stringify(err.response.data)}`);
    }
    return false;
  }
}

// ── Test 4: Distance calculation integration ─────────────────────────────────
async function testDistanceIntegration(): Promise<boolean> {
  section('4. Distance Calculation (Integrated)');

  try {
    const result = await getDistance('Hyderabad', 'Bangalore');
    success(`Distance calculation working!`);
    info(`   Hyderabad → Bangalore = ${result.distanceKm} km, ${Math.round(result.durationMins / 60)} hours`);
    
    if (process.env.GOOGLE_MAPS_API_KEY) {
      info('   Using: Google Maps API (real-time data)');
    } else {
      info('   Using: Static routes_data.ts fallback');
    }
    return true;
  } catch (err: any) {
    error(`Distance calculation failed: ${err?.message ?? err}`);
    return false;
  }
}

// ── Run all tests ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`${colors.bold}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          TravelMCP API Integration Test Suite             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  const results = {
    googleMaps:   await testGoogleMaps(),
    amadeus:      await testAmadeus(),
    rapidAPI:     await testRapidAPI(),
    integration:  await testDistanceIntegration(),
  };

  // ── Summary ─────────────────────────────────────────────────────────────────
  section('Summary');

  const total   = Object.keys(results).length;
  const passing = Object.values(results).filter(Boolean).length;
  const percent = Math.round((passing / total) * 100);

  console.log(`${colors.bold}Results: ${passing}/${total} tests passing (${percent}%)${colors.reset}\n`);

  if (results.googleMaps && results.amadeus && results.rapidAPI) {
    success('All APIs operational! Your MCP is running with LIVE data.');
  } else if (results.integration) {
    info('Distance calculation is working. Add API keys for live flight/train data.');
  } else {
    error('Critical systems failed. Check your .env configuration.');
  }

  console.log(`\n${colors.yellow}Next steps:${colors.reset}`);
  if (!results.googleMaps) console.log('  • Add GOOGLE_MAPS_API_KEY to .env');
  if (!results.amadeus)    console.log('  • Add AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET to .env');
  if (!results.rapidAPI)   console.log('  • Add RAPIDAPI_KEY to .env');
  console.log('  • Run: npm run test-apis (to retest)');
  console.log('  • Run: npm run start:http (to start the MCP server)\n');

  process.exit(passing === total ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
