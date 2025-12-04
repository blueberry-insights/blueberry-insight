# Gestion des responsabilités sur les offres

## Contexte

Ce document explique la séparation entre le créateur (`created_by`) et le responsable (`responsible_user_id`) d'une offre.

## Champs

### `created_by`
- **Type** : `uuid` (référence `auth.users`)
- **Usage** : Champ d'audit, identifie qui a créé l'offre
- **Modifiable** : **NON**, jamais modifié après création
- **Initialisation** : Automatique via `ctx.userId` lors de la création

### `responsible_user_id`
- **Type** : `uuid` (référence `auth.users`)
- **Usage** : Champ métier, identifie qui est responsable de l'offre
- **Modifiable** : **OUI**, peut être changé plus tard (assignation à un autre membre)
- **Initialisation** : Pour l'instant = `ctx.userId` (même que `created_by`)

## Implémentation actuelle

### Comportement
1. **À la création d'une offre** :
   - `created_by` = user connecté (`ctx.userId`)
   - `responsible_user_id` = user connecté (`ctx.userId`)
   - Pas de choix dans l'UI (mono-user par org pour l'instant)

2. **Anciennes offres** :
   - Migration SQL : `responsible_user_id` initialisé avec `created_by`

### Fichiers modifiés

#### 1. Base de données
- **Migration** : `supabase/migrations/20250108_add_responsible_user_to_offers.sql`
  - Ajout de la colonne `responsible_user_id`
  - Initialisation des données existantes

#### 2. Types
- **Database.ts** : Ajout dans `Row`, `Insert`, `Update`
- **Offer.ts** : Ajout de `createdBy` et `responsibleUserId`
- **OfferRepo.ts** : Ajout dans `CreateOfferInput`

#### 3. Infrastructure
- **offer.repo.supabase.ts** :
  - `getById` : select + mapping des nouveaux champs
  - `create` : insertion + mapping des nouveaux champs
  - `update` : select + mapping des nouveaux champs

#### 4. Use cases
- **createOffer.ts** : Validation Zod + mapping des champs obligatoires

#### 5. Actions
- **offers/actions.ts** :
  - `createOfferAction` : Ajout de `createdBy` et `responsibleUserId` = `ctx.userId`

## Future évolution

### Multi-users par organisation

Quand il y aura plusieurs membres par org :

1. **UI** : Ajouter un select "Responsable" dans :
   - `CreateOfferModal` (optionnel, défaut = user connecté)
   - `UpdateOfferModal` (pour réassigner)

2. **Backend** :
   - Lister les membres via `user_organizations`
   - Valider que le `responsibleUserId` est bien membre de l'org
   - `created_by` reste inchangé, seul `responsible_user_id` peut être modifié

3. **Use case updateOffer** :
   - Ajouter `responsibleUserId?: string` dans `UpdateOfferInput`
   - Permettre le changement de responsable

### Exemple de code futur

```tsx
// Dans UpdateOfferModal
const [members, setMembers] = useState<Member[]>([]);

// Select responsable
<Select
  value={values.responsibleUserId}
  onValueChange={(v) => set("responsibleUserId", v)}
>
  <SelectTrigger>
    <SelectValue placeholder="Choisir un responsable" />
  </SelectTrigger>
  <SelectContent>
    {members.map((member) => (
      <SelectItem key={member.userId} value={member.userId}>
        {member.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

## Notes techniques

- **RLS** : La politique de sécurité reste basée sur `org_id` (inchangé)
- **Audit** : `created_by` permet de tracer qui a créé l'offre
- **Ownership** : `responsible_user_id` permet de filtrer "mes offres" vs "toutes les offres de l'org"

## Tests

Pour vérifier que tout fonctionne :

1. Créer une nouvelle offre via l'UI
2. Vérifier en DB :
   ```sql
   SELECT id, title, created_by, responsible_user_id 
   FROM offers 
   WHERE org_id = 'xxx'
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
3. Les deux champs doivent contenir le même UUID (user connecté)

## Critères d'acceptation ✅

- [x] Migration DB exécutée et données migrées
- [x] Types mis à jour sans erreurs TypeScript
- [x] Domain model `Offer` contient `createdBy` et `responsibleUserId`
- [x] Repo inclut ces champs dans tous les selects/inserts
- [x] Use case `createOffer` accepte et valide ces champs
- [x] Action `createOfferAction` passe automatiquement `ctx.userId`
- [x] Comportement UI inchangé (pas de select responsable)
- [x] Build TypeScript passe sans erreurs
