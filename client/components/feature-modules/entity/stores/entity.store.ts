import { buildDefaultValuesFromEntityType } from "@/lib/util/form/entity-instance-validation.util";
import { UseFormReturn } from "react-hook-form";
import { create, StoreApi } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Entity, EntityType } from "../interface/entity.interface";

// State interface
interface EntityDraftState {
    // Organization and entity type data
    organisationId: string;
    entityType: EntityType;

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
    submitDraft: () => Promise<Entity>;

    // Reset draft (exit draft mode)
    resetDraft: () => void;
}

export type EntityDraftStore = EntityDraftState & EntityDraftActions;

// Store factory (per-entity-type instances)
export const createEntityDraftStore = (
    organisationId: string,
    entityType: EntityType,
    form: UseFormReturn<Record<string, any>>,
    createMutation: (payload: Record<string, any>) => Promise<Entity>
): StoreApi<EntityDraftStore> => {
    const storageKey = `entity-instance-draft-${organisationId}-${entityType.key}`;

    return create<EntityDraftStore>()(
        subscribeWithSelector((set, get) => ({
            // Initial state
            organisationId,
            entityType,
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
                const { form } = get();

                // Get current form values
                const values = form.getValues();

                // Validate all fields
                const isValid = await form.trigger();

                if (!isValid) {
                    throw new Error("Validation failed. Please correct the errors and try again.");
                }

                // Create the entity
                const entity = await createMutation(values);

                // Exit draft mode and clear draft
                get().exitDraftMode();

                return entity;
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
