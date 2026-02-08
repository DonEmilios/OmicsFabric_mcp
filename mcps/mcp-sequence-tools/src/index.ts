import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const server = new Server(
  {
    name: "sequence-analysis-tools",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * BLAST search schema.
 */
const BLAST_SEARCH_SCHEMA = z.object({
  sequence: z.string().describe("The DNA or protein sequence to search"),
  database: z.string().optional().default("nr").describe("The database to search against (e.g., nr, nt)"),
  program: z.enum(["blastn", "blastp", "blastx"]).optional().default("blastn").describe("The BLAST program to use"),
});

/**
 * Multiple Sequence Alignment schema.
 */
const MSA_SCHEMA = z.object({
  sequences: z.array(z.string()).describe("List of sequences to align"),
  tool: z.enum(["clustalw", "muscle"]).optional().default("muscle").describe("The alignment tool to use"),
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "run_blast",
        description: "Perform a BLAST search against sequence databases",
        inputSchema: {
          type: "object",
          properties: {
            sequence: { type: "string" },
            database: { type: "string" },
            program: { type: "string", enum: ["blastn", "blastp", "blastx"] },
          },
          required: ["sequence"],
        },
      },
      {
        name: "run_msa",
        description: "Perform Multiple Sequence Alignment (MSA)",
        inputSchema: {
          type: "object",
          properties: {
            sequences: { type: "array", items: { type: "string" } },
            tool: { type: "string", enum: ["clustalw", "muscle"] },
          },
          required: ["sequences"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "run_blast") {
      const { sequence, database, program } = BLAST_SEARCH_SCHEMA.parse(args);
      // Simulate BLAST search
      return {
        content: [
          {
            type: "text",
            text: `BLAST search result (${program} on ${database}):\n- Top Hit: gi|12345678|ref|NM_001234.1| Homo sapiens BRCA1\n- E-value: 1e-120\n- Identity: 99%\n- Alignment: ...ATGC...`,
          },
        ],
      };
    } else if (name === "run_msa") {
      const { sequences, tool } = MSA_SCHEMA.parse(args);
      // Simulate MSA result
      return {
        content: [
          {
            type: "text",
            text: `MSA result using ${tool}:\nCLUSTAL W (1.83) multiple sequence alignment\n\nseq1      ATGC...\nseq2      ATGC...\nseq3      AT-C...\n          ****`,
          },
        ],
      };
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
