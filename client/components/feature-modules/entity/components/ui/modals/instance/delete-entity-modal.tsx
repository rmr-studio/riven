"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Loader2 } from "lucide-react";
import { FC, useMemo, useState } from "react";
import { useDeleteEntityMutation } from "../../../../hooks/mutation/instance/use-delete-entity-mutation";
import { EntityRow, isEntityRow } from "../../../tables/entity-table-utils";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedRows: EntityRow[];
    organisationId: string;
    entityTypeId: string;
    onSuccess?: () => void;
}

export const DeleteEntityModal: FC<Props> = ({
    open,
    onOpenChange,
    selectedRows,
    organisationId,
    entityTypeId,
    onSuccess,
}) => {
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter out draft rows and get entity IDs
    const entityIds = useMemo(() => {
        return selectedRows.filter(isEntityRow).map((row) => row._entityId);
    }, [selectedRows]);

    const entityCount = entityIds.length;

    const { mutateAsync: deleteEntities } = useDeleteEntityMutation(organisationId, {
        onMutate: () => {
            setIsDeleting(true);
        },
        onSuccess: () => {
            setIsDeleting(false);
            onOpenChange(false);
            onSuccess?.();
        },
        onError: () => {
            setIsDeleting(false);
        },
    });

    const handleDelete = async () => {
        if (entityCount === 0) return;

        // Group entity IDs by type ID
        const entityIdsByType: Record<string, string[]> = {
            [entityTypeId]: entityIds,
        };

        await deleteEntities({ entityIds: entityIdsByType });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Delete Entities</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete {entityCount}{" "}
                        {entityCount === 1 ? "entity" : "entities"}? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md">
                        <AlertCircle className="size-4 text-red-600 dark:text-red-500 mt-0.5 shrink-0" />
                        <div className="text-sm text-red-900 dark:text-red-200">
                            <p className="font-medium mb-1">Warning</p>
                            <p className="text-red-800 dark:text-red-300">
                                Deleting {entityCount === 1 ? "this entity" : "these entities"} will
                                permanently remove {entityCount === 1 ? "it" : "them"} from the
                                system. All associated data will be lost and this action cannot be
                                reversed.
                            </p>
                        </div>
                    </div>
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
                        disabled={isDeleting || entityCount === 0}
                    >
                        {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
                        {isDeleting ? "Deleting..." : `Delete ${entityCount === 1 ? "Entity" : "Entities"}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
