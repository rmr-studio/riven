import { EntityRelationshipDefinition } from "@/components/feature-modules/entity/interface/entity.interface";
import { getInverseCardinality } from "@/components/feature-modules/entity/util/relationship.util";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconCell } from "@/components/ui/icon/icon-cell";
import { Icon } from "@/lib/interfaces/common.interface";
import { EntityRelationshipCardinality } from "@/lib/types/types";
import { Link } from "lucide-react";
import { FC } from "react";

interface Props {
    name: string;
    icon: Icon;
    onSelect: (relationship: EntityRelationshipDefinition) => void;
    relationship: EntityRelationshipDefinition;
}

export const Candidate: FC<Props> = ({ name, icon, relationship, onSelect }) => {
    const { icon: iconType, colour } = icon;

    const getCardinalityDescription = (
        cardinality: EntityRelationshipCardinality,
        entityName: string
    ): string => {
        const inverse = getInverseCardinality(cardinality);

        switch (inverse) {
            case EntityRelationshipCardinality.ONE_TO_ONE:
            case EntityRelationshipCardinality.ONE_TO_MANY:
                return `Stores one ${entityName.toLowerCase()} reference`;
            case EntityRelationshipCardinality.MANY_TO_ONE:
            case EntityRelationshipCardinality.MANY_TO_MANY:
                return `Stores unlimited ${entityName.toLowerCase()} references`;
        }
    };

    return (
        <Card
            className="p-2  gap-0 hover:bg-accent/70 cursor-pointer"
            onClick={() => onSelect(relationship)}
        >
            <CardHeader className="p-0 m-0">
                <div className="flex items-center">
                    <IconCell
                        readonly
                        iconType={iconType}
                        colour={colour}
                        className="size-4 mr-3"
                    />
                    <div className="w-auto grow">
                        <CardTitle className="text-sm">{name}</CardTitle>
                        <CardDescription className="text-xs">
                            {getCardinalityDescription(relationship.cardinality, name)}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 pr-1 flex justify-end items-center text-xs text-primary/80 font-semibold">
                <Link className="size-3 mr-2" />
                Link to this Entity
            </CardContent>
        </Card>
    );
};
