"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Database, Edit, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FC, useMemo } from "react";
import { useEntityTypes } from "../../hooks/use-entity-types";
import { EntityType } from "../../interface/entity.interface";

interface Props {
    organisationId: string;
}

export const EntityTypesOverview: FC<Props> = ({ organisationId }) => {
    const router = useRouter();
    const { data: types, isPending } = useEntityTypes(organisationId);

    const columns: ColumnDef<EntityType>[] = useMemo(
        () => [
            {
                accessorKey: "name",
                header: "Entity Type",
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                            <Database className="h-4 w-4 text-primary" />
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
                <Link href={`/dashboard/organisation/${organisationId}/entity/new`}>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Entity Type
                    </Button>
                </Link>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={types ?? []}
                enableSorting
                search={{
                    enabled: true,
                    searchableColumns: ["name", "key"],
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
                    console.log(row);
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
                                    `/dashboard/organisation/${organisationId}/entity/${row.key}`
                                );
                            },
                            separator: true,
                        },
                        {
                            label: "Delete",
                            icon: Trash2,
                            onClick: (row) => {
                                // TODO: Implement delete functionality
                                console.log("Delete entity type:", row);
                            },
                            variant: "destructive",
                        },
                    ],
                }}
                emptyMessage="No entity types found."
                className="border rounded-md"
            />
        </div>
    );
};
