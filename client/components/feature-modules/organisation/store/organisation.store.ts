import { Organisation } from "@/components/feature-modules/organisation/interface/organisation.interface";
import { createStore } from "zustand";

type OrganisationState = {
    selectedOrganisationId?: string;
};

type OrganisationActions = {
    setSelectedOrganisation: (organisation: Organisation) => void;
};

export type OrganisationStore = OrganisationState & OrganisationActions;

export type OrganisationStoreApi = ReturnType<typeof createOrganisationStore>;

export const organisationInitState: OrganisationState = {
    selectedOrganisationId: undefined,
};

export const createOrganisationStore = (initState: OrganisationState = organisationInitState) => {
    return createStore<OrganisationStore>()((set) => ({
        ...initState,
        setSelectedOrganisation: (organisation: Organisation) =>
            set(() => {
                localStorage.setItem("selectedOrganisation", organisation.id);
                return {
                    selectedOrganisationId: organisation.id,
                };
            }),
    }));
};
