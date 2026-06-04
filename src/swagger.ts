export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'TravelCompare API',
    version: '1.0.0',
    description:
      'Multi-modal travel comparison engine for Indian routes. ' +
      'Aggregates live data from Travelpayouts/Aviasales (flights), IRCTC RapidAPI (trains), ' +
      'AbhiBus (buses), and modeled pricing for cabs and personal vehicles. ' +
      'Scores options using a weighted composite of price, time, and comfort.',
    contact: { name: 'TravelCompare', url: 'https://github.com/' },
    license: { name: 'MIT' },
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Local dev' },
  ],
  tags: [
    { name: 'Routes', description: 'Core travel comparison endpoints' },
    { name: 'Booking', description: 'Flight booking redirect' },
    { name: 'System', description: 'Health and diagnostics' },
  ],
  paths: {
    '/api/analyze-route': {
      post: {
        tags: ['Routes'],
        summary: 'Compare all travel options between two cities',
        description:
          'Fetches live/modeled options across flight, train, bus, cab, and personal vehicle. ' +
          'Applies user-defined preference weights and returns scored + ranked results with a top recommendation.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AnalyzeRouteRequest' },
              example: {
                source: 'Hyderabad',
                destination: 'Vijayawada',
                weights: { price: 0.6, time: 0.3, comfort: 0.1 },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Scored travel options with recommendation',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AnalyzeRouteResponse' },
              },
            },
          },
          '400': { description: 'Invalid source/destination or missing fields' },
          '429': { description: 'Rate limit exceeded' },
          '500': { description: 'Provider error' },
        },
      },
    },
    '/api/locations': {
      get: {
        tags: ['Routes'],
        summary: 'List all supported cities and towns',
        description: 'Returns the full location catalogue with state, name, and population tier.',
        responses: {
          '200': {
            description: 'Array of locations',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/LocationSummary' },
                },
              },
            },
          },
        },
      },
    },
    '/api/book-flight': {
      post: {
        tags: ['Booking'],
        summary: 'Generate a Travelpayouts booking redirect URL',
        description:
          'Takes a search ID and click reference from a prior analyze-route flight result ' +
          'and returns a one-time booking URL. The user clicks this to complete purchase on the airline/OTA site.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BookFlightRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Booking redirect URL',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BookFlightResponse' },
              },
            },
          },
          '400': { description: 'Missing searchId or clickRef' },
          '500': { description: 'Travelpayouts API failure' },
        },
      },
    },
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string' },
                    uptime: { type: 'number', description: 'Seconds since start' },
                    providers: {
                      type: 'object',
                      properties: {
                        googleMaps: { type: 'boolean' },
                        flights: { type: 'boolean' },
                        travelpayouts: { type: 'boolean' },
                        irctc: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/rate-limit': {
      get: {
        tags: ['System'],
        summary: 'Google Maps API usage dashboard',
        description: 'Shows per-minute and per-day consumption of the Distance Matrix quota.',
        responses: {
          '200': {
            description: 'Rate limit counters',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      AnalyzeRouteRequest: {
        type: 'object',
        required: ['source', 'destination'],
        properties: {
          source: { type: 'string', description: 'Origin city name', example: 'Hyderabad' },
          destination: { type: 'string', description: 'Destination city name', example: 'Bangalore' },
          weights: {
            type: 'object',
            description: 'Preference weights (0-1, should sum to 1)',
            properties: {
              price: { type: 'number', minimum: 0, maximum: 1, default: 0.6 },
              time: { type: 'number', minimum: 0, maximum: 1, default: 0.3 },
              comfort: { type: 'number', minimum: 0, maximum: 1, default: 0.1 },
            },
          },
        },
      },
      AnalyzeRouteResponse: {
        type: 'object',
        properties: {
          metadata: {
            type: 'object',
            properties: {
              from: { $ref: '#/components/schemas/Location' },
              to: { $ref: '#/components/schemas/Location' },
              distanceKm: { type: 'number' },
              totalOptions: { type: 'integer' },
            },
          },
          scoredOptions: {
            type: 'array',
            items: { $ref: '#/components/schemas/ScoredOption' },
          },
          recommendation: {
            type: 'object',
            properties: {
              topPick: { $ref: '#/components/schemas/ScoredOption' },
              explanation: { type: 'string' },
            },
          },
        },
      },
      ScoredOption: {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['flight', 'train', 'bus', 'cab', 'auto', 'bike'] },
          subMode: { type: 'string', example: 'train_3ac' },
          provider: { type: 'string', example: 'IRCTC' },
          name: { type: 'string', example: 'Express 3AC' },
          fare: { type: 'number', example: 850 },
          fareMin: { type: 'number' },
          fareMax: { type: 'number' },
          duration: { type: 'number', description: 'Total door-to-door minutes', example: 270 },
          distance: { type: 'number', example: 275 },
          comfortScore: { type: 'number', minimum: 0, maximum: 100 },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          priceScore: { type: 'number' },
          timeScore: { type: 'number' },
          compositeScore: { type: 'number' },
          details: { type: 'object', additionalProperties: true },
        },
      },
      Location: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          state: { type: 'string' },
          lat: { type: 'number' },
          lng: { type: 'number' },
          populationTier: { type: 'string', enum: ['metro', 'city', 'town', 'small_town'] },
        },
      },
      LocationSummary: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Hyderabad' },
          state: { type: 'string', example: 'Telangana' },
          populationTier: { type: 'string' },
        },
      },
      BookFlightRequest: {
        type: 'object',
        required: ['searchId', 'clickRef'],
        properties: {
          searchId: { type: 'string' },
          clickRef: { type: 'string' },
        },
      },
      BookFlightResponse: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri', description: 'One-time booking redirect URL' },
        },
      },
    },
  },
};
