"use client";

import { EntityTypeForm } from "@/components/feature-modules/entity/components/forms/entity-type-form";
import { useBlockTypeByKey } from "@/components/feature-modules/entity/hooks/use-entity-types";
import { useParams } from "next/navigation";

const EntityTypeEditPage = () => {
    const params = useParams();
    const organisationId = params.organisationId as string;
    const entityTypeId = params.entityTypeId as string;

    const { data: entityType, isPending } = useBlockTypeByKey(entityTypeId, organisationId);

    if (isPending) {
        return (
            <div className="py-6 px-12">
                <div>Loading entity type...</div>
            </div>
        );
    }

    if (!entityType) {
        return (
            <div className="py-6 px-12">
                <div>Entity type not found</div>
            </div>
        );
    }

    return (
        <div className="py-6 px-12">
            <EntityTypeForm
                organisationId={organisationId}
                entityType={entityType}
                mode="edit"
            />
        </div>
    );
};

export default EntityTypeEditPage;
