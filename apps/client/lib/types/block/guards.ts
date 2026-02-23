// Type guards for block discriminated unions

import type {
    Block,
    ContentNode,
    ReferenceNode,
    BlockContentMetadata,
    BlockReferenceMetadata,
    EntityReferenceMetadata,
} from "./models";
import type { BlockNode } from "./custom";
import { BlockMetadataType } from "../models/BlockMetadataType";
import { NodeType } from "../models/NodeType";

export const isContentMetadata = (
    payload: Block["payload"]
): payload is BlockContentMetadata => payload?.type === BlockMetadataType.Content;

export const isBlockReferenceMetadata = (
    payload: Block["payload"]
): payload is BlockReferenceMetadata => payload?.type === BlockMetadataType.BlockReference;

export const isEntityReferenceMetadata = (
    payload: Block["payload"]
): payload is EntityReferenceMetadata => payload?.type === BlockMetadataType.EntityReference;

export const isContentNode = (node: BlockNode): node is ContentNode =>
    !!node.block && node.type === NodeType.Content;

export const isReferenceNode = (node: BlockNode): node is ReferenceNode =>
    !!node.block && node.type === NodeType.Reference;
