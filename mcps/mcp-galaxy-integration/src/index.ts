import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const server = new Server(
  {
    name: "galaxy-integration",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Galaxy workflow execution schema.
 */
const RUN_WORKFLOW_SCHEMA = z.object({
  workflow_id: z.string().describe("The ID of the Galaxy workflow to run"),
  dataset_id: z.string().describe("The ID of the input dataset"),
  parameters: z.record(z.string(), z.any()).optional().describe("Workflow parameters"),
});

/**
 * Galaxy dataset management schema.
 */
const GET_DATASET_SCHEMA = z.object({
  history_id: z.string().describe("The ID of the Galaxy history to query"),
  dataset_name: z.string().describe("The name of the dataset to retrieve"),
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "run_galaxy_workflow",
        description: "Invoke a Galaxy workflow on a specific dataset",
        inputSchema: {
          type: "object",
          properties: {
            workflow_id: { type: "string" },
            dataset_id: { type: "string" },
            parameters: { type: "object" },
          },
          required: ["workflow_id", "dataset_id"],
        },
      },
      {
        name: "get_galaxy_dataset",
        description: "Retrieve a dataset from a Galaxy history",
        inputSchema: {
          type: "object",
          properties: {
            history_id: { type: "string" },
            dataset_name: { type: "string" },
          },
          required: ["history_id", "dataset_name"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "run_galaxy_workflow") {
      const { workflow_id, dataset_id, parameters } = RUN_WORKFLOW_SCHEMA.parse(args);
      // Simulate workflow invocation
      return {
        content: [
          {
            type: "text",
            text: `Workflow ${workflow_id} invoked successfully on dataset ${dataset_id}.\n- History: genomics_analysis_2026\n- Status: Queued\n- View at: https://usegalaxy.org/u/user/h/genomics-analysis-2026`,
          },
        ],
      };
    } else if (name === "get_galaxy_dataset") {
      const { history_id, dataset_name } = GET_DATASET_SCHEMA.parse(args);
      // Simulate dataset retrieval
      return {
        content: [
          {
            type: "text",
            text: `Dataset '${dataset_name}' found in history ${history_id}:\n- Format: fastq.gz\n- Size: 1.2 GB\n- State: OK\n- Download URL: https://usegalaxy.org/api/datasets/12345/display`,
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
