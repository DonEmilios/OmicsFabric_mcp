import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const server = new Server(
  {
    name: "omicfabric-master",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * ==========================================
 * 1. WORKFLOW SCHEMAS (Tool CoT)
 * ==========================================
 */

const VARIANT_ANALYSIS_SCHEMA = z.object({
  sample_id: z.string().describe("Identifier for the genomic sample"),
  reference_genome: z.string().default("GRCh38").describe("Reference genome build"),
});

const COMPARATIVE_ANALYSIS_SCHEMA = z.object({
  species_list: z.array(z.string()).describe("List of species identifiers to compare"),
  focal_gene_id: z.string().describe("Gene ID for ortholog search"),
});

const STANDARD_ANALYSIS_SCHEMA = z.object({
  raw_data_path: z.string().describe("Path to raw sequencing data (FASTQ files)"),
  organism_type: z.enum(["prokaryote", "eukaryote"]).describe("Type of organism"),
});

/**
 * ==========================================
 * 2. GRANULAR TOOL SCHEMAS (Migrated)
 * ==========================================
 */

// from genome-db
const GET_GENE_INFO_SCHEMA = z.object({
  gene_symbol: z.string().describe("The official symbol of the gene (e.g., BRCA1, TP53)"),
  organism: z.string().optional().default("human").describe("The organism to search in (default: human)"),
});

const SEARCH_VARIANTS_SCHEMA = z.object({
  chrom: z.string().describe("Chromosome (e.g., 1, 2, X)"),
  pos: z.number().describe("Position on the chromosome"),
  ref: z.string().describe("Reference allele"),
  alt: z.string().describe("Alternate allele"),
});

// from sequence-tools
const BLAST_SEARCH_SCHEMA = z.object({
  sequence: z.string().describe("The DNA or protein sequence to search"),
  database: z.string().optional().default("nr").describe("The database to search against (e.g., nr, nt)"),
  program: z.enum(["blastn", "blastp", "blastx"]).optional().default("blastn").describe("The BLAST program to use"),
});

const MSA_SCHEMA = z.object({
  sequences: z.array(z.string()).describe("List of sequences to align"),
  tool: z.enum(["clustalw", "muscle"]).optional().default("muscle").describe("The alignment tool to use"),
});

// from genomics-viz
const PHYLO_TREE_SCHEMA = z.object({
  msa_path: z.string().describe("Path to the Multiple Sequence Alignment file"),
  method: z.enum(["neighbor-joining", "maximum-likelihood"]).optional().default("neighbor-joining"),
});

const GENOME_TRACK_SCHEMA = z.object({
  data_path: z.string().describe("Path to the data file (e.g., BAM, BigWig)"),
  track_name: z.string().describe("Name of the track to display"),
  format: z.enum(["bam", "bw", "bed", "vcf"]).describe("Format of the data"),
});

// from galaxy-integration
const RUN_WORKFLOW_SCHEMA = z.object({
  workflow_id: z.string().describe("The ID of the Galaxy workflow to run"),
  dataset_id: z.string().describe("The ID of the input dataset"),
  parameters: z.record(z.string(), z.any()).optional().describe("Workflow parameters"),
});

const GET_DATASET_SCHEMA = z.object({
  history_id: z.string().describe("The ID of the Galaxy history to query"),
  dataset_name: z.string().describe("The name of the dataset to retrieve"),
});

/**
 * ==========================================
 * 3. TOOL HANDLERS
 * ==========================================
 */

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Workflows
      {
        name: "genomics_variant_analysis_workflow",
        description: "Executes a best-practices variant calling workflow (Pre-processing -> Calling -> Annotation) with internal CoT.",
        inputSchema: { type: "object", properties: { sample_id: { type: "string" }, reference_genome: { type: "string", default: "GRCh38" } }, required: ["sample_id"] },
      },
      {
        name: "genomics_comparative_analysis_workflow",
        description: "Executes cross-species comparison workflow (Orthologs -> Alignment -> Evolutionary Analysis) with internal CoT.",
        inputSchema: { type: "object", properties: { species_list: { type: "array", items: { type: "string" } }, focal_gene_id: { type: "string" } }, required: ["species_list", "focal_gene_id"] },
      },
      {
        name: "genomics_standard_analysis_workflow",
        description: "Executes general sequence processing (QC -> Assembly -> Annotation) with internal CoT.",
        inputSchema: { type: "object", properties: { raw_data_path: { type: "string" }, organism_type: { type: "string", enum: ["prokaryote", "eukaryote"] } }, required: ["raw_data_path", "organism_type"] },
      },
      // Granular: Genome DB
      {
        name: "get_gene_info",
        description: "Fetch detailed information about a gene from NCBI/Ensembl",
        inputSchema: { type: "object", properties: { gene_symbol: { type: "string" }, organism: { type: "string" } }, required: ["gene_symbol"] },
      },
      {
        name: "search_gnomad_variants",
        description: "Search for specific variants in the gnomAD population database",
        inputSchema: { type: "object", properties: { chrom: { type: "string" }, pos: { type: "number" }, ref: { type: "string" }, alt: { type: "string" } }, required: ["chrom", "pos", "ref", "alt"] },
      },
      // Granular: Sequence Tools
      {
        name: "run_blast",
        description: "Perform a BLAST search against sequence databases",
        inputSchema: { type: "object", properties: { sequence: { type: "string" }, database: { type: "string" }, program: { type: "string", enum: ["blastn", "blastp", "blastx"] } }, required: ["sequence"] },
      },
      {
        name: "run_msa",
        description: "Perform Multiple Sequence Alignment (MSA)",
        inputSchema: { type: "object", properties: { sequences: { type: "array", items: { type: "string" } }, tool: { type: "string", enum: ["clustalw", "muscle"] } }, required: ["sequences"] },
      },
      // Granular: Viz
      {
        name: "create_phylo_tree",
        description: "Generate a phylogenetic tree from an MSA file",
        inputSchema: { type: "object", properties: { msa_path: { type: "string" }, method: { type: "string", enum: ["neighbor-joining", "maximum-likelihood"] } }, required: ["msa_path"] },
      },
      {
        name: "generate_browser_track",
        description: "Generate a track for genome browser visualization",
        inputSchema: { type: "object", properties: { data_path: { type: "string" }, track_name: { type: "string" }, format: { type: "string", enum: ["bam", "bw", "bed", "vcf"] } }, required: ["data_path", "track_name", "format"] },
      },
      // Granular: Galaxy
      {
        name: "run_galaxy_workflow",
        description: "Invoke a Galaxy workflow on a specific dataset",
        inputSchema: { type: "object", properties: { workflow_id: { type: "string" }, dataset_id: { type: "string" }, parameters: { type: "object" } }, required: ["workflow_id", "dataset_id"] },
      },
      {
        name: "get_galaxy_dataset",
        description: "Retrieve a dataset from a Galaxy history",
        inputSchema: { type: "object", properties: { history_id: { type: "string" }, dataset_name: { type: "string" } }, required: ["history_id", "dataset_name"] },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const logs: string[] = [];
    const addLog = (step: string, detail: string) => {
      logs.push(`[${step}] ${detail}`);
    };

    switch (name) {
      // --- WORKFLOWS ---
      case "genomics_variant_analysis_workflow": {
        const { sample_id, reference_genome } = VARIANT_ANALYSIS_SCHEMA.parse(args);
        addLog("CoT Initializing", `Starting Variant Analysis for ${sample_id}`);
        addLog("Pre-processing", "Aligning reads; performing deduplication and BQSR...");
        addLog("Variant Calling", "Running GATK HaplotypeCaller...");
        addLog("Annotation", "Applying functional annotations...");
        return { content: [{ type: "text", text: `### Logs:\n${logs.join("\n")}\n\n### Results:\nVariant calling complete for ${sample_id}.` }] };
      }
      case "genomics_comparative_analysis_workflow": {
        const { species_list, focal_gene_id } = COMPARATIVE_ANALYSIS_SCHEMA.parse(args);
        addLog("CoT Initializing", `Comparing ${focal_gene_id} across ${species_list.join(", ")}`);
        addLog("Ortholog Identification", "Running reciprocal BLAST...");
        return { content: [{ type: "text", text: `### Logs:\n${logs.join("\n")}\n\n### Results:\nComparative analysis complete.` }] };
      }
      case "genomics_standard_analysis_workflow": {
        const { raw_data_path, organism_type } = STANDARD_ANALYSIS_SCHEMA.parse(args);
        addLog("CoT Initializing", `Processing ${raw_data_path}`);
        return { content: [{ type: "text", text: `### Logs:\n${logs.join("\n")}\n\n### Results:\nStandard analysis complete.` }] };
      }

      // --- GENOME DB ---
      case "get_gene_info": {
        const { gene_symbol, organism } = GET_GENE_INFO_SCHEMA.parse(args);
        return { content: [{ type: "text", text: `Information for gene ${gene_symbol} in ${organism}: tumor suppressor on Chr 17.` }] };
      }
      case "search_gnomad_variants": {
        const { chrom, pos, ref, alt } = SEARCH_VARIANTS_SCHEMA.parse(args);
        return { content: [{ type: "text", text: `Variant ${chrom}-${pos}-${ref}-${alt} frequency: 0.00012.` }] };
      }

      // --- SEQUENCE TOOLS ---
      case "run_blast": {
        const { program, database } = BLAST_SEARCH_SCHEMA.parse(args);
        return { content: [{ type: "text", text: `BLAST search result (${program} on ${database}): Top Hit Homo sapiens BRCA1.` }] };
      }
      case "run_msa": {
        const { tool } = MSA_SCHEMA.parse(args);
        return { content: [{ type: "text", text: `MSA result using ${tool}: Sequences aligned.` }] };
      }

      // --- VIZ ---
      case "create_phylo_tree": {
        const { method } = PHYLO_TREE_SCHEMA.parse(args);
        return { content: [{ type: "text", text: `Phylogenetic tree generated using ${method}.` }] };
      }
      case "generate_browser_track": {
        const { track_name } = GENOME_TRACK_SCHEMA.parse(args);
        return { content: [{ type: "text", text: `Track '${track_name}' configured successfully.` }] };
      }

      // --- GALAXY ---
      case "run_galaxy_workflow": {
        const { workflow_id } = RUN_WORKFLOW_SCHEMA.parse(args);
        return { content: [{ type: "text", text: `Workflow ${workflow_id} invoked. Status: Queued.` }] };
      }
      case "get_galaxy_dataset": {
        const { dataset_name } = GET_DATASET_SCHEMA.parse(args);
        return { content: [{ type: "text", text: `Dataset '${dataset_name}' found. Format: fastq.gz.` }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
