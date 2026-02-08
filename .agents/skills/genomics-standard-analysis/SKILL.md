---
name: genomics-standard-analysis
description: Complete workflow for genomic sequence analysis, covering quality control, genome assembly, and gene annotation. Use when analyzing raw genomic sequences or assembly tasks.
---

# Standard Genomics Analysis

## Overview

This skill provides a comprehensive workflow for genomic sequence analysis, ensuring high-quality data processing from raw reads to functional annotation.

## Workflow

### 1. Quality Control

1. **Check sequence quality** using tools like FastQC to identify potential issues (e.g., adapter contamination, low-quality bases).
2. **Remove adapters and low-quality bases** using Trimmomatic or Cutadapt.
3. **Assess contamination levels** by screening against common contaminants (e.g., PhiX, adapter sequences).

### 2. Genome Assembly

1. **Choose appropriate assembly software** based on:
   - **Read length**: Short reads (Illumina) vs. Long reads (PacBio, ONT).
   - **Genome size and complexity**: De novo assembly vs. reference-guided.
   - **Resources**: Memory and CPU availability.
2. **Evaluate assembly quality** with QUAST (Quality Assessment Tool for Genome Assemblies).
3. **Generate assembly statistics**: N50, total length, number of contigs.

### 3. Gene Annotation

1. **Run ab initio gene prediction** (e.g., AUGUSTUS, GeneMark).
2. **Align known proteins** for homology-based evidence.
3. **Integrate RNA-seq data** (if available) to support gene models.
4. **Functional annotation**: Assign GO terms and biological pathways using tools like EggNOG-mapper or InterProScan.
