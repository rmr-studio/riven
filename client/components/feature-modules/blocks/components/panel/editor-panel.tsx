import { ReactNode, useCallback } from "react";
import { BlockNode } from "../../interface/block.interface";
import { SlashMenuItem } from "../../interface/panel.interface";
import { WrapElementProvider } from "../../interface/render.interface";
import { getTitle } from "../../util/block/block.util";
import {
    createLayoutContainerNode,
    createNoteNode,
    createProjectBlockNode,
} from "../../util/block/factory/mock.factory";
import { PanelWrapper } from "./panel-wrapper";

interface EditorPanelCallackProps {
    getBlock: (id: string) => BlockNode | undefined;
    insertBlock: (node: BlockNode, parentId: string, index: number | null) => void;
    removeBlock: (id: string) => void;
    getParent: (id: string) => BlockNode | null;
}

export const editorPanel = ({
    getBlock,
    insertBlock,
    removeBlock,
    getParent,
}: EditorPanelCallackProps) => {
    const wrapper = useCallback(
        ({ children, content, widget }: WrapElementProvider): ReactNode => {
            // Get associated node from block environment
            const node = getBlock(content.id);
            if (!node) return children;

            const { block } = node;
            const { id, workspaceId, type } = block;

            // Create callback handlers for block toolbar
            const handleDelete = () => removeBlock(id);

            const handleInsert = (item: SlashMenuItem) => {
                if (!type.nesting || !workspaceId) return;
                const newNode = createNodeFromSlashItem(item, workspaceId);
                if (!newNode) return;
                insertBlock(newNode, id, null);
            };

            const quickActions = [
                {
                    id: "delete",
                    label: "Delete block",
                    shortcut: "⌘⌫",
                    onSelect: handleDelete,
                },
            ];

            const title = getTitle(node);

            return (
                <PanelWrapper
                    id={id}
                    title={title}
                    description={type.description}
                    quickActions={quickActions}
                    allowInsert={!!type.nesting}
                    onDelete={handleDelete}
                >
                    {children}
                </PanelWrapper>
            );
        },
        [getBlock, insertBlock, removeBlock, getParent]
    );

    return { wrapper };
};

export function createNodeFromSlashItem(
    item: SlashMenuItem,
    workspaceId: string
): BlockNode | null {
    switch (item.id) {
        case "LAYOUT_CONTAINER":
        case "LINE_ITEM":
            return createLayoutContainerNode(workspaceId);
        case "TEXT":
        case "BLANK_NOTE":
            return createNoteNode(workspaceId);
        case "PROJECT_OVERVIEW":
            return createProjectBlockNode(workspaceId);
        default:
            return createNoteNode(workspaceId, `New ${item.label}`);
    }
}
