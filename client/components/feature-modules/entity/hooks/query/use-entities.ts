import { useAuth } from "@/components/provider/auth-context";
import { AuthenticatedQueryResult } from "@/lib/interfaces/interface";
import { useQuery } from "@tanstack/react-query";
import { Entity } from "../../interface/entity.interface";
import { EntityService } from "../../service/entity.service";

export function useEntity(
    organisationId: string,
    entityTypeKey: string
): AuthenticatedQueryResult<Entity[]> {
    const { session, loading } = useAuth();
    const query = useQuery({
        queryKey: ["entities", organisationId, entityTypeKey],
        queryFn: async () => {
            return await EntityService.getEntitiesForType(session, organisationId, entityTypeKey);
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!session && !!organisationId && !!entityTypeKey && !loading,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    });

    return {
        isLoadingAuth: loading,
        ...query,
    };
}



