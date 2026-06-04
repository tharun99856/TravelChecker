import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getRoutesSchema, getRoutesHandler } from "./tools/get_routes.js";
import { compareOptionsSchema, compareOptionsHandler } from "./tools/compare_options.js";
import { recommendSchema, recommendHandler } from "./tools/recommend.js";

// Create MCP Server
export const server = new McpServer({
  name: "travel-compare",
  version: "1.0.0",
});

// Register tools
server.tool(
  "get_routes",
  "Fetches all available travel options between two locations",
  getRoutesSchema,
  getRoutesHandler
);

server.tool(
  "compare_options",
  "Takes raw routes and applies preference weights to score them",
  compareOptionsSchema,
  compareOptionsHandler
);

server.tool(
  "recommend",
  "Returns the top recommendation with a plain-English explanation based on scored results",
  recommendSchema,
  recommendHandler
);

// Start stdio transport if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const transport = new StdioServerTransport();
  server.connect(transport).catch((error) => {
    console.error("Failed to connect stdio transport:", error);
    process.exit(1);
  });
  console.error("TravelCompare MCP Server running on stdio");
}
