"use client";

import { BreadCrumbGroup, BreadCrumbTrail } from "@/components/ui/breadcrumb-group";
import { isResponseError } from "@/lib/util/error/error.util";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useOrganisation } from "../hooks/use-organisation";
import { useCurrentOrganisation } from "../provider/organisation-provider";

export const OrganisationDashboard = () => {
    const { data: organisation, isPending, error, isLoadingAuth } = useOrganisation();

    const router = useRouter();
    
    const {} = useCurrentOrganisation()

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

    useEffect(() => {
        if (!organisation || !setSelectedOrganisation) return;
        if (selectedOrganisationId === organisation.id) return;
        setSelectedOrganisation(organisation); // Pass the full Organisation object
    }, [organisation, selectedOrganisationId, setSelectedOrganisation]);

    if (isPending || isLoadingAuth) {
        return <div>Loading...</div>;
    }

    if (!organisation) return;

    const trail: BreadCrumbTrail[] = [
        { label: "Home", href: "/dashboard" },
        { label: "Organisations", href: "/dashboard/organisation" },
        {
            label: organisation.name || "Organisation",
            href: `/dashboard/organisation/${organisation.id}`,
        },
    ];

    return (
        <div className="py-6 px-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <BreadCrumbGroup items={trail} />
            </div>
        </div>
    );
};
