"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const zod_1 = require("zod");
const axios_1 = __importDefault(require("axios"));
const server = new index_js_1.Server({
    name: "genome-db-access",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
/**
 * Tool to query NCBI for gene information.
 */
const GET_GENE_INFO_SCHEMA = {
    gene_symbol: zod_1.z.string().describe("The official symbol of the gene (e.g., BRCA1, TP53)"),
    organism: zod_1.z.string().optional().default("human").describe("The organism to search in (default: human)"),
};
/**
 * Tool to search for variants in gnomAD (Simulated for this implementation).
 */
const SEARCH_VARIANTS_SCHEMA = {
    chrom: zod_1.z.string().describe("Chromosome (e.g., 1, 2, X)"),
    pos: zod_1.z.number().describe("Position on the chromosome"),
    ref: zod_1.z.string().describe("Reference allele"),
    alt: zod_1.z.string().describe("Alternate allele"),
};
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_gene_info",
                description: "Fetch detailed information about a gene from NCBI/Ensembl",
                inputSchema: {
                    type: "object",
                    properties: {
                        gene_symbol: { type: "string" },
                        organism: { type: "string" },
                    },
                    required: ["gene_symbol"],
                },
            },
            {
                name: "search_gnomad_variants",
                description: "Search for specific variants in the gnomAD population database",
                inputSchema: {
                    type: "object",
                    properties: {
                        chrom: { type: "string" },
                        pos: { type: "number" },
                        ref: { type: "string" },
                        alt: { type: "string" },
                    },
                    required: ["chrom", "pos", "ref", "alt"],
                },
            },
        ],
    };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        if (name === "get_gene_info") {
            const { gene_symbol, organism } = GET_GENE_INFO_SCHEMA.parse(args);
            // Real implementation would use NCBI e-utils or Ensembl REST API
            // Here we simulate the response
            return {
                content: [
                    {
                        type: "text",
                        text: `Information for gene ${gene_symbol} in ${organism}:\n- Symbol: ${gene_symbol}\n- Full Name: ${gene_symbol} tumor suppressor\n- Chromosome: 17\n- Location: 17q21.31\n- Summary: This gene encodes a nuclear phosphoprotein that plays a role in maintaining genomic stability and it also acts as a tumor suppressor.`,
                    },
                ],
            };
        }
        else if (name === "search_gnomad_variants") {
            const { chrom, pos, ref, alt } = SEARCH_VARIANTS_SCHEMA.parse(args);
            // Simulate gnomAD variant search
            return {
                content: [
                    {
                        type: "text",
                        text: `Variant ${chrom}-${pos}-${ref}-${alt} found in gnomAD:\n- Allele Count: 14\n- Allele Frequency: 0.00012\n- Hom count: 0\n- Consequence: missense_variant`,
                    },
                ],
            };
        }
        else {
            throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
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
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Genome DB Access MCP server running on stdio");
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map