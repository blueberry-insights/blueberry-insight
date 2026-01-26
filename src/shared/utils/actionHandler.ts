/**
 * Helper générique pour les Server Actions
 * 
 * ⚠️ ATTENTION : Ce helper est conçu pour réduire la duplication de code
 * tout en préservant les règles métier. Il supporte des hooks pour les cas
 * particuliers (enrichissement, logique pré/post, etc.)
 * 
 * Si une action a une logique métier complexe unique, il est préférable
 * de garder l'implémentation manuelle plutôt que de forcer l'utilisation
 * de ce helper.
 */

import { ZodError } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionResult } from "../types/actionResult";
import { actionSuccess, actionError } from "../types/actionResult";
import { logActionError } from "../utils/logger";

type AuthContext = {
  sb: SupabaseClient;
  userId: string;
  orgId: string;
  role: string;
};

/**
 * Options pour personnaliser le comportement du handler
 */
export type ActionHandlerOptions<
  TInput,
  TOutput,
  TRepo = unknown,
  TTransformedOutput = TOutput
> = {
  /**
   * Nom de l'action (pour les logs d'erreur)
   */
  actionName: string;

  /**
   * Message d'erreur générique si le usecase échoue
   */
  errorMessage: string;

  /**
   * Fonction pour mapper FormData vers l'input du usecase
   * Doit inclure orgId depuis le contexte
   */
  mapInput: (formData: FormData, ctx: AuthContext) => TInput;

  /**
   * Factory pour créer le usecase depuis le repo
   */
  makeUsecase: (repo: TRepo) => (input: TInput) => Promise<TOutput>;

  /**
   * Factory pour créer le repo depuis le Supabase client
   */
  makeRepo: (sb: SupabaseClient) => TRepo;

  /**
   * Hook optionnel appelé AVANT le usecase
   * Permet de faire des vérifications préalables ou de la logique métier
   * Si retourne une erreur, le usecase n'est pas appelé
   */
  beforeUsecase?: (ctx: AuthContext, input: TInput) => Promise<ActionResult<TTransformedOutput> | null>;

  /**
   * Hook optionnel appelé APRÈS le usecase avec succès
   * Permet d'enrichir les données ou de faire des transformations
   * Le résultat retourné remplace le résultat du usecase
   */
  afterUsecase?: (
    ctx: AuthContext,
    input: TInput,
    output: TOutput
  ) => Promise<TTransformedOutput>;

  /**
   * Hook optionnel pour transformer le résultat final
   * Utile pour convertir le output du usecase en format attendu par l'action
   * Peut changer complètement la structure du résultat (ex: { ok: true, candidate } au lieu de { ok: true, data })
   * 
   * Le type de retour doit être compatible avec ActionResult mais peut avoir une structure différente
   */
  transformResult?: (output: TTransformedOutput) => 
    | { ok: true; [key: string]: unknown }
    | { ok: false; error: string };

  /**
   * Handler d'erreur personnalisé
   * Si fourni, remplace le handler d'erreur par défaut
   */
  onError?: (err: unknown, ctx: AuthContext, actionName: string) => ActionResult<TTransformedOutput>;
};

/**
 * Crée un handler d'action générique qui :
 * 1. Wrappe avec withAuth
 * 2. Mappe FormData vers input
 * 3. Appelle beforeUsecase si fourni
 * 4. Crée repo + usecase
 * 5. Appelle le usecase
 * 6. Appelle afterUsecase si fourni
 * 7. Transforme le résultat si nécessaire
 * 8. Gère les erreurs (ZodError et autres)
 */
export function createActionHandler<
  TInput,
  TOutput,
  TRepo = unknown,
  TTransformedOutput = TOutput
>(options: ActionHandlerOptions<TInput, TOutput, TRepo, TTransformedOutput>) {
  const {
    actionName,
    errorMessage,
    mapInput,
    makeUsecase,
    makeRepo,
    beforeUsecase,
    afterUsecase,
    transformResult,
    onError,
  } = options;

  return async (formData: FormData): Promise<ActionResult<TTransformedOutput>> => {
    const { withAuth } = await import("@/infra/supabase/session");

    return withAuth(async (ctx) => {
      try {
        // 1. Mapper FormData vers input
        const input = mapInput(formData, ctx);

        // 2. Hook pré-usecase (vérifications, logique métier préalable)
        if (beforeUsecase) {
          const preResult = await beforeUsecase(ctx, input);
          if (preResult) {
            // Si beforeUsecase retourne un résultat, on l'utilise directement
            // (cas où on veut court-circuiter le usecase)
            return preResult;
          }
        }

        // 3. Créer repo et usecase
        const repo = makeRepo(ctx.sb);
        const usecase = makeUsecase(repo);

        // 4. Appeler le usecase
        const output = await usecase(input);

        // 5. Hook post-usecase (enrichissement, transformations)
        let finalOutput: TTransformedOutput;
        if (afterUsecase) {
          finalOutput = await afterUsecase(ctx, input, output);
        } else {
          // Si pas de transformation, on assume que TTransformedOutput = TOutput
          finalOutput = output as TTransformedOutput;
        }

        // 6. Transformer le résultat final si nécessaire
        if (transformResult) {
          // transformResult peut changer complètement la structure du résultat
          // (ex: { ok: true, candidate } au lieu de { ok: true, data })
          return transformResult(finalOutput) as ActionResult<TTransformedOutput>;
        }

        // Par défaut, on retourne le format standard { ok: true, data: ... }
        return actionSuccess(finalOutput) as ActionResult<TTransformedOutput>;
      } catch (err) {
        // Gestion d'erreur personnalisée
        if (onError) {
          return onError(err, ctx, actionName);
        }

        // Gestion d'erreur par défaut
        if (err instanceof ZodError) {
          const issue = err.issues.at(0);
          return actionError(issue?.message ?? "Données invalides") as ActionResult<TTransformedOutput>;
        }

        // Log l'erreur de manière sécurisée
        logActionError(actionName, err, {
          userId: ctx.userId,
          orgId: ctx.orgId,
        });
        return actionError(errorMessage) as ActionResult<TTransformedOutput>;
      }
    });
  };
}
