import { useWorkspace } from "@/components/feature-modules/workspace/hooks/use-workspace";
import { EntityTypeRelationshipType } from "@/lib/types/types";
import { EntityRelationshipCandidate, EntityType } from "../../../interface/entity.interface";
import { useEntityTypes } from "./use-entity-types";

interface UseRelationshipCandidatesReturn {
    loading: boolean;
    candidates: EntityRelationshipCandidate[];
}

/**
 * This hook will fetch all current relationships for every workspace entity type that is considered polymorphic. So is a viable candidate for a new entity type to be linked to.
 */
export function useRelationshipCandidates(type: EntityType): UseRelationshipCandidatesReturn {
    const { data: workspace } = useWorkspace();
    const { data } = useEntityTypes(workspace?.id);
    if (!data)
        return {
            loading: true,
            candidates: [],
        };

    // Fitler out all unreferenced polymorphic relationships, or current relationship definitions that support the given entity type but does not yet reference it bidirectionally
    return {
        loading: false,
        candidates: data.flatMap((et) => {
            if (!et.relationships) return [];
            return et.relationships
                .filter(
                    (def) =>
                        (def.allowPolymorphic || def.entityTypeKeys?.includes(type.key)) &&
                        def.relationshipType === EntityTypeRelationshipType.ORIGIN &&
                        def.bidirectional &&
                        !def.bidirectionalEntityTypeKeys?.includes(type.key)
                )
                .map((rel) => ({
                    name: et.name.singular,
                    key: et.key,
                    icon: et.icon,
                    existingRelationship: rel,
                }));
        }),
    };
}
