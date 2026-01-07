"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { Ellipsis, Trash2 } from "lucide-react";
import { FC, useState } from "react";
import { DeleteEntityModal } from "../ui/modals/instance/delete-entity-modal";
import { EntityRow } from "./entity-table-utils";

interface Props {
    selectedRows: EntityRow[];
    clearSelection: () => void;
    workspaceId: string;
    entityTypeId: string;
}

const EntityActionBar: FC<Props> = ({
    selectedRows,
    clearSelection,
    workspaceId,
    entityTypeId,
}) => {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const handleDeleteSuccess = () => {
        clearSelection();
    };

    return (
        <>
            <div className="flex items-center mb-0.5 px-1 gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={"ghost"}
                            size={"xs"}
                            className="p-1! hover:bg-primary/10"
                            onClick={() => setDeleteModalOpen(true)}
                        >
                            <Trash2 className="text-destructive size-3.5 " />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs py-1 px-1.5">
                        Delete Selected Rows
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant={"ghost"} size={"xs"} className="p-1! hover:bg-primary/10">
                            <Ellipsis className="size-3.5 text-primary" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs py-1 px-1.5">More Actions</TooltipContent>
                </Tooltip>
            </div>

            <DeleteEntityModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                selectedRows={selectedRows}
                workspaceId={workspaceId}
                entityTypeId={entityTypeId}
                onSuccess={handleDeleteSuccess}
            />
        </>
    );
};

export default EntityActionBar;
