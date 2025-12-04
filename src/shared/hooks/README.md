# Hooks Partagés

## `useFilters`

Hook réutilisable pour gérer les filtres, la recherche et le tri de listes d'éléments.

### Utilisation

```typescript
import { useFilters } from "@/shared/hooks/useFilters";

type MyFilters = {
  status: string;
  category: string;
};

const { filterState, updateFilter, filteredItems } = useFilters<MyFilters, MyItem>(
  items,
  {
    initialState: {
      search: "",
      status: "all",
      category: "all",
      sortBy: "date_desc",
    },
  },
  {
    searchFields: (item) => [item.name, item.description],
    customFilters: (item, filters) => {
      if (filters.status !== "all" && item.status !== filters.status) {
        return false;
      }
      return true;
    },
    sortGetter: (item) => item.createdAt,
  }
);
```

### Paramètres

- **items**: `Item[]` - Liste des éléments à filtrer
- **config**: Configuration avec l'état initial
  - `initialState`: État initial des filtres (doit inclure `search` et `sortBy`)
- **options**: Options de filtrage
  - `searchFields`: Fonction retournant les champs à rechercher
  - `customFilters`: Fonction de filtrage personnalisée
  - `sortGetter`: Fonction retournant la valeur de tri (défaut: `item.createdAt`)

### Retour

- **filterState**: État actuel des filtres
- **updateFilter**: Fonction pour mettre à jour un filtre
- **resetFilters**: Fonction pour réinitialiser tous les filtres
- **filteredItems**: Liste des éléments filtrés et triés

### Exemples d'utilisation

#### Offres
```typescript
const { filterState, updateFilter, filteredItems: filteredOffers } = useFilters<
  { status: string; contractType: string; remote: string },
  OfferListItem
>(offers, config, options);
```

#### Candidats
```typescript
const { filterState, updateFilter, filteredItems: filteredCandidates } = useFilters<
  { status: string; offerId: string },
  CandidateListItem
>(candidates, config, options);
```
