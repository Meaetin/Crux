import type { UnitSystem } from '$lib/db/schema';

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function cmToFeetInches(cm: number): { ft: number; inches: number } {
  const totalInches = cm / CM_PER_IN;
  const ft = Math.floor(totalInches / 12);
  const inches = totalInches - ft * 12;
  return { ft, inches };
}

export function feetInchesToCm(ft: number, inches: number): number {
  return (ft * 12 + inches) * CM_PER_IN;
}

export function formatWeight(kg: number | null, system: UnitSystem): string {
  if (kg == null) return '—';
  const value = system === 'metric' ? kg : kgToLb(kg);
  return `${value.toFixed(1)} ${system === 'metric' ? 'kg' : 'lb'}`;
}

export function formatHeight(cm: number | null, system: UnitSystem): string {
  if (cm == null) return '—';
  if (system === 'metric') return `${Math.round(cm)} cm`;
  const { ft, inches } = cmToFeetInches(cm);
  return `${ft}'${Math.round(inches)}"`;
}

export function computeBmi(weightKg: number | null, heightCm: number | null): number | null {
  if (weightKg == null || heightCm == null || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function bmiCategory(bmi: number | null): string {
  if (bmi == null) return '—';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Healthy';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export function weightLabelFor(system: UnitSystem): string {
  return system === 'metric' ? 'kg' : 'lb';
}
