import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import axios from "axios";
const server = new Server({
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
const GET_GENE_INFO_SCHEMA = z.object({
    gene_symbol: z.string().describe("The official symbol of the gene (e.g., BRCA1, TP53)"),
    organism: z.string().optional().default("human").describe("The organism to search in (default: human)"),
});
/**
 * Tool to search for variants in gnomAD (Simulated for this implementation).
 */
const SEARCH_VARIANTS_SCHEMA = z.object({
    chrom: z.string().describe("Chromosome (e.g., 1, 2, X)"),
    pos: z.number().describe("Position on the chromosome"),
    ref: z.string().describe("Reference allele"),
    alt: z.string().describe("Alternate allele"),
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
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
server.setRequestHandler(CallToolRequestSchema, async (request) => {
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
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Genome DB Access MCP server running on stdio");
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map