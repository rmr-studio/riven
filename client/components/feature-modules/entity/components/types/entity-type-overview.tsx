import { useOrganisation } from "@/components/feature-modules/organisation/hooks/use-organisation";
import { useEntityTypes } from "../../hooks/use-entity-types";

export const OrganisationEntityTypeOverview = () => {
    const { data: organisation } = useOrganisation();
    const { data: types } = useEntityTypes(organisation?.id);

    return <div>OrganisationEntityTypeOverview</div>;
};
