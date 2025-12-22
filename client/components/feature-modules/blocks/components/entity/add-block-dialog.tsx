import { CommandDialog, CommandInput } from "@/components/ui/command";
import { FC } from "react";
import { useBlockTypes } from "../../hooks/use-block-types";
import { BlockType } from "../../interface/block.interface";
import { BlockTypeSelectorList } from "../shared/block-type-selector-list";

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
    onBlockTypeSelect,
}) => {
    const { data: blockTypes, isLoading, error } = useBlockTypes(organisationId);

    const handleSelect = (blockType: BlockType) => {
        onBlockTypeSelect(blockType);
        onOpenChange(false);
    };

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Search block types..." />
            <BlockTypeSelectorList
                blockTypes={blockTypes}
                isLoading={isLoading}
                error={error}
                onSelect={handleSelect}
            />
        </CommandDialog>
    );
};
