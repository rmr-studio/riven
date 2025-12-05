import { CommandDialog, CommandInput } from "@/components/ui/command";
import { EntityType } from "@/lib/types/types";
import { FC, useMemo, useState } from "react";
import { useBlockTypes } from "../../hooks/use-block-types";
import { BlockType } from "../../interface/block.interface";
import { BlockTypeSelectorList } from "../shared/block-type-selector-list";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Building2, Globe, LayoutGrid } from "lucide-react";

/**
 * Props for the AddBlockDialog component
 */
export interface AddBlockDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback to change the open state */
    onOpenChange: (open: boolean) => void;
    /** Organization ID to fetch block types for */
    organisationId: string;
    /** Optional entity type for contextual filtering */
    entityType?: EntityType;
    /** Callback when a block type is selected */
    onBlockTypeSelect: (blockType: BlockType) => void;
}

/**
 * Dialog component for selecting and adding block types to an entity layout.
 *
 * This component provides a searchable, categorized interface for browsing
 * available block types (both system and custom). It's similar to the demo's
 * AddBlockButton but designed for real entity environments.
 *
 * Features:
 * - Search/filter block types by name or description
 * - Categorized display (Layout, Content, Reference, Custom)
 * - System/custom badges
 * - Icon indicators for each block type
 * - Loading and error states
 *
 * @example
 * ```typescript
 * const [dialogOpen, setDialogOpen] = useState(false);
 *
 * return (
 *   <>
 *     <Button onClick={() => setDialogOpen(true)}>Add Block</Button>
 *     <AddBlockDialog
 *       open={dialogOpen}
 *       onOpenChange={setDialogOpen}
 *       organisationId={organisationId}
 *       entityType={EntityType.CLIENT}
 *       onBlockTypeSelect={(type) => {
 *         console.log('Selected:', type);
 *         setDialogOpen(false);
 *       }}
 *     />
 *   </>
 * );
 * ```
 */
export const AddBlockDialog: FC<AddBlockDialogProps> = ({
    open,
    onOpenChange,
    organisationId,
    entityType,
    onBlockTypeSelect,
}) => {
    const { data: blockTypes, isLoading, error } = useBlockTypes(organisationId, entityType);
    const [filter, setFilter] = useState<"all" | "system" | "custom">("all");

    // Filter block types based on selected filter
    const filteredBlockTypes = useMemo(() => {
        if (!blockTypes) return undefined;

        switch (filter) {
            case "system":
                return blockTypes.filter((type) => type.system);
            case "custom":
                return blockTypes.filter((type) => !type.system);
            case "all":
            default:
                return blockTypes;
        }
    }, [blockTypes, filter]);

    const handleSelect = (blockType: BlockType) => {
        onBlockTypeSelect(blockType);
        onOpenChange(false);
    };

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Search block types..." />

            {/* Filter toggle */}
            <div className="border-b px-4 py-3">
                <ToggleGroup
                    type="single"
                    value={filter}
                    onValueChange={(value) => {
                        if (value) setFilter(value as "all" | "system" | "custom");
                    }}
                    className="justify-start"
                >
                    <ToggleGroupItem value="all" aria-label="Show all blocks" className="gap-2">
                        <LayoutGrid className="size-4" />
                        All Blocks
                    </ToggleGroupItem>
                    <ToggleGroupItem value="system" aria-label="Show system blocks" className="gap-2">
                        <Globe className="size-4" />
                        System
                    </ToggleGroupItem>
                    <ToggleGroupItem value="custom" aria-label="Show custom blocks" className="gap-2">
                        <Building2 className="size-4" />
                        Custom
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            <BlockTypeSelectorList
                blockTypes={filteredBlockTypes}
                isLoading={isLoading}
                error={error}
                onSelect={handleSelect}
            />
        </CommandDialog>
    );
};
