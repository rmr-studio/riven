import { DataTable } from "@/components/ui/data-table";
import { EntityPropertyType } from "@/lib/types/types";
import { Row } from "@tanstack/react-table";
import { Edit2, Trash2 } from "lucide-react";
import { FC, useCallback } from "react";
import { toast } from "sonner";
import { useConfigForm } from "../../context/configuration-provider";
import { useEntityTypeTable } from "../../hooks/use-entity-type-table";
import {
    EntityType,
    EntityTypeAttributeRow,
    EntityTypeAttributeColumn,
    type EntityTypeDefinition,
} from "../../interface/entity.interface";

interface Props {
    type: EntityType;
    identifierKey: string;
    onEdit: (definition: EntityTypeDefinition) => void;
    onDelete: (definition: EntityTypeDefinition) => void;
}

const EntityTypeDataTable: FC<Props> = ({ type, identifierKey, onEdit, onDelete }) => {
    const {
        sortedRowData,
        columns,
        onDelete: deleteRow,
        onEdit: editRow,
    } = useEntityTypeTable(type, identifierKey, onEdit, onDelete);

    const form = useConfigForm();

    const handleFieldsReorder = (newOrder: EntityTypeAttributeRow[]): boolean => {
        // Validate: Identifier must remain in first position
        const firstRow = newOrder[0];

        // Check if first row is the identifier
        const isFirstRowIdentifier =
            firstRow.id === identifierKey && firstRow.type === EntityPropertyType.ATTRIBUTE;

        if (!isFirstRowIdentifier) {
            // Reject the reorder - identifier was moved from first position
            toast.error("The identifier column must remain in the first position", {
                description: "This field serves as the primary identifier and cannot be moved.",
            });

            return false; // Reject - table will stay at original position
        }

        // Valid reorder - proceed as normal
        const columns: EntityTypeAttributeColumn[] = newOrder.map((item) => {
            return {
                
                key: item.id,
                type: item.type,
            };
        });

        form.setValue("columns", columns, {
            shouldDirty: true,
        });

        return true; // Accept the reorder
    };

    const canDelete = (row: EntityTypeAttributeRow): boolean => {
        return (
            !row.protected &&
            !(
                [type.identifierKey, identifierKey].includes(row.id) &&
                row.type === EntityPropertyType.ATTRIBUTE
            )
        );
    };

    // Disable drag for identifier column (it must stay first)
    const disableDragForRow = useCallback(
        (row: Row<EntityTypeAttributeRow>) => {
            return (
                row.original.id === identifierKey &&
                row.original.type === EntityPropertyType.ATTRIBUTE
            );
        },
        [identifierKey]
    );

    return (
        <DataTable
            columns={columns}
            data={sortedRowData}
            enableDragDrop
            onReorder={handleFieldsReorder}
            getRowId={(row) => row.id}
            disableDragForRow={disableDragForRow}
            search={{
                enabled: true,
                searchableColumns: ["label"],
                placeholder: "Search fields...",
            }}
            filter={{
                enabled: true,
                filters: [
                    {
                        column: "type",
                        type: "select",
                        label: "Type",
                        options: [
                            {
                                label: "Attributes",
                                value: EntityPropertyType.ATTRIBUTE,
                            },
                            {
                                label: "Relationships",
                                value: EntityPropertyType.RELATIONSHIP,
                            },
                        ],
                    },
                ],
            }}
            rowActions={{
                enabled: true,
                menuLabel: "Actions",
                actions: [
                    {
                        label: "Edit",
                        icon: Edit2,
                        onClick: (row) => {
                            editRow(row);
                        },
                    },
                    {
                        label: "Delete",
                        icon: Trash2,
                        onClick: (row) => {
                            deleteRow(row);
                        },
                        variant: "destructive",
                        disabled: (row) => !canDelete(row),
                    },
                ],
            }}
            emptyMessage="No fields defined yet. Add your first attribute or relationship to get started."
            className="border rounded-md"
        />
    );
};

export default EntityTypeDataTable;
