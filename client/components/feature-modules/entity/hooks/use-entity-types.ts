import { useAuth } from "@/components/provider/auth-context";
import { AuthenticatedQueryResult } from "@/lib/interfaces/interface";
import { useQuery } from "@tanstack/react-query";
import { EntityType } from "../interface/entity.interface";
import { EntityTypeService } from "../service/entity-type.service";

export function useEntityTypes(organisationId?: string): AuthenticatedQueryResult<EntityType[]> {
    const { session, loading } = useAuth();
    const query = useQuery({
        queryKey: ["entityTypes", organisationId],
        queryFn: async () => {
            return await EntityTypeService.getEntityTypes(session, organisationId!!); // non-null assertion as enabled ensures organisationId is defined
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!session && !!organisationId && !loading,
        refetchOnWindowFocus: false,
        gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    });

    return {
        isLoadingAuth: loading,
        ...query,
    };
}

export function useBlockTypeByKey(
    key: string,
    organisationId: string
): AuthenticatedQueryResult<EntityType> {
    const { session, loading } = useAuth();
    const query = useQuery({
        queryKey: ["entityType", key, organisationId],
        queryFn: async () => {
            return await EntityTypeService.getEntityTypeByKey(session, organisationId, key);
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
        enabled: !!key && !!organisationId && !!session && !loading,
        refetchOnWindowFocus: false,
        gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    });

    return {
        isLoadingAuth: loading,
        ...query,
    };
}
