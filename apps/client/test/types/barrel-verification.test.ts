// Verification that domain barrels export correctly

// Entity barrel imports
import type {
    EntityType,
    EntityAttribute,
    EntityRelationshipDefinition,
    EntityTypeDefinition,
    EntityTypeAttributeRow,
    SaveEntityRequest,
    EntityTypeImpactResponse,
} from "@/lib/types/entity";
import {
    isRelationshipDefinition,
    isAttributeDefinition,
    RelationshipLimit,
} from "@/lib/types/entity";

// Block barrel imports
import type {
    Block,
    BlockType,
    BlockTree,
    BlockNode,
    ContentNode,
    CreateBlockTypeRequest,
    BlockHydrationResult,
} from "@/lib/types/block";
import {
    isContentMetadata,
    isContentNode,
    isReferenceNode,
} from "@/lib/types/block";

describe("Type barrel exports", () => {
    it("entity barrel exports types correctly", () => {
        // Type-level checks - if this compiles, types work
        const checkType = (entity: EntityType) => entity.key;
        const checkCustom = (def: EntityTypeDefinition) => def.id;
        const checkEnum = RelationshipLimit.SINGULAR;
        expect(typeof isRelationshipDefinition).toBe("function");
        expect(typeof isAttributeDefinition).toBe("function");
    });

    it("block barrel exports types correctly", () => {
        // Type-level checks - if this compiles, types work
        const checkType = (block: Block) => block.id;
        const checkNode = (node: BlockNode) => node.type;
        expect(typeof isContentMetadata).toBe("function");
        expect(typeof isContentNode).toBe("function");
    });

    it("entity type guards are callable functions", () => {
        // Verify type guards are exported as functions
        expect(typeof isRelationshipDefinition).toBe("function");
        expect(typeof isAttributeDefinition).toBe("function");
    });

    it("block type guards are callable functions", () => {
        // Verify type guards are exported as functions
        expect(typeof isContentMetadata).toBe("function");
        expect(typeof isContentNode).toBe("function");
        expect(typeof isReferenceNode).toBe("function");
    });

    it("RelationshipLimit enum is accessible", () => {
        expect(RelationshipLimit.SINGULAR).toBe(0);
        expect(RelationshipLimit.MANY).toBe(1);
    });
});
