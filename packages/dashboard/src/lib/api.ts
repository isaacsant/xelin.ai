const API_URL = process.env.XELIN_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const API_KEY = process.env.XELIN_API_KEY ?? "";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...options?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────

export interface Brand {
  id: string;
  name: string;
  domain: string | null;
  description: string | null;
  createdAt: string;
  facts: Array<{ id: string; category: string; key: string; value: string }>;
  competitors: Array<{ id: string; name: string; domain: string | null }>;
}

export interface VisibilityData {
  brandId: string;
  brandName: string;
  visibilityScore: number;
  totalChecks: number;
  mentionedCount: number;
  history: Array<{
    date: string;
    provider: string;
    model: string;
    isMentioned: boolean;
    position: number | null;
    sentiment: number | null;
  }>;
}

export interface HallucinationData {
  brandId: string;
  brandName: string;
  total: number;
  hallucinations: Array<{
    id: string;
    claim: string;
    expectedValue: string | null;
    actualValue: string | null;
    severity: "low" | "medium" | "high" | "critical";
    description: string | null;
    provider: string;
    model: string;
    checkDate: string;
  }>;
}

export interface CheckResult {
  id: string;
  provider: string;
  model: string;
  status: string;
  responseText: string | null;
  latencyMs: number | null;
  createdAt: string;
  prompt: { text: string; category: string };
  mentions: Array<{
    brandName: string;
    isMentioned: boolean;
    position: number | null;
    sentimentScore: number | null;
    sentimentLabel: string | null;
  }>;
  citations: Array<{
    url: string;
    domain: string;
    isBrandUrl: boolean;
  }>;
  hallucinations: Array<{
    claim: string;
    expectedValue: string | null;
    actualValue: string | null;
    severity: string;
    description: string | null;
  }>;
}

// ─── API Functions ───────────────────────────────────────────────────

export async function getBrands(): Promise<Brand[]> {
  return apiFetch<Brand[]>("/brands");
}

export async function getBrand(id: string): Promise<Brand> {
  return apiFetch<Brand>(`/brands/${id}`);
}

export async function getVisibility(brandId: string): Promise<VisibilityData> {
  return apiFetch<VisibilityData>(`/brands/${brandId}/visibility`);
}

export async function getHallucinations(
  brandId: string
): Promise<HallucinationData> {
  return apiFetch<HallucinationData>(`/brands/${brandId}/hallucinations`);
}

export async function getChecks(brandId: string): Promise<CheckResult[]> {
  return apiFetch<CheckResult[]>(`/checks/${brandId}`);
}
