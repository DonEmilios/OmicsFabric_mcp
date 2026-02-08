---
name: genomics-comparative-analysis
description: Methods for comparing genomes across species, including ortholog identification, genome alignment, and evolutionary analysis. Use when studying evolutionary relationships, conserved regions, or gene family evolution.
---

# Comparative Genomics

## Overview

This skill provides methods and workflows for comparing genomic sequences across different species or strains to understand evolutionary relationships and identify conserved functional elements.

## Workflow

### 1. Ortholog Identification

1. **Use reciprocal BLAST hits (RBH)** to identify candidate orthologous gene pairs.
2. **Apply phylogenetic criteria**: Construct gene trees to distinguish orthologs from paralogs.
3. **Validate with synteny analysis**: Check if gene order is conserved across species to support orthology.

### 2. Genome Alignment

1. **Perform multiple genome alignment** using tools like progressiveMauve or Mugsy.
2. **Identify conserved regions**: Use PhastCons or gerp++ to find genomic regions with high evolutionary conservation.
3. **Detect rearrangements**: Identify inversions, translocations, and large-scale insertions/deletions.

### 3. Evolutionary Analysis

1. **Calculate dN/dS ratios** (nonsynonymous to synonymous substitution rates) using PAML or HyPhy to detect selective pressures.
2. **Identify positively selected genes**: Search for genes showing evidence of adaptive evolution.
3. **Reconstruct gene family evolution**: Use tools like CAFE to model gene gain and loss across a phylogeny.
