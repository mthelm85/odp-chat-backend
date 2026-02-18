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
 * Generate the dataset catalog text for inclusion in system prompt
 */
export function getDatasetCatalog(): string {
  // Group datasets by agency
  const byAgency = datasets.reduce((acc, ds) => {
    if (!acc[ds.agency]) {
      acc[ds.agency] = [];
    }
    acc[ds.agency].push(ds);
    return acc;
  }, {} as Record<string, Dataset[]>);

  // Build catalog text
  let catalog = "## Available DOL Datasets\n\n";

  for (const [agency, agencyDatasets] of Object.entries(byAgency)) {
    catalog += `### ${agency} (${agencyDatasets.length} datasets)\n\n`;

    for (const ds of agencyDatasets) {
      catalog += `**${ds.name}** (${agency}/${ds.endpoint})\n`;
      catalog += `${ds.description}\n`;
      if (ds.tags.length > 0) {
        catalog += `Tags: ${ds.tags.join(", ")}\n`;
      }
      catalog += `\n`;
    }
  }

  return catalog;
}

/**
 * Get list of all dataset endpoints for validation
 */
export function getAllEndpoints(): { agency: string; endpoint: string }[] {
  return datasets.map(ds => ({ agency: ds.agency, endpoint: ds.endpoint }));
}
