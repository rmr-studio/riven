"use client";

import { useOrganisation } from "@/components/feature-modules/organisation/hooks/use-organisation";
import { BreadCrumbGroup, BreadCrumbTrail } from "@/components/ui/breadcrumb-group";
import { isResponseError } from "@/lib/util/error/error.util";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useEntityTypeByKey } from "../../hooks/query/use-entity-types";
import { EntityTypeOverview } from "../types/entity-type";

export const EntityTypeOverviewDashboard = () => {
    const { data: organisation } = useOrganisation();
    const params = useParams<{ organisationId: string; key: string }>();
    const { organisationId, key } = params;
    const router = useRouter();
    const {
        data: entityType,
        isPending,
        error,
        isLoadingAuth,
    } = useEntityTypeByKey(key, organisationId);

    useEffect(() => {
        // Query has finished, organisation has not been found. Redirect back to organisation view with associated error
        if (!isPending && !entityType) {
            if (!error || !isResponseError(error)) {
                router.push("/dashboard/organisation/");
                return;
            }

            // Query has returned an ID we can use to route to a valid error message
            const responseError = error;
            router.push(
                `/dashboard/organisation/${organisationId}/entity?error=${responseError.error}`
            );
        }
    }, [isPending, isLoadingAuth, entityType, error, router]);

    if (isPending) {
        return (
            <div className="py-6 px-12">
                <div>Loading entity type...</div>
            </div>
        );
    }

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
        {
            label: "Settings",
            href: `/dashboard/organisation/${organisationId}/entity/${entityType.key}/settings`,
        },
    ];

    return (
        <div className="py-6 px-12">
            <header className="flex items-center justify-between mb-8">
                <BreadCrumbGroup items={trail} />
            </header>
            <section>
                <EntityTypeOverview organisationId={organisationId} entityType={entityType} />
            </section>
        </div>
    );
};
