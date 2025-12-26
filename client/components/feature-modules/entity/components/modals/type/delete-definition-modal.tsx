import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DialogControl } from "@/lib/interfaces/interface";
import {
  DeleteAction,
  EntityPropertyType,
  EntityTypeRelationshipType,
  EntityTypeRequestDefinition,
} from "@/lib/types/types";
import { AlertCircle, Loader2 } from "lucide-react";
import { FC, useEffect, useMemo, useState } from "react";
import { useOrganisation } from "../../../../organisation/hooks/use-organisation";
import { useDeleteDefinitionMutation } from "../../../hooks/mutation/type/use-delete-definition-mutation";
import {
  DeleteAttributeDefinitionRequest,
  DeleteRelationshipDefinitionRequest,
  EntityType,
  EntityTypeDefinition,
  isAttributeDefinition,
  isRelationshipDefinition,
} from "../../../interface/entity.interface";

interface Props {
    dialog: DialogControl;
    type: EntityType;
    definition?: EntityTypeDefinition;
}

const DELETE_ACTION_LABELS: Record<DeleteAction, { label: string; description: string }> = {
    [DeleteAction.DELETE_RELATIONSHIP]: {
        label: "Delete Relationship Only",
        description:
            "Removes this relationship definition from the entity type. The relationship data will be deleted.",
    },
    [DeleteAction.REMOVE_BIDIRECTIONAL]: {
        label: "Remove Bidirectional Link",
        description:
            "Removes the bidirectional link between entities. The relationship will become unidirectional.",
    },
    [DeleteAction.REMOVE_ENTITY_TYPE]: {
        label: "Remove from Entity Type",
        description:
            "Removes this relationship from the entity type configuration without deleting the relationship data.",
    },
};

export const DeleteDefinitionModal: FC<Props> = ({ dialog, type, definition }) => {
    const { open, setOpen: onOpenChange } = dialog;
    const { data: organisation } = useOrganisation();
    const [deleteAction, setDeleteAction] = useState<DeleteAction | undefined>(undefined);
    const [isDeleting, setIsDeleting] = useState(false);

    const isRelationship = definition?.type === EntityPropertyType.RELATIONSHIP;
    const isAttribute = definition?.type === EntityPropertyType.ATTRIBUTE;

    const isReference = useMemo(() => {
        if(!definition) return false;
        if (!isRelationshipDefinition(definition.definition)) return false;
        return definition.definition.relationshipType === EntityTypeRelationshipType.REFERENCE;
    }, [definition]);

    const { mutateAsync: deleteDefinition } = useDeleteDefinitionMutation(organisation?.id || "", {
        onMutate: () => {
            setIsDeleting(true);
        },
        onSuccess: () => {
            setIsDeleting(false);
            onOpenChange(false);
        },
        onError: () => {
            setIsDeleting(false);
        },
    });

    // Reset delete action when dialog closes or definition changes
    useEffect(() => {
        if (!open) {
            setDeleteAction(undefined);
            setIsDeleting(false);
        }
    }, [open]);

    useEffect(() => {
        setDeleteAction(undefined);
    }, [definition?.id]);

    const handleDelete = async () => {
        if (!definition || !organisation) return;

        if (isRelationship) {
            if (!deleteAction) return;

            const request: DeleteRelationshipDefinitionRequest = {
                id: definition.id,
                key: type.key,
                type: EntityTypeRequestDefinition.DELETE_RELATIONSHIP,
                deleteAction: isReference ? deleteAction : DeleteAction.DELETE_RELATIONSHIP,
            };

            await deleteDefinition({
                definition: request,
            });

            return;
        }

        const request: DeleteAttributeDefinitionRequest = {
            id: definition.id,
            key: type.key,
            type: EntityTypeRequestDefinition.DELETE_SCHEMA,
        };

        await deleteDefinition({
            definition: request,
        });
    };

    const canDelete = !(isReference && !deleteAction);

    if (!organisation || !definition) return null;

    const definitionLabel = isRelationshipDefinition(definition.definition)
        ? definition.definition.name || definition.id
        : isAttributeDefinition(definition.definition)
        ? definition.definition.schema.label || definition.id
        : definition.id;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        Delete {isRelationship ? "Relationship" : "Attribute"}
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete "{definitionLabel}"? This action cannot be
                        undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {isReference && (
                        <>
                            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md">
                                <AlertCircle className="size-4 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                                <div className="text-sm text-amber-900 dark:text-amber-200">
                                    <p className="font-medium mb-1">Relationship Deletion</p>
                                    <p className="text-amber-800 dark:text-amber-300">
                                        Please select how you want to handle this relationship
                                        deletion.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Deletion Action</Label>
                                <RadioGroup
                                    value={deleteAction}
                                    onValueChange={(value) =>
                                        setDeleteAction(value as DeleteAction)
                                    }
                                >
                                    {Object.entries(DELETE_ACTION_LABELS).map(([action, info]) => (
                                        <div
                                            key={action}
                                            className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                                            onClick={() => setDeleteAction(action as DeleteAction)}
                                        >
                                            <RadioGroupItem
                                                value={action}
                                                id={action}
                                                className="mt-0.5"
                                            />
                                            <div className="flex-1 space-y-1">
                                                <Label
                                                    htmlFor={action}
                                                    className="text-sm font-medium cursor-pointer"
                                                >
                                                    {info.label}
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    {info.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        </>
                    )}

                    {isRelationship && !isReference && (
                        <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md">
                            <AlertCircle className="size-4 text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
                            <div className="text-sm text-green-900 dark:text-green-200">
                                <p className="font-medium mb-1">Info</p>
                                <p className="text-green-800 dark:text-green-300">
                                    Deleting this relationship will remove it from the entity type,
                                    and from all other entity types that currently hold a two way
                                    relationship with it. All associated relationship data will be
                                    deleted.
                                </p>
                            </div>
                        </div>
                    )}

                    {isAttribute && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md">
                            <AlertCircle className="size-4 text-red-600 dark:text-red-500 mt-0.5 shrink-0" />
                            <div className="text-sm text-red-900 dark:text-red-200">
                                <p className="font-medium mb-1">Warning</p>
                                <p className="text-red-800 dark:text-red-300">
                                    Deleting this attribute will remove it from all entities of this
                                    type. This action cannot be undone.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={!canDelete || isDeleting}
                    >
                        {isDeleting && <Loader2 className="size-4 animate-spin" />}
                        {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
