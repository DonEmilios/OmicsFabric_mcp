"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var types_js_1 = require("@modelcontextprotocol/sdk/types.js");
var zod_1 = require("zod");
var server = new index_js_1.Server({
    name: "omicfabric-master",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
/**
 * ==========================================
 * 1. WORKFLOW SCHEMAS (Tool CoT)
 * ==========================================
 */
var VARIANT_ANALYSIS_SCHEMA = zod_1.z.object({
    sample_id: zod_1.z.string().describe("Identifier for the genomic sample"),
    reference_genome: zod_1.z.string().default("GRCh38").describe("Reference genome build"),
});
var COMPARATIVE_ANALYSIS_SCHEMA = zod_1.z.object({
    species_list: zod_1.z.array(zod_1.z.string()).describe("List of species identifiers to compare"),
    focal_gene_id: zod_1.z.string().describe("Gene ID for ortholog search"),
});
var STANDARD_ANALYSIS_SCHEMA = zod_1.z.object({
    raw_data_path: zod_1.z.string().describe("Path to raw sequencing data (FASTQ files)"),
    organism_type: zod_1.z.enum(["prokaryote", "eukaryote"]).describe("Type of organism"),
});
/**
 * ==========================================
 * 2. GRANULAR TOOL SCHEMAS (Migrated)
 * ==========================================
 */
// from genome-db
var GET_GENE_INFO_SCHEMA = zod_1.z.object({
    gene_symbol: zod_1.z.string().describe("The official symbol of the gene (e.g., BRCA1, TP53)"),
    organism: zod_1.z.string().optional().default("human").describe("The organism to search in (default: human)"),
});
var SEARCH_VARIANTS_SCHEMA = zod_1.z.object({
    chrom: zod_1.z.string().describe("Chromosome (e.g., 1, 2, X)"),
    pos: zod_1.z.number().describe("Position on the chromosome"),
    ref: zod_1.z.string().describe("Reference allele"),
    alt: zod_1.z.string().describe("Alternate allele"),
});
// from sequence-tools
var BLAST_SEARCH_SCHEMA = zod_1.z.object({
    sequence: zod_1.z.string().describe("The DNA or protein sequence to search"),
    database: zod_1.z.string().optional().default("nr").describe("The database to search against (e.g., nr, nt)"),
    program: zod_1.z.enum(["blastn", "blastp", "blastx"]).optional().default("blastn").describe("The BLAST program to use"),
});
var MSA_SCHEMA = zod_1.z.object({
    sequences: zod_1.z.array(zod_1.z.string()).describe("List of sequences to align"),
    tool: zod_1.z.enum(["clustalw", "muscle"]).optional().default("muscle").describe("The alignment tool to use"),
});
// from genomics-viz
var PHYLO_TREE_SCHEMA = zod_1.z.object({
    msa_path: zod_1.z.string().describe("Path to the Multiple Sequence Alignment file"),
    method: zod_1.z.enum(["neighbor-joining", "maximum-likelihood"]).optional().default("neighbor-joining"),
});
var GENOME_TRACK_SCHEMA = zod_1.z.object({
    data_path: zod_1.z.string().describe("Path to the data file (e.g., BAM, BigWig)"),
    track_name: zod_1.z.string().describe("Name of the track to display"),
    format: zod_1.z.enum(["bam", "bw", "bed", "vcf"]).describe("Format of the data"),
});
// from galaxy-integration
var RUN_WORKFLOW_SCHEMA = zod_1.z.object({
    workflow_id: zod_1.z.string().describe("The ID of the Galaxy workflow to run"),
    dataset_id: zod_1.z.string().describe("The ID of the input dataset"),
    parameters: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional().describe("Workflow parameters"),
});
var GET_DATASET_SCHEMA = zod_1.z.object({
    history_id: zod_1.z.string().describe("The ID of the Galaxy history to query"),
    dataset_name: zod_1.z.string().describe("The name of the dataset to retrieve"),
});
/**
 * ==========================================
 * 3. TOOL HANDLERS
 * ==========================================
 */
server.setRequestHandler(types_js_1.ListToolsRequestSchema, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, {
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
            }];
    });
}); });
server.setRequestHandler(types_js_1.CallToolRequestSchema, function (request) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name, args, logs_1, addLog, _b, sample_id, reference_genome, _c, species_list, focal_gene_id, _d, raw_data_path, organism_type, _e, gene_symbol, organism, _f, chrom, pos, ref, alt, _g, program, database, tool, method, track_name, workflow_id, dataset_name;
    return __generator(this, function (_h) {
        _a = request.params, name = _a.name, args = _a.arguments;
        try {
            logs_1 = [];
            addLog = function (step, detail) {
                logs_1.push("[".concat(step, "] ").concat(detail));
            };
            switch (name) {
                // --- WORKFLOWS ---
                case "genomics_variant_analysis_workflow": {
                    _b = VARIANT_ANALYSIS_SCHEMA.parse(args), sample_id = _b.sample_id, reference_genome = _b.reference_genome;
                    addLog("CoT Initializing", "Starting Variant Analysis for ".concat(sample_id));
                    addLog("Pre-processing", "Aligning reads; performing deduplication and BQSR...");
                    addLog("Variant Calling", "Running GATK HaplotypeCaller...");
                    addLog("Annotation", "Applying functional annotations...");
                    return [2 /*return*/, { content: [{ type: "text", text: "### Logs:\n".concat(logs_1.join("\n"), "\n\n### Results:\nVariant calling complete for ").concat(sample_id, ".") }] }];
                }
                case "genomics_comparative_analysis_workflow": {
                    _c = COMPARATIVE_ANALYSIS_SCHEMA.parse(args), species_list = _c.species_list, focal_gene_id = _c.focal_gene_id;
                    addLog("CoT Initializing", "Comparing ".concat(focal_gene_id, " across ").concat(species_list.join(", ")));
                    addLog("Ortholog Identification", "Running reciprocal BLAST...");
                    return [2 /*return*/, { content: [{ type: "text", text: "### Logs:\n".concat(logs_1.join("\n"), "\n\n### Results:\nComparative analysis complete.") }] }];
                }
                case "genomics_standard_analysis_workflow": {
                    _d = STANDARD_ANALYSIS_SCHEMA.parse(args), raw_data_path = _d.raw_data_path, organism_type = _d.organism_type;
                    addLog("CoT Initializing", "Processing ".concat(raw_data_path));
                    return [2 /*return*/, { content: [{ type: "text", text: "### Logs:\n".concat(logs_1.join("\n"), "\n\n### Results:\nStandard analysis complete.") }] }];
                }
                // --- GENOME DB ---
                case "get_gene_info": {
                    _e = GET_GENE_INFO_SCHEMA.parse(args), gene_symbol = _e.gene_symbol, organism = _e.organism;
                    return [2 /*return*/, { content: [{ type: "text", text: "Information for gene ".concat(gene_symbol, " in ").concat(organism, ": tumor suppressor on Chr 17.") }] }];
                }
                case "search_gnomad_variants": {
                    _f = SEARCH_VARIANTS_SCHEMA.parse(args), chrom = _f.chrom, pos = _f.pos, ref = _f.ref, alt = _f.alt;
                    return [2 /*return*/, { content: [{ type: "text", text: "Variant ".concat(chrom, "-").concat(pos, "-").concat(ref, "-").concat(alt, " frequency: 0.00012.") }] }];
                }
                // --- SEQUENCE TOOLS ---
                case "run_blast": {
                    _g = BLAST_SEARCH_SCHEMA.parse(args), program = _g.program, database = _g.database;
                    return [2 /*return*/, { content: [{ type: "text", text: "BLAST search result (".concat(program, " on ").concat(database, "): Top Hit Homo sapiens BRCA1.") }] }];
                }
                case "run_msa": {
                    tool = MSA_SCHEMA.parse(args).tool;
                    return [2 /*return*/, { content: [{ type: "text", text: "MSA result using ".concat(tool, ": Sequences aligned.") }] }];
                }
                // --- VIZ ---
                case "create_phylo_tree": {
                    method = PHYLO_TREE_SCHEMA.parse(args).method;
                    return [2 /*return*/, { content: [{ type: "text", text: "Phylogenetic tree generated using ".concat(method, ".") }] }];
                }
                case "generate_browser_track": {
                    track_name = GENOME_TRACK_SCHEMA.parse(args).track_name;
                    return [2 /*return*/, { content: [{ type: "text", text: "Track '".concat(track_name, "' configured successfully.") }] }];
                }
                // --- GALAXY ---
                case "run_galaxy_workflow": {
                    workflow_id = RUN_WORKFLOW_SCHEMA.parse(args).workflow_id;
                    return [2 /*return*/, { content: [{ type: "text", text: "Workflow ".concat(workflow_id, " invoked. Status: Queued.") }] }];
                }
                case "get_galaxy_dataset": {
                    dataset_name = GET_DATASET_SCHEMA.parse(args).dataset_name;
                    return [2 /*return*/, { content: [{ type: "text", text: "Dataset '".concat(dataset_name, "' found. Format: fastq.gz.") }] }];
                }
                default:
                    throw new Error("Unknown tool: ".concat(name));
            }
        }
        catch (error) {
            return [2 /*return*/, { content: [{ type: "text", text: "Error: ".concat(error.message) }], isError: true }];
        }
        return [2 /*return*/];
    });
}); });
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var transport;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    transport = new stdio_js_1.StdioServerTransport();
                    return [4 /*yield*/, server.connect(transport)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error);
