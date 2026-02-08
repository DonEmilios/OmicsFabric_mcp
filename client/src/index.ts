import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from "@modelcontextprotocol/sdk/types.js";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error("Please set ANTHROPIC_API_KEY in your environment");
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

const MCP_SERVERS = [
  {
    name: "genome-db",
    path: path.resolve(__dirname, "../../mcps/mcp-genome-db/build/index.js"),
  },
  {
    name: "sequence-tools",
    path: path.resolve(__dirname, "../../mcps/mcp-sequence-tools/build/index.js"),
  },
  {
    name: "genomics-viz",
    path: path.resolve(__dirname, "../../mcps/mcp-genomics-viz/build/index.js"),
  },
  {
    name: "galaxy-integration",
    path: path.resolve(__dirname, "../../mcps/mcp-galaxy-integration/build/index.js"),
  },
];

async function createClient(serverConfig: { name: string; path: string }) {
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverConfig.path],
  });

  const client = new Client(
    {
      name: `genomics-client-${serverConfig.name}`,
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  return { name: serverConfig.name, client };
}

async function main() {
  console.log("Connecting to MCP servers...");
  const clients = await Promise.all(
    MCP_SERVERS.map((config) => createClient(config))
  );

  console.log("Fetching tools from all servers...");
  const allTools: any[] = [];
  for (const { name, client } of clients) {
    const toolsResponse = await client.request(
      { method: "tools/list" },
      ListToolsResultSchema
    );
    // Add server prefix to tool names to avoid collisions if necessary, 
    // but here we just collect them.
    for (const tool of toolsResponse.tools) {
      allTools.push({
        ...tool,
        serverName: name,
      });
    }
  }

  console.log(`Discovered ${allTools.length} tools.`);

  const messages: any[] = [];
  
  // Example interaction loop (could be expanded to a full CLI)
  const userRequest = process.argv.slice(2).join(" ") || "Analyze the BRCA1 gene in humans and search for known variants in gnomAD.";
  
  console.log(`\nUser Request: ${userRequest}`);
  messages.push({ role: "user", content: userRequest });

  let iteration = 0;
  while (iteration < 10) {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: messages,
      tools: allTools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema as any,
      })),
    });

    messages.push({ role: "assistant", content: response.content });

    const toolCalls = response.content.filter((c: any) => c.type === "tool_use");
    if (toolCalls.length === 0) {
      const finalResponse = response.content.find((c: any) => c.type === "text");
      if (finalResponse && "text" in finalResponse) {
        console.log(`\nClaude: ${finalResponse.text}`);
      }
      break;
    }

    const toolResults = await Promise.all(
      toolCalls.map(async (toolCall: any) => {
        const tool = allTools.find((t) => t.name === toolCall.name);
        if (!tool) {
          return {
            type: "tool_result",
            tool_use_id: toolCall.id,
            content: `Error: Tool ${toolCall.name} not found`,
            is_error: true,
          };
        }

        const clientObj = clients.find((c) => c.name === tool.serverName);
        console.log(`Executing tool: ${toolCall.name} on server: ${tool.serverName}`);
        
        try {
          const result = await clientObj?.client.request(
            {
              method: "tools/call",
              params: {
                name: toolCall.name,
                arguments: toolCall.input,
              },
            },
            CallToolResultSchema
          );

          return {
            type: "tool_result",
            tool_use_id: toolCall.id,
            content: result?.content.map((c: any) => c.text).join("\n"),
          };
        } catch (error: any) {
          return {
            type: "tool_result",
            tool_use_id: toolCall.id,
            content: `Error executing tool: ${error.message}`,
            is_error: true,
          };
        }
      })
    );

    messages.push({ role: "user", content: toolResults });
    iteration++;
  }

  // Close connections
  await Promise.all(clients.map(c => c.client.close()));
}

main().catch(console.error);
