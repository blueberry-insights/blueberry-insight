# Changelog - Ajout du responsable d'offre

**Date** : 2025-01-08  
**Feature** : Séparation créateur/responsable d'offre

## Résumé

Ajout de la gestion du responsable d'offre (`responsible_user_id`) séparé du créateur (`created_by`) pour permettre plus tard l'assignation d'une offre à un autre membre de l'organisation.

## Fichiers modifiés

### 1. Base de données
✅ **Nouveau fichier** : `supabase/migrations/20250108_add_responsible_user_to_offers.sql`
- Ajout de la colonne `responsible_user_id uuid references auth.users(id)`
- Migration des données : `responsible_user_id` = `created_by` pour les offres existantes
- Commentaires de documentation

### 2. Types Supabase
✅ **Modifié** : `src/infra/supabase/types/Database.ts`
- `Row` : Ajout de `responsible_user_id: string | null`
- `Insert` : Ajout de `responsible_user_id?: string | null`
- `Update` : Ajout de `responsible_user_id: string | null`

### 3. Domain Model
✅ **Modifié** : `src/core/models/Offer.ts`
- Type `Offer` : Ajout de `createdBy: string | null`
- Type `Offer` : Ajout de `responsibleUserId: string | null`

### 4. Ports
✅ **Modifié** : `src/core/ports/OfferRepo.ts`
- `CreateOfferInput` : Ajout de `createdBy: string` (obligatoire)
- `CreateOfferInput` : Ajout de `responsibleUserId: string` (obligatoire)

### 5. Adapter Supabase
✅ **Modifié** : `src/infra/supabase/adapters/offer.repo.supabase.ts`
- `getById()` : Ajout de `created_by` et `responsible_user_id` dans le select + mapping
- `create()` : 
  - Destructuration de `createdBy` et `responsibleUserId`
  - Insertion de `created_by` et `responsible_user_id`
  - Ajout dans le select de retour + mapping
- `update()` : Ajout de `created_by` et `responsible_user_id` dans le select + mapping

### 6. Use Case
✅ **Modifié** : `src/core/usecases/offers/createOffer.ts`
- `OfferSchema` : Ajout de la validation Zod pour `createdBy` et `responsibleUserId` (UUID obligatoires)
- Mapping vers `CreateOfferInput`

### 7. Action serveur
✅ **Modifié** : `src/app/(app)/offers/actions.ts`
- `createOfferAction` : 
  - Ajout de `createdBy: ctx.userId`
  - Ajout de `responsibleUserId: ctx.userId`
  - Commentaire explicatif

### 8. Documentation
✅ **Nouveau fichier** : `docs/OFFERS_RESPONSIBILITY.md`
- Documentation complète de la feature
- Plan d'évolution pour le multi-user
- Exemples de code futur

## Comportement

### Avant
- Une offre était créée avec seulement `created_by`
- Pas de notion de responsable distinct

### Après
- Une offre est créée avec :
  - `created_by` = user qui a créé (audit, jamais modifié)
  - `responsible_user_id` = user responsable (= créateur pour l'instant, modifiable plus tard)
- Les anciennes offres ont été migrées avec `responsible_user_id` = `created_by`

### UI
- **Aucun changement visible** pour l'utilisateur
- Pas de select "Responsable" dans les formulaires (pour l'instant)
- Les champs sont automatiquement remplis avec `ctx.userId`

## Tests de vérification

```sql
-- Vérifier qu'une nouvelle offre a bien les deux champs
SELECT id, title, created_by, responsible_user_id 
FROM offers 
WHERE org_id = 'your-org-id'
ORDER BY created_at DESC 
LIMIT 1;

-- Vérifier que les anciennes offres ont été migrées
SELECT 
  COUNT(*) as total,
  COUNT(responsible_user_id) as with_responsible,
  COUNT(CASE WHEN responsible_user_id = created_by THEN 1 END) as matching
FROM offers;
```

## Build & Linter

✅ Aucune erreur TypeScript  
✅ Aucune erreur de linter  
✅ Tous les types sont cohérents

## Préparation pour le futur

Le code est maintenant prêt pour :
1. Ajouter un select "Responsable" dans `CreateOfferModal` et `UpdateOfferModal`
2. Lister les membres de l'org via `user_organizations`
3. Permettre le changement de `responsible_user_id` via `updateOffer`
4. Filtrer "Mes offres" vs "Toutes les offres de l'org"

## Notes

- La RLS existante (basée sur `org_id`) continue de fonctionner
- Compatibilité ascendante : les anciennes offres fonctionnent toujours
- Pas d'impact sur les performances (champs indexables si besoin)
