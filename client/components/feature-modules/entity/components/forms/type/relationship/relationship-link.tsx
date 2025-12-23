import { useRelationshipCandidates } from "@/components/feature-modules/entity/hooks/query/use-relationship-candidates";
import { EntityType } from "@/components/feature-modules/entity/interface/entity.interface";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FC } from "react";

interface Props {
    type: EntityType;
}
/**
 * This component shows all available existing relationships that can be linked to the current entity type.
 * This would involve:
 * - All polymorphic relationships that can be joined
 * - Other entity relationships linking to the same source (Allowing for relationship consolidation/merging)
 *
 * @param param0
 * @returns
 */
export const RelationshipLink: FC<Props> = ({ type }) => {
    const { candidates, loading } = useRelationshipCandidates(type);

    if (loading)
        return (
            <section className="flex flex-col gap-2">
                <Skeleton />
                <Skeleton />
                <Skeleton />
                <Skeleton />
            </section>
        );

    if (candidates.length === 0) return <p>No available relationships to link.</p>;

    return (
        <Card className="min-w-xs">
            <CardHeader>
                <h3 className="text-lg font-medium mb-4">Available Relationships to Link</h3>
            </CardHeader>
        </Card>
    );
};
