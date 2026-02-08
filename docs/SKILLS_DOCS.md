# Skills Documentation

This document provides an overview of the specialized skills available in the DataFarmer MCP system.

## 1. Genomics Variant Analysis (`genomics-variant-analysis`)

### What it is for

This skill is designed for the identification and interpretation of genomic variants (SNPs, indels, structural variants) from high-throughput sequencing data. It follows a best-practices protocol for read alignment, quality recalibration, and functional annotation.

### How to use it

- **Pre-processing**: Use for aligning reads to a reference genome (e.g., using BWA-MEM), deduplication, and base quality score recalibration (BQSR).
- **Variant Calling**: Use for identifying variants (e.g., using GATK HaplotypeCaller) and applying quality filters.
- **Interpretation**: Use for annotating variants with functional impact (e.g., SnpEff) and prioritizing rare variants using population databases (gnomAD).

### What it is NOT for

- This skill is not intended for de novo genome assembly or general transcriptomics (RNA-seq) analysis unless specifically looking for variants.
- It is not a tool for clinical diagnosis but rather a research framework.

---

## 2. Comparative Genomics (`genomics-comparative-analysis`)

### What it is for

Used for comparing genomic sequences across different species or strains to understand evolutionary relationships and identify conserved functional elements.

### How to use it

- **Ortholog Identification**: Use to find orthologous gene pairs using reciprocal BLAST hits and synteny analysis.
- **Genome Alignment**: Use for multiple genome alignment (progressiveMauve) and detecting large-scale rearrangements.
- **Evolutionary Analysis**: Use for calculating dN/dS ratios and identifying genes under selective pressure.

### What it is NOT for

- Standard variant calling within a single population.
- Managing local database connections or raw sequencing data quality control.

---

## 3. Standard Genomics Analysis (`genomics-standard-analysis`)

### What it is for

Provides a comprehensive workflow for processing raw genomic sequences, from quality control to functional annotation.

### How to use it

- **Quality Control**: Use FastQC and Trimmomatic to clean and assess raw sequencing data.
- **Genome Assembly**: Use for choosing and running de novo or reference-guided assembly software (e.g., for short or long reads).
- **Gene Annotation**: Use for ab initio gene prediction and functional assignment (GO terms, pathways).

### What it is NOT for

- Specialized phylogenetic reconstruction (use `genomics-comparative-analysis`).
- Deep-dive variant interpretation and pathogenicity scoring.

---

## 4. Skill Creator (`skill-creator`)

### What it is for

A meta-skill designed to guide the development and maintenance of additional skills. It ensures consistency and effectiveness in how new capabilities are added to the system.

### How to use it

- **Planning**: Use it to understand how to structure a new skill with `SKILL.md` and bundled resources (scripts, references, assets).
- **Implementation**: Follow its core principles (conciseness, appropriate degrees of freedom) when writing instructions.
- **Packaging**: Use its guides to validate and package new skills for distribution.

### What it is NOT for

- Performing actual genomic analysis.
- Developing MCP servers (use `mcp-builder`).

---

## 5. MCP Builder (`mcp-builder`)

### What it is for

A comprehensive guide for creating high-quality Model Context Protocol (MCP) servers in Python or TypeScript.

### How to use it

- **Research**: Use it to study modern MCP design, protocol specs, and framework best practices.
- **Implementation**: Follow its phases for project setup, infrastructure implementation (API clients, error handling), and tool registration.
- **Testing**: Use it to learn how to use the MCP Inspector and create robust evaluations.

### What it is NOT for

- Using existing MCP tools (that is handled by the model naturally).
- Performing domain-specific analysis like genomics without the context of building a server.
