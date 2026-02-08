---
name: genomics-variant-analysis
description: Standard protocol for variant discovery, including read alignment, variant calling, and functional interpretation. Use when identifying SNPs, indels, or structural variants in genomic data.
---

# Genomic Variant Analysis

## Overview

This skill provides a best-practices protocol for identifying and interpreting genomic variants from high-throughput sequencing data.

## Protocol

### 1. Pre-processing

1. **Align reads to reference genome** using BWA-MEM or Bowtie2.
2. **Remove duplicates** with Picard MarkDuplicates or SAMtools to avoid PCR artifacts.
3. **Base quality score recalibration (BQSR)** using GATK to correct for systematic errors in base quality scores.

### 2. Variant Calling

1. **Identify SNPs and indels** using GATK HaplotypeCaller or DeepVariant.
2. **Apply hard filtering criteria** (e.g., QD < 2.0, FS > 60.0) or VQSR (Variant Quality Score Recalibration) to remove false positives.
3. **Annotate variants** with functional impact using tools like SnpEff, VEP (Variant Effect Predictor), or ANNOVAR.

### 3. Interpretation

1. **Filter by population frequency** using databases like gnomAD or 1000 Genomes to prioritize rare variants.
2. **Assess pathogenicity scores** (e.g., CADD, PolyPhen-2, SIFT) for non-synonymous variants.
3. **Check conservation** across species using GERP++ or PhyloP scores to identify evolutionary constrained sites.
