"use client";

import { useOrganisation } from "@/components/feature-modules/organisation/hooks/use-organisation";
import { BreadCrumbGroup, BreadCrumbTrail } from "@/components/ui/breadcrumb-group";
import { isResponseError } from "@/lib/util/error/error.util";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { EntityTypesOverview } from "../types/entity-types-overview";

const EntityTypesDashboard = () => {
    const { data: organisation, isPending, error, isLoadingAuth } = useOrganisation();
    const router = useRouter();

    useEffect(() => {
        // Query has finished, organisation has not been found. Redirect back to organisation view with associated error
        if (!isPending && !isLoadingAuth && !organisation) {
            if (!error || !isResponseError(error)) {
                router.push("/dashboard/organisation/");
                return;
            }

            // Query has returned an ID we can use to route to a valid error message
            const responseError = error;
            router.push(`/dashboard/organisation?error=${responseError.error}`);
        }
    }, [isPending, isLoadingAuth, organisation, error, router]);

    if (isPending || isLoadingAuth) {
        return <div>Loading...</div>;
    }

    if (!organisation) return null;

    const trail: BreadCrumbTrail[] = [
        { label: "Home", href: "/dashboard" },
        { label: "Organisations", href: "/dashboard/organisation" },
        {
            label: organisation.name || "Organisation",
            href: `/dashboard/organisation/${organisation.id}`,
        },
        {
            label: "Entities",
            href: `/dashboard/organisation/${organisation.id}/entity`,
        },
    ];

    return (
        <div className="py-6 px-12">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <BreadCrumbGroup items={trail} />
            </header>
            <section>
                <EntityTypesOverview organisationId={organisation.id} />
            </section>
        </div>
    );
};

export default EntityTypesDashboard;
