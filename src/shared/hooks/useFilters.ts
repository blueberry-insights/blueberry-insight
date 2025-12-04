import { useState, useMemo, useCallback } from "react";

export type SortBy = "date_desc" | "date_asc";

export type BaseFilterState<T extends Record<string, unknown> = Record<string, unknown>> = T & {
  search: string;
  sortBy: SortBy;
};

type FilterConfig<T> = {
  initialState: BaseFilterState<T>;
};

type FilterOptions<T, Item> = {
  searchFields?: (item: Item) => string[];
  customFilters?: (item: Item, filters: BaseFilterState<T>) => boolean;
  sortGetter?: (item: Item) => string;
};

/**
 * Hook réutilisable pour gérer les filtres, la recherche et le tri
 * @param items - Liste des éléments à filtrer
 * @param config - Configuration avec l'état initial des filtres
 * @param options - Options de filtrage et de tri
 */
export function useFilters<T extends Record<string, unknown>, Item>(
  items: Item[],
  config: FilterConfig<T>,
  options: FilterOptions<T, Item> = {}
) {
  const [filterState, setFilterState] = useState<BaseFilterState<T>>(
    config.initialState
  );

  const updateFilter = useCallback(
    <K extends keyof BaseFilterState<T>>(
      key: K,
      value: BaseFilterState<T>[K]
    ) => {
      setFilterState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilterState(config.initialState);
  }, [config.initialState]);

  const filteredItems = useMemo(() => {
    const searchTerm = filterState.search.trim().toLowerCase();

    let result = items.filter((item) => {
      if (searchTerm.length > 0 && options.searchFields) {
        const haystack = options.searchFields(item)
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(searchTerm)) return false;
      }

      if (options.customFilters) {
        return options.customFilters(item, filterState);
      }

      return true;
    });

    const sortGetter = options.sortGetter || ((item: Item) => (item as Record<string, unknown>).createdAt as string ?? "");
    
    result = [...result].sort((a, b) => {
      const da = sortGetter(a);
      const db = sortGetter(b);
      
      if (filterState.sortBy === "date_desc") {
        return da < db ? 1 : da > db ? -1 : 0;
      }
      return da < db ? -1 : da > db ? 1 : 0;
    });

    return result;
  }, [items, filterState, options]);

  return {
    filterState,
    updateFilter,
    resetFilters,
    filteredItems,
  };
}
