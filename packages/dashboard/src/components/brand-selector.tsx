"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface BrandSelectorProps {
  brands: Array<{ id: string; name: string }>;
  selectedId: string;
}

export function BrandSelector({ brands, selectedId }: BrandSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("brand", e.target.value);
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <select
      value={selectedId}
      onChange={handleChange}
      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {brands.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  );
}
