import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { z } from "zod";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "sk-no-key-required";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "http://localhost:11434/v1"; // Default to Ollama
const PROVIDER = process.env.LLM_PROVIDER || "gemini"; // "gemini" or "local"

const MCP_CONFIG_PATH = path.resolve(__dirname, "../../mcp.json");

function loadMcpConfig() {
  const config = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, "utf-8"));
  return Object.entries(config.mcpServers).map(([name, serverConfig]: [string, any]) => ({
    name,
    command: serverConfig.command,
    args: serverConfig.args,
  }));
}

async function createClient(serverConfig: { name: string; command: string; args: string[] }) {
  const transport = new StdioClientTransport({
    command: serverConfig.command,
    args: serverConfig.args,
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

async function runGemini(userRequest: string, allTools: any[], clients: any[]) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    tools: [
      {
        functionDeclarations: allTools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: t.input_schema,
        })),
      },
    ],
  });

  const chat = model.startChat();
  let result = await chat.sendMessage(userRequest);
  let response = result.response;

  while (response.candidates?.[0]?.content?.parts?.some((part: any) => part.functionCall)) {
    const functionCalls = response.candidates[0].content.parts.filter(
      (part: any) => part.functionCall
    );

    const toolResults = await Promise.all(
      functionCalls.map(async (part: any) => {
        const functionCall = part.functionCall!;
        const tool = allTools.find((t) => t.name === functionCall.name);
        const clientObj = clients.find((c) => c.name === tool?.serverName);
        console.log(`Executing tool: ${functionCall.name} on server: ${tool?.serverName}`);

        const callResult = await clientObj?.client.request(
          {
            method: "tools/call",
            params: { name: functionCall.name, arguments: functionCall.args },
          },
          CallToolResultSchema
        );

        return {
          functionResponse: {
            name: functionCall.name,
            response: { result: callResult?.content.map((c: any) => c.text).join("\n") },
          },
        };
      })
    );

    result = await chat.sendMessage(toolResults);
    response = result.response;
  }
  return response.text();
}

async function runLocal(userRequest: string, allTools: any[], clients: any[]) {
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    baseURL: OPENAI_BASE_URL,
  });

  const messages: any[] = [{ role: "user", content: userRequest }];
  const tools = allTools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));

  let iteration = 0;
  while (iteration < 10) {
    const response = await openai.chat.completions.create({
      model: process.env.LOCAL_MODEL || "llama3", // Default to llama3 for Ollama
      messages: messages,
      tools: tools as any,
    });

    const message = response.choices[0]!.message;
    messages.push(message);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return message.content;
    }

    const toolResults = await Promise.all(
      (message.tool_calls || []).map(async (toolCall: any) => {
        const tool = allTools.find((t) => t.name === toolCall.function.name);
        const clientObj = clients.find((c) => c.name === tool?.serverName);
        console.log(`Executing tool: ${toolCall.function.name} on server: ${tool?.serverName}`);

        const result = await clientObj?.client.request(
          {
            method: "tools/call",
            params: {
              name: toolCall.function.name,
              arguments: JSON.parse(toolCall.function.arguments),
            },
          },
          CallToolResultSchema
        );

        return {
          tool_call_id: toolCall.id,
          role: "tool",
          name: toolCall.function.name,
          content: result?.content.map((c: any) => c.text).join("\n"),
        } as any;
      })
    );

    messages.push(...toolResults);
    iteration++;
  }
  return "Max iterations reached.";
}

async function main() {
  console.log("Loading configurations from mcp.json...");
  const serverConfigs = loadMcpConfig();

  console.log("Connecting to MCP servers...");
  const clients = await Promise.all(
    serverConfigs.map((config) => createClient(config))
  );

  const allTools: any[] = [];
  for (const { name, client } of clients) {
    const toolsResponse = await client.request(
      { method: "tools/list" },
      ListToolsResultSchema
    );
    for (const tool of toolsResponse.tools) {
      allTools.push({ ...tool, serverName: name });
    }
  }

  const userRequest = process.argv.slice(2).join(" ") || "Analyze the BRCA1 gene in humans.";
  console.log(`\nUser Request: ${userRequest} (Provider: ${PROVIDER})`);

  let finalResponse: string | null = null;
  if (PROVIDER === "gemini") {
    finalResponse = await runGemini(userRequest, allTools, clients);
  } else {
    finalResponse = await runLocal(userRequest, allTools, clients);
  }

  console.log(`\nResponse: ${finalResponse}`);

  await Promise.all(clients.map((c) => c.client.close()));
}

main().catch(console.error);
