import { makeDOLRequest } from "./dol.js";
import { DOLDataset, PaginationMeta } from "../types.js";

export async function handleListDatasets({ page }: { page?: number } = {}) {
  const response = await makeDOLRequest<any>("/datasets", {
    page: String(page ?? 1),
  });

  if (!response) {
    return { error: "Failed to fetch datasets from DOL API" };
  }

  try {
    const datasets: DOLDataset[] = (response.datasets || []).map((item: any) => ({
      name: item.name || "",
      agency: item.agency?.abbr || "",
      endpoint: item.api_url || "",
      description: item.description || "",
      category: item.category_name || "",
      frequency: item.frequency || "",
      tags: item.tag_list || [],
      updated_at: item.updated_at || "",
    }));

    const pagination: PaginationMeta = {
      current_page: response.meta?.current_page ?? 1,
      next_page: response.meta?.next_page ?? null,
      prev_page: response.meta?.prev_page ?? null,
      total_pages: response.meta?.total_pages ?? 1,
      total_count: response.meta?.total_count ?? datasets.length,
    };

    return { datasets, pagination };
  } catch (error) {
    console.error("Error mapping datasets:", error);
    return { error: "Failed to parse datasets response" };
  }
}

export async function handleGetMetadata({
  agency,
  endpoint,
  format,
}: {
  agency: string;
  endpoint: string;
  format?: string;
}) {
  const response = await makeDOLRequest<any>(
    `/get/${agency}/${endpoint}/${format ?? "json"}/metadata`
  );

  if (!response) {
    return { error: `Failed to fetch metadata for ${agency}/${endpoint}` };
  }

  return response;
}

export async function handleQueryData({
  agency,
  endpoint,
  format,
  limit,
  offset,
  fields,
  sort,
  sort_by,
  filter_object,
}: {
  agency: string;
  endpoint: string;
  format?: string;
  limit?: number;
  offset?: number;
  fields?: string;
  sort?: string;
  sort_by?: string;
  filter_object?: string;
}) {
  const params: Record<string, string> = {};

  if (limit !== undefined) params.limit = String(limit);
  if (offset !== undefined) params.offset = String(offset);
  if (fields) params.fields = fields;
  if (sort) params.sort = sort;
  if (sort_by) params.sort_by = sort_by;
  if (filter_object) params.filter_object = filter_object;

  const response = await makeDOLRequest<any>(
    `/get/${agency}/${endpoint}/${format ?? "json"}`,
    params
  );

  if (!response) {
    return { error: `Failed to query data from ${agency}/${endpoint}` };
  }

  return response;
}
