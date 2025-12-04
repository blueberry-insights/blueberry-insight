# Module Offres

Module de gestion des offres d'emploi avec pages de liste et de détails.

## Structure

```
offers/
├── components/
│   ├── filters/           # Filtres de recherche et tri
│   ├── modals/            # Modals CRUD
│   ├── screens/           # Pages principales
│   │   ├── OffersScreen.tsx          # Page liste
│   │   └── OfferDetailScreen.tsx     # Page détails
│   ├── sections/
│   │   └── details/       # Sections de la page détails
│   │       ├── OfferInfoSection.tsx
│   │       ├── OfferDescriptionSection.tsx
│   │       ├── OfferSalarySection.tsx
│   │       └── OfferCandidatesSection.tsx
│   ├── Table/             # Tableau des offres
│   └── ui/                # Composants UI réutilisables
```

## Pages

### `/offers` - Liste des offres
- Affichage en tableau avec filtres
- Recherche textuelle
- Filtrage par statut, type de contrat, mode de travail
- Tri par date
- Actions : Créer, Éditer, Supprimer

### `/offers/[id]` - Détails d'une offre
- Informations complètes de l'offre
- Liste des candidats associés (cliquables)
- Statistiques
- Actions rapides (édition, duplication, archivage)

## Composants principaux

### OfferDetailScreen
Page de détails d'une offre avec layout deux colonnes :
- **Colonne gauche** : Infos générales, description, rémunération
- **Colonne droite** : Candidats associés, actions rapides, statistiques

### OfferCandidatesSection
Liste des candidats associés à l'offre avec :
- Avatar et informations du candidat
- Badge de statut
- Lien vers la page détails du candidat
- Compteur de candidats

## Navigation

- Cliquer sur une offre dans le tableau → Page détails de l'offre
- Cliquer sur un candidat dans la page offre → Page détails du candidat
- Cohérence avec le module Candidats

## Hook réutilisé

Utilise `useFilters` du dossier `src/shared/hooks/` pour la gestion des filtres (partagé avec le module Candidats).
