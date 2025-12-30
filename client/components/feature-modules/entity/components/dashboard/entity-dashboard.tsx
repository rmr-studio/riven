"use client";

import { useOrganisation } from "@/components/feature-modules/organisation/hooks/use-organisation";
import { BreadCrumbGroup, BreadCrumbTrail } from "@/components/ui/breadcrumb-group";
import { isResponseError } from "@/lib/util/error/error.util";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { EntityTypeConfigurationProvider } from "../../context/configuration-provider";
import { EntityDraftProvider } from "../../context/entity-provider";
import { useEntityTypeByKey } from "../../hooks/query/type/use-entity-types";
import { useEntity } from "../../hooks/query/use-entities";
import { EntityDataTable } from "../tables/entity-data-table";

export const EntityDashboard = () => {
    const { data: organisation } = useOrganisation();
    const { organisationId, key: typeKey } = useParams<{ organisationId: string; key: string }>();
    const router = useRouter();
    const {
        data: entityType,
        isPending: isPendingEntityType,
        error: entityTypeError,
        isLoadingAuth,
    } = useEntityTypeByKey(typeKey, organisationId);
    const {
        data: entities,
        isPending: isPendingEntities,
        error: entitiesError,
    } = useEntity(organisationId, entityType?.id);

    useEffect(() => {
        // Query has finished, organisation has not been found. Redirect back to organisation view with associated error
        if (!isPendingEntityType && !entityType) {
            if (!entityTypeError || !isResponseError(entityTypeError)) {
                router.push("/dashboard/organisation/");
                return;
            }

            // Query has returned an ID we can use to route to a valid error message
            const responseError = entityTypeError;
            router.push(
                `/dashboard/organisation/${organisationId}/entity?error=${responseError.error}`
            );
        }
    }, [isPendingEntityType, isLoadingAuth, entityType, entityTypeError, router]);

    if (!entityType) return null;

    const trail: BreadCrumbTrail[] = [
        { label: "Home", href: "/dashboard" },
        { label: "Organisations", href: "/dashboard/organisation", truncate: true },
        {
            label: organisation?.name || "Organisation",
            href: `/dashboard/organisation/${organisationId}`,
            truncate: true,
        },
        {
            label: "Entities",
            href: `/dashboard/organisation/${organisationId}/entity`,
        },
        {
            label: entityType.name.plural,
            href: `/dashboard/organisation/${organisationId}/entity/${entityType.key}`,
        },
    ];

    return (
        <div className="py-6 px-12">
            <header className="flex items-center justify-between mb-8">
                <BreadCrumbGroup items={trail} />
            </header>
            <section>
                <EntityTypeConfigurationProvider organisationId={organisationId} entityType={entityType}>
                    <EntityDraftProvider organisationId={organisationId} entityType={entityType}>
                        <EntityDataTable
                            entityType={entityType}
                            entities={entities || []}
                            loadingEntities={isPendingEntities || isLoadingAuth}
                        />
                    </EntityDraftProvider>
                </EntityTypeConfigurationProvider>
            </section>
        </div>
    );
};
