export type FipeModelOption = {
  code: string;
  name: string;
};

export type FipeYearFuelOption = {
  value: string;
  label: string;
  year: number;
  year_label: string;
  fuel: {
    code: string;
    name: string;
  };
  models: FipeModelOption[];
};

export type FipeBrand = {
  code: string;
  name: string;
  model_catalog: FipeModelOption[];
  year_fuel_options: FipeYearFuelOption[];
};

export type FipeCatalog = {
  brands: FipeBrand[];
};

let catalogPromise: Promise<FipeCatalog> | null = null;

export async function loadFipeCatalog() {
  catalogPromise ??= fetch("/fipe_cars_tree.json").then((response) => {
    if (!response.ok) {
      throw new Error("Catalogo FIPE indisponivel.");
    }
    return response.json() as Promise<FipeCatalog>;
  });

  return catalogPromise;
}

export function findFipeBrand(catalog: FipeCatalog | null, value: string) {
  const normalizedValue = normalizeFipeText(value);
  if (!normalizedValue) {
    return undefined;
  }

  return catalog?.brands.find((brand) => normalizeFipeText(brand.name) === normalizedValue || brand.code === value);
}

export function findFipeModel(models: FipeModelOption[], value: string) {
  const normalizedValue = normalizeFipeText(value);
  if (!normalizedValue) {
    return undefined;
  }

  return models.find((model) => normalizeFipeText(model.name) === normalizedValue || model.code === value);
}

export function getFipeYearFuelOptions(brand?: FipeBrand) {
  return [...(brand?.year_fuel_options ?? [])].sort((first, second) => second.year - first.year || first.label.localeCompare(second.label));
}

export function getFipeModelsForYearFuel(brand: FipeBrand | undefined, yearFuelValue: string) {
  const selectedYearFuel = brand?.year_fuel_options.find((option) => option.value === yearFuelValue);
  return selectedYearFuel?.models ?? brand?.model_catalog ?? [];
}

function normalizeFipeText(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}
