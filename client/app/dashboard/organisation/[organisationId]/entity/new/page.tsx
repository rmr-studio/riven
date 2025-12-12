"use client";

import { EntityTypeForm } from "@/components/feature-modules/entity/components/forms/entity-type-form";
import { useParams } from "next/navigation";

const NewOrganisationEntityPage = () => {
    const params = useParams();
    const organisationId = params.organisationId as string;

    return (
        <div className="py-6 px-12">
            <EntityTypeForm organisationId={organisationId} mode="create" />
        </div>
    );
};

export default NewOrganisationEntityPage;
