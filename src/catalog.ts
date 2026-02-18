import datasetsJson from "./data/datasets.json" assert { type: "json" };

interface Dataset {
  name: string;
  agency: string;
  endpoint: string;
  description: string;
  tags: string[];
}

const datasets: Dataset[] = datasetsJson as Dataset[];

/**
 * Generate the dataset catalog in TOON format for inclusion in system prompt.
 * TOON format is more compact than markdown, reducing token usage by ~50%.
 *
 * Format: agency/endpoint|name|description|tags
 */
export function getDatasetCatalog(): string {
  let catalog = "## Available DOL Datasets\n\n";
  catalog += "Format: agency/endpoint|name|description|tags\n\n";

  for (const ds of datasets) {
    // Escape pipe characters in description if any
    const safeDescription = ds.description.replace(/\|/g, '\\|');
    const tags = ds.tags.length > 0 ? ds.tags.join(',') : '';

    catalog += `${ds.agency}/${ds.endpoint}|${ds.name}|${safeDescription}|${tags}\n`;
  }

  return catalog;
}

/**
 * Get list of all dataset endpoints for validation
 */
export function getAllEndpoints(): { agency: string; endpoint: string }[] {
  return datasets.map(ds => ({ agency: ds.agency, endpoint: ds.endpoint }));
}
