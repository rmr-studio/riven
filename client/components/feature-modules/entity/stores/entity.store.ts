import { EntityPropertyType } from "@/lib/types/types";
import { buildDefaultValuesFromEntityType } from "@/lib/util/form/entity-instance-validation.util";
import { UseFormReturn } from "react-hook-form";
import { create, StoreApi } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
    EntityAttributePrimitivePayload,
    EntityAttributeRelationPayloadReference,
    EntityAttributeRequest,
    EntityType,
    SaveEntityRequest,
    SaveEntityResponse,
} from "../interface/entity.interface";

// Metadata for each attribute/relationship

// State interface
interface EntityDraftState {
    // Organization and entity type data
    organisationId: string;
    entityType: EntityType;

    // Memoized map of attribute ID -> metadata for fast lookups
    attributeMetadataMap: Map<string, EntityPropertyType>;

    // Draft mode flag
    isDraftMode: boolean;

    // React Hook Form instance
    form: UseFormReturn<Record<string, any>>;

    // Draft values for persistence
    draftValues: Record<string, any> | null;

    // Timestamp for staleness detection
    lastModifiedAt: number | null;
}

// Actions interface
interface EntityDraftActions {
    // Enter draft mode (initialize new entity draft)
    enterDraftMode: () => void;

    // Exit draft mode (clear draft and reset form)
    exitDraftMode: () => void;

    // Save draft to localStorage
    saveDraft: (values: Record<string, any>) => void;

    // Load draft from localStorage
    loadDraft: () => Record<string, any> | null;

    // Clear draft from localStorage
    clearDraft: () => void;

    // Submit draft (create entity)
    submitDraft: () => Promise<SaveEntityResponse>;

    // Reset draft (exit draft mode)
    resetDraft: () => void;
}

export type EntityDraftStore = EntityDraftState & EntityDraftActions;

/**
 * Build a memoized map of attribute ID -> metadata
 * This allows O(1) lookup to determine if an attribute is a schema attribute or relationship
 */
const buildAttributeMetadataMap = (entityType: EntityType): Map<string, EntityPropertyType> => {
    const map = new Map<string, EntityPropertyType>();

    // Add schema attributes
    if (entityType.schema?.properties) {
        Object.entries(entityType.schema.properties).forEach(([attributeId, schema]) => {
            map.set(attributeId, EntityPropertyType.ATTRIBUTE);
        });
    }

    // Add relationships
    if (entityType.relationships) {
        entityType.relationships.forEach((relationship) => {
            map.set(relationship.id, EntityPropertyType.RELATIONSHIP);
        });
    }

    return map;
};

// Store factory (per-entity-type instances)
export const createEntityDraftStore = (
    organisationId: string,
    entityType: EntityType,
    form: UseFormReturn<Record<string, any>>,
    saveMutation: (request: SaveEntityRequest) => Promise<SaveEntityResponse>
): StoreApi<EntityDraftStore> => {
    const storageKey = `entity-instance-draft-${organisationId}-${entityType.key}`;

    // Build attribute metadata map once during initialization
    const attributeMetadataMap = buildAttributeMetadataMap(entityType);

    return create<EntityDraftStore>()(
        subscribeWithSelector((set, get) => ({
            // Initial state
            organisationId,
            entityType,
            attributeMetadataMap,
            isDraftMode: false,
            form,
            draftValues: null,
            lastModifiedAt: null,

            enterDraftMode: () => {
                // Build default values from entity type schema
                const defaultValues = buildDefaultValuesFromEntityType(entityType);

                // Reset form with defaults
                form.reset(defaultValues);

                // Enter draft mode
                set({
                    isDraftMode: true,
                    lastModifiedAt: Date.now(),
                });
            },

            exitDraftMode: () => {
                // Reset form
                form.reset({});

                // Clear draft from storage
                get().clearDraft();

                // Exit draft mode
                set({
                    isDraftMode: false,
                    draftValues: null,
                    lastModifiedAt: null,
                });
            },

            saveDraft: (values) => {
                try {
                    const draft = { ...values, _timestamp: Date.now() };
                    localStorage.setItem(storageKey, JSON.stringify(draft));
                    set({
                        draftValues: values,
                        lastModifiedAt: Date.now(),
                    });
                } catch (error) {
                    console.error("Failed to save draft:", error);
                }
            },

            loadDraft: () => {
                try {
                    const stored = localStorage.getItem(storageKey);
                    if (!stored) return null;

                    const draft = JSON.parse(stored);
                    const { _timestamp, ...values } = draft;

                    // Check if draft is stale (older than 7 days)
                    const isStale = Date.now() - _timestamp > 7 * 24 * 60 * 60 * 1000;
                    if (isStale) {
                        localStorage.removeItem(storageKey);
                        return null;
                    }

                    set({ draftValues: values });
                    return values;
                } catch (error) {
                    console.error("Failed to load draft:", error);
                    return null;
                }
            },

            clearDraft: () => {
                try {
                    localStorage.removeItem(storageKey);
                    set({ draftValues: null });
                } catch (error) {
                    console.error("Failed to clear draft:", error);
                }
            },

            submitDraft: async () => {
                const { form, attributeMetadataMap } = get();

                // Get current form values
                const values = form.getValues();

                // Validate all fields
                const isValid = await form.trigger();

                if (!isValid) {
                    throw new Error("Validation failed. Please correct the errors and try again.");
                }

                // Transform form values into request payload
                const payload: Record<string, EntityAttributeRequest> = {};

                Object.entries(values).forEach(([key, value]) => {
                    const metadata = attributeMetadataMap.get(key);

                    if (!metadata) {
                        console.warn(`No metadata found for attribute: ${key}`);
                        return;
                    }

                    if (metadata === EntityPropertyType.ATTRIBUTE) {
                        const attribute = entityType.schema.properties?.[key];
                        if (!attribute) return;

                        // Schema attribute - create primitive payload
                        const primitivePayload: EntityAttributePrimitivePayload = {
                            value: value as any, // JsonValue (Any)
                            schemaType: attribute.key,
                            type: EntityPropertyType.ATTRIBUTE,
                        };

                        payload[key] = {
                            payload: primitivePayload,
                        };
                    } else if (metadata === EntityPropertyType.RELATIONSHIP) {
                        // Relationship - create relation payload
                        // Normalize to array of UUIDs
                        const relations = Array.isArray(value) ? value : value ? [value] : [];

                        const relationPayload: EntityAttributeRelationPayloadReference = {
                            relations,
                            type: EntityPropertyType.RELATIONSHIP,
                        };

                        payload[key] = {
                            payload: relationPayload,
                        };
                    }
                });

                const request: SaveEntityRequest = { payload };

                // Call the save mutation
                const response = await saveMutation(request);

                // Exit draft mode and clear draft
                get().exitDraftMode();

                return response;
            },

            resetDraft: () => {
                // Simply exit draft mode (which clears everything)
                get().exitDraftMode();
            },
        }))
    );
};

// Export store API type for TypeScript
export type EntityDraftStoreApi = ReturnType<typeof createEntityDraftStore>;
