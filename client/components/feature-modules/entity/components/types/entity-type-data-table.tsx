import { DataTable } from "@/components/ui/data-table";
import { EntityPropertyType } from "@/lib/types/types";
import { Edit2, Trash2 } from "lucide-react";
import { FC } from "react";
import { useConfigForm } from "../../context/configuration-provider";
import { useEntityTypeTable } from "../../hooks/use-entity-type-table";
import {
    EntityType,
    EntityTypeAttributeRow,
    EntityTypeOrderingKey,
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

    const orderMatch = (curr: EntityTypeOrderingKey[], saved: EntityTypeOrderingKey[]) => {
        if (curr.length !== saved.length) return false;

        console.log(curr, saved);

        return curr.every((item, index) => {
            return item.key === saved[index].key && item.type === saved[index].type;
        });
    };

    const handleFieldsReorder = (newOrder: EntityTypeAttributeRow[]) => {
        const order: EntityTypeOrderingKey[] = newOrder.map((item) => {
            return {
                key: item.id,
                type: item.type,
            };
        });

        // Compare new order with original order from entity type
        const matchesOriginal = orderMatch(order, type.order);
        console.log(matchesOriginal);
        console.log(form.formState.dirtyFields);
        // Only mark as dirty if the order has changed from the original

        if (matchesOriginal) {
            // Remove from dirty if matches original
            form.resetField("order", {
                keepDirty: false,
                defaultValue: type.order,
            });
            console.log(form.formState.dirtyFields);
            return;
        }

        form.setValue("order", order, {
            shouldDirty: !matchesOriginal,
        });
    };

    return (
        <DataTable
            columns={columns}
            data={sortedRowData}
            enableDragDrop
            onReorder={handleFieldsReorder}
            getRowId={(row) => row.id}
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
                        disabled: (row) => row?.protected || false,
                    },
                ],
            }}
            emptyMessage="No fields defined yet. Add your first attribute or relationship to get started."
            className="border rounded-md"
        />
    );
};

export default EntityTypeDataTable;
