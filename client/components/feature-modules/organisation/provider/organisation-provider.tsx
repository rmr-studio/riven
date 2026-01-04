"use client";

import {
    createOrganisationStore,
    type OrganisationStore,
    type OrganisationStoreApi,
} from "@/components/feature-modules/organisation/store/organisation.store";
import { useProfile } from "@/components/feature-modules/user/hooks/useProfile";
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useStore } from "zustand";

const OrganisationsStoreContext = createContext<OrganisationStoreApi | undefined>(undefined);

export interface OrganisationsStoreProviderProps {
    children: ReactNode;
}

export const OrganisationsStoreProvider = ({ children }: OrganisationsStoreProviderProps) => {
    const { data: user } = useProfile();
    const storeRef = useRef<OrganisationStoreApi | null>(null);

    // Compute initial organisation ID from localStorage and user data
    const initialOrganisationId = useMemo(() => {
        if (!user) return undefined;

        const selectedOrganisationId = localStorage.getItem("selectedOrganisation");
        if (selectedOrganisationId) {
            const selectedOrganisation = user.memberships.find(
                (m) => m.organisation?.id === selectedOrganisationId
            )?.organisation;

            if (selectedOrganisation) {
                return selectedOrganisation.id;
            }
        }

        // Fall back to first organisation
        return user.memberships[0]?.organisation?.id;
    }, [user]);

    // Create store only once
    if (!storeRef.current) {
        storeRef.current = createOrganisationStore();
    }

    // Update store when initial organisation ID changes
    useEffect(() => {
        if (initialOrganisationId && storeRef.current) {
            storeRef.current.setState({
                selectedOrganisationId: initialOrganisationId,
            });
        }
    }, [initialOrganisationId]);

    return (
        <OrganisationsStoreContext.Provider value={storeRef.current}>
            {children}
        </OrganisationsStoreContext.Provider>
    );
};

const useOrganisationStoreState = <T,>(selector: (store: OrganisationStore) => T): T => {
    const context = useContext(OrganisationsStoreContext);

    if (!context) {
        throw new Error("useOrganisationStore must be used within a OrganisationsStoreProvider");
    }

    return useStore(context, selector);
};

export const useOrganisationStore = <T,>(selector: (store: OrganisationStore) => T): T => {
    return useOrganisationStoreState(selector);
};

export const useCurrentOrganisation = () => {
    return useOrganisationStoreState((store) => store);
};
