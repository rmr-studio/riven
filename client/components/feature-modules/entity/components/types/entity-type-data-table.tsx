import { DataTable } from "@/components/ui/data-table";
import { EntityPropertyType } from "@/lib/types/types";
import { Edit2, Trash2 } from "lucide-react";
import { Dispatch, FC, SetStateAction } from "react";
import { useEntityTypeTable } from "../../hooks/use-entity-type-table";
import { EntityType, type EntityTypeDefinition } from "../../interface/entity.interface";

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

    return (
        <DataTable
            columns={columns}
            data={sortedRowData}
            // enableDragDrop
            // onReorder={handleFieldsReorder}
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
