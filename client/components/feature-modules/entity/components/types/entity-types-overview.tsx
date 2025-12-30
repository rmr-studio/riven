"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableProvider } from "@/components/ui/data-table";
import { IconCell } from "@/components/ui/icon/icon-cell";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, useMemo, useState } from "react";
import { useDeleteTypeMutation } from "../../hooks/mutation/type/use-delete-type-mutation";
import { useEntityTypes } from "../../hooks/query/type/use-entity-types";
import { EntityType, EntityTypeImpactResponse } from "../../interface/entity.interface";
import { NewEntityTypeForm } from "../forms/type/new-entity-type-form";

interface Props {
    organisationId: string;
}

export const EntityTypesOverview: FC<Props> = ({ organisationId }) => {
    const router = useRouter();
    const [impactModalOpen, setImpactModalOpen] = useState<boolean>(false);

    const { data: types, isPending } = useEntityTypes(organisationId);

    const onImpactConfirmation = (impact: EntityTypeImpactResponse) => {
        // todo
        setImpactModalOpen(true);
    };

    const { mutateAsync: deleteType } = useDeleteTypeMutation(organisationId, onImpactConfirmation);

    const onDelete = async (row: EntityType) => {
        await deleteType({ key: row.key });
    };

    const columns: ColumnDef<EntityType>[] = useMemo(
        () => [
            {
                accessorKey: "name",
                header: "Entity Type",
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/5">
                            <IconCell
                                readonly={true}
                                iconType={row.original.icon.icon}
                                colour={row.original.icon.colour}
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium">{row.original.name.plural}</span>
                            {row.original.description && (
                                <span className="text-xs text-muted-foreground">
                                    {row.original.description}
                                </span>
                            )}
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: "type",
                header: "Type",
                cell: ({ row }) => {
                    const type = row.original.type;
                    const isStandard = type === "STANDARD";
                    return (
                        <Badge variant={isStandard ? "secondary" : "default"}>
                            {type === "STANDARD" ? "Standard" : "Relationship"}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: "relationships",
                header: "Relationships",
                cell: ({ row }) => {
                    const { second } = row.original.attributes;
                    return <span className="text-muted-foreground">{second}</span>;
                },
            },
            {
                accessorKey: "schema",
                header: "Attributes",
                cell: ({ row }) => {
                    const { first, second } = row.original.attributes;
                    return <span className="text-muted-foreground">{first + second}</span>;
                },
            },
        ],
        []
    );

    if (isPending) {
        return <div>Loading entity types...</div>;
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Entity Types</h1>
                    <p className="text-sm text-muted-foreground">
                        Modify and add entity types in your workspace
                    </p>
                </div>
                <NewEntityTypeForm organisationId={organisationId} entityTypes={types}>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Entity Type
                    </Button>
                </NewEntityTypeForm>
            </div>

            {/* Data Table */}
            <DataTableProvider initialData={types || []}>
                <DataTable
                    columns={columns}
                    enableSorting
                    search={{
                        enabled: true,
                        searchableColumns: ["name.plural", "name.singular"],
                        placeholder: "Search entity types...",
                    }}
                    filter={{
                        enabled: true,
                        filters: [
                            {
                                column: "type",
                                type: "select",
                                label: "Type",
                                options: [
                                    { label: "Standard", value: "STANDARD" },
                                    { label: "Relationship", value: "RELATIONSHIP" },
                                ],
                            },
                            {
                                column: "protected",
                                type: "boolean",
                                label: "Protected",
                            },
                        ],
                    }}
                    onRowClick={(row) => {
                        router.push(
                            `/dashboard/organisation/${organisationId}/entity/${row.original.key}`
                        );
                    }}
                    rowActions={{
                        enabled: true,
                        menuLabel: "Actions",
                        actions: [
                            {
                                label: "Edit",
                                icon: Edit,
                                onClick: (row) => {
                                    router.push(
                                        `/dashboard/organisation/${organisationId}/entity/${row.key}/settings`
                                    );
                                },
                                separator: true,
                            },
                            {
                                label: "Delete",
                                icon: Trash2,
                                onClick: onDelete,
                                variant: "destructive",
                            },
                        ],
                    }}
                    emptyMessage="No entity types found."
                />
            </DataTableProvider>
        </div>
    );
};
