/**
 * Default package pricing from EVO-Gaming-Rental-PS4-Planning.md §7.
 *
 * The admin dashboard can add, remove, and reprice packages; the resulting set
 * is stored in `business_settings` (key `packages`). These constants are the
 * fallback when no valid setting exists. Opening hours (10:00–24:00) cap a
 * single session at 14 hours.
 */
export const MAX_PACKAGE_HOURS = 14;

export type PackagePlan = {
  code: string;
  hours: number;
  price: number;
  label: string;
};

export function packageCode(hours: number): string {
  return `PKG${hours}`;
}

export function packageLabel(hours: number): string {
  return `${hours} jam`;
}

export const DEFAULT_PACKAGES: readonly PackagePlan[] = [
  { code: packageCode(1), hours: 1, price: 10000, label: packageLabel(1) },
  { code: packageCode(3), hours: 3, price: 25000, label: packageLabel(3) },
  { code: packageCode(4), hours: 4, price: 35000, label: packageLabel(4) },
];

export function findPackageByHours(
  packages: readonly PackagePlan[],
  hours: number,
): PackagePlan | null {
  return packages.find((pkg) => pkg.hours === hours) ?? null;
}

export function findPackageByCode(
  packages: readonly PackagePlan[],
  code: string,
): PackagePlan | null {
  return packages.find((pkg) => pkg.code === code) ?? null;
}

export function formatRupiah(amount: number): string {
  return `Rp${new Intl.NumberFormat("id-ID").format(amount)}`;
}
