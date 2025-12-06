"use client";

import { useOrganisation } from "@/components/feature-modules/organisation/hooks/use-organisation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import {
    Archive,
    Calendar,
    Copy,
    Edit,
    LayoutGrid,
    MoreVertical,
    Plus,
    Trash2,
} from "lucide-react";
import { FC, useState } from "react";
import { useBlockTypes } from "../../hooks/use-block-types";
import { BlockType } from "../../interface/block.interface";
import { BlockTypeBuilder } from "../builder/block-type-builder";

/**
 * BlockManager - Main page for managing custom block types
 *
 * Allows organizations to:
 * - View all custom block types
 * - Create new block types (opens wizard)
 * - Edit existing block types
 * - Archive/delete block types
 * - Duplicate block types
 */
export const BlockManager: FC = () => {
    const { data: organisation, isPending: isFetchingOrg, error: orgError } = useOrganisation();
    const { data: blockTypes, isLoading, error, refetch } = useBlockTypes(organisation?.id);
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [editingBlockType, setEditingBlockType] = useState<BlockType | null>(null);

    // Filter to only show custom (non-system) block types
    const customBlockTypes = blockTypes?.filter((type) => !type.system) || [];

    const handleCreateNew = () => {
        setEditingBlockType(null);
        setIsBuilderOpen(true);
    };

    const handleEdit = (blockType: BlockType) => {
        setEditingBlockType(blockType);
        setIsBuilderOpen(true);
    };

    const handleDuplicate = (blockType: BlockType) => {
        // TODO: Implement duplicate functionality
        console.log("Duplicate:", blockType);
    };

    const handleArchive = (blockType: BlockType) => {
        // TODO: Implement archive functionality
        console.log("Archive:", blockType);
    };

    const handleDelete = (blockType: BlockType) => {
        // TODO: Implement delete functionality with confirmation
        console.log("Delete:", blockType);
    };

    const handleBuilderClose = () => {
        setIsBuilderOpen(false);
        setEditingBlockType(null);
        refetch(); // Refresh the list after closing builder
    };

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Block Types</h1>
                    <p className="text-muted-foreground">
                        Create and manage custom block types for your organization
                    </p>
                </div>
                <Button onClick={handleCreateNew} className="gap-2">
                    <Plus className="size-4" />
                    Create Block Type
                </Button>
            </div>

            {/* Block Type Grid */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="mt-2 h-4 w-full" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : error ? (
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <p className="text-destructive">
                            Error loading block types: {error.message}
                        </p>
                    </CardContent>
                </Card>
            ) : customBlockTypes.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <LayoutGrid className="mb-4 size-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">No custom block types yet</h3>
                        <p className="mb-4 text-center text-sm text-muted-foreground">
                            Get started by creating your first custom block type
                        </p>
                        <Button onClick={handleCreateNew} className="gap-2">
                            <Plus className="size-4" />
                            Create Block Type
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {customBlockTypes.map((blockType) => (
                        <Card key={blockType.id} className="relative">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="flex items-center gap-2">
                                            {blockType.name}
                                            {blockType.archived && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Archived
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription className="mt-1.5 line-clamp-2">
                                            {blockType.description || "No description"}
                                        </CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="size-8">
                                                <MoreVertical className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(blockType)}>
                                                <Edit className="mr-2 size-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDuplicate(blockType)}
                                            >
                                                <Copy className="mr-2 size-4" />
                                                Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => handleArchive(blockType)}
                                            >
                                                <Archive className="mr-2 size-4" />
                                                {blockType.archived ? "Unarchive" : "Archive"}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(blockType)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="mr-2 size-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="size-3" />
                                        <span>
                                            {blockType.createdAt
                                                ? formatDistanceToNow(
                                                      new Date(blockType.createdAt),
                                                      {
                                                          addSuffix: true,
                                                      }
                                                  )
                                                : "Unknown"}
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        v{blockType.version}
                                    </Badge>
                                </div>

                                {/* Quick stats */}
                                <div className="mt-4 flex gap-2 text-xs">
                                    <Badge variant="secondary">
                                        {Object.keys(blockType.schema.properties || {}).length}{" "}
                                        fields
                                    </Badge>
                                    <Badge variant="secondary">
                                        {
                                            Object.keys(blockType.display.render.components || {})
                                                .length
                                        }{" "}
                                        components
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Builder Dialog */}
            <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
                <DialogContent
                    className="min-w-[70dvw] h-[90vh] p-0"
                    onInteractOutside={(e) => {
                        // Prevent closing when clicking on dropdown menus or other portaled content
                        e.preventDefault();
                    }}
                >
                    <DialogTitle className="sr-only">
                        {editingBlockType ? "Edit Block Type" : "Create Block Type"}
                    </DialogTitle>
                    <BlockTypeBuilder
                        initialState={
                            editingBlockType
                                ? {
                                      id: editingBlockType.id,
                                      key: editingBlockType.key,
                                      name: editingBlockType.name,
                                      description: editingBlockType.description || "",
                                      schema: editingBlockType.schema,
                                      form: editingBlockType.display.form,
                                      render: editingBlockType.display.render,
                                      nesting: editingBlockType.nesting || null,
                                      nestingEnabled: !!editingBlockType.nesting,
                                      strictness: editingBlockType.strictness,
                                  }
                                : undefined
                        }
                        onPublish={(blockType) => {
                            console.log("Published:", blockType);
                            handleBuilderClose();
                        }}
                        onCancel={handleBuilderClose}
                        className="h-full"
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BlockManager;
