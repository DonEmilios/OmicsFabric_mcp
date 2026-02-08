# MCP Servers Reference

This document provides a detailed reference for the Model Context Protocol (MCP) servers integrated into the DataFarmer system.

## 1. Genome DB Access (`genome-db`)

### What it is for

This server provides access to external genomic databases, primarily for fetching gene metadata and searching for variant population frequencies.

### How to use it

- **`get_gene_info`**: Fetch detailed information (summary, location, full name) about a gene using its official symbol.
  - _Parameters_: `gene_symbol` (required), `organism` (optional, default: human).
- **`search_gnomad_variants`**: Search the gnomAD database for a specific variant to find its allele frequency and consequence.
  - _Parameters_: `chrom`, `pos`, `ref`, `alt` (all required).

### What it is NOT for

- Downloading large raw sequencing data (FASTQ/BAM files).
- Performing heavy computational analysis like genome assembly.

---

## 2. Sequence Analysis Tools (`sequence-tools`)

### What it is for

Provides tools for basic sequence manipulation and analysis tasks, such as similarity searches and alignments.

### How to use it

- **`run_blast`**: Perform a BLAST search against various sequence databases (e.g., DNA vs DNA, Protein vs Protein).
  - _Parameters_: `sequence` (required), `database` (optional), `program` (optional).
- **`run_msa`**: Run Multiple Sequence Alignment (MSA) on a list of sequences to identify conserved patterns.
  - _Parameters_: `sequences` (required), `tool` (optional: clustalw, muscle).

### What it is NOT for

- Managing genomic histories or workflows (use `galaxy-integration`).
- Visualizing phylogenetic relationships (use `genomics-viz`).

---

## 3. Genomics Visualization (`genomics-viz`)

### What it is for

Specialized in generating data structures and configurations for visualizing genomic data.

### How to use it

- **`create_phylo_tree`**: Generate a phylogenetic tree structure from an existing Multiple Sequence Alignment (MSA) file.
  - _Parameters_: `msa_path` (required), `method` (optional).
- **`generate_browser_track`**: Configure a track for genome browser visualization (e.g., JBrowse or IGV).
  - _Parameters_: `data_path`, `track_name`, `format` (all required).

### What it is NOT for

- Running the actual genome browser software (it provides the _data tracks_ for use in those browsers).
- Performing variant calling or primary alignment.

---

## 4. Galaxy Integration (`galaxy-integration`)

### What it is for

Provides a bridge to the Galaxy Project’s workflow management system, allowing for the execution of complex, multi-step genomic pipelines.

### How to use it

- **`run_galaxy_workflow`**: Trigger an existing Galaxy workflow on a specific dataset ID.
  - _Parameters_: `workflow_id`, `dataset_id` (required), `parameters` (optional).
- **`get_galaxy_dataset`**: Retrieve metadata and access URLs for datasets stored in Galaxy histories.
  - _Parameters_: `history_id`, `dataset_name` (required).

### What it is NOT for

- Small-scale, immediate sequence edits.
- Direct database queries to NCBI (use `genome-db`).
- Visualizing data locally without reference to a Galaxy history.
