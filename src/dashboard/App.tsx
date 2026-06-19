// src/dashboard/App.tsx
// Created: 2026-06-19
// Smart Asset Management Platform – TypeScript module

export interface DataRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export function formatId(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '-');
}

export function validateRecord(record: unknown): record is DataRecord {
  if (!record || typeof record !== 'object') return false;
  const r = record as Record<string, unknown>;
  return typeof r.id === 'string' && r.createdAt instanceof Date;
}
