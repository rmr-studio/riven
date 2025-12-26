"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { useStore } from "zustand";
import { buildZodSchemaFromEntityType } from "@/lib/util/form/entity-instance-validation.util";
import { useCreateEntityMutation } from "../hooks/mutation/instance/use-create-entity-mutation";
import { Entity, EntityType } from "../interface/entity.interface";
import {
    createEntityInstanceDraftStore,
    EntityInstanceDraftStore,
    EntityInstanceDraftStoreApi,
} from "../stores/instance/draft.store";

const EntityInstanceDraftContext = createContext<EntityInstanceDraftStoreApi | undefined>(
    undefined
);

export interface EntityInstanceDraftProviderProps {
    children: ReactNode;
    organisationId: string;
    entityType: EntityType;
    onEntityCreated?: (entity: Entity) => void;
}

export const EntityInstanceDraftProvider = ({
    children,
    organisationId,
    entityType,
    onEntityCreated,
}: EntityInstanceDraftProviderProps) => {
    const storeRef = useRef<EntityInstanceDraftStoreApi | null>(null);
    const unsavedToastRef = useRef<string | number | undefined>(undefined);

    // Build dynamic Zod schema from entity type
    const schema = useMemo(
        () => buildZodSchemaFromEntityType(entityType),
        [entityType.key, entityType.schema, entityType.relationships]
    );

    // Create form instance with dynamic schema
    const form = useForm<Record<string, any>>({
        resolver: zodResolver(schema),
        defaultValues: {},
        mode: "onBlur", // Validate on blur (user preference)
    });

    // Create mutation for entity creation
    const { mutateAsync: createEntity } = useCreateEntityMutation(
        organisationId,
        entityType.key,
        {
            onSuccess: (entity) => {
                onEntityCreated?.(entity);
            },
        }
    );

    // Create store only once per entity type
    if (!storeRef.current) {
        storeRef.current = createEntityInstanceDraftStore(
            organisationId,
            entityType,
            form,
            createEntity
        );
    }

    // Load draft and prompt restoration on mount
    useEffect(() => {
        const store = storeRef.current?.getState();
        if (!store) return;

        // Check for draft and prompt user to restore
        const draft = store.loadDraft();
        if (draft && !unsavedToastRef.current) {
            unsavedToastRef.current = toast.info("Unsaved draft found", {
                description: "Would you like to restore your previous draft entity?",
                action: {
                    label: "Restore",
                    onClick: () => {
                        form.reset(draft);
                        store.enterDraftMode();
                    },
                },
                cancel: {
                    label: "Dismiss",
                    onClick: () => {
                        store.clearDraft();
                    },
                },
                onDismiss: () => {
                    store.clearDraft();
                },
            });
        }
    }, [entityType.key]);

    // Subscribe to form changes for auto-save when in draft mode
    useEffect(() => {
        const store = storeRef.current?.getState();
        if (!store) return;

        const debouncedSaveRef = { current: null as NodeJS.Timeout | null };

        const subscription = form.watch((values) => {
            // Only auto-save when in draft mode
            if (!store.isDraftMode) return;

            // Debounce save (1 second)
            if (debouncedSaveRef.current) {
                clearTimeout(debouncedSaveRef.current);
            }

            debouncedSaveRef.current = setTimeout(() => {
                store.saveDraft(values);
            }, 1000);
        });

        return () => {
            subscription.unsubscribe();
            if (debouncedSaveRef.current) {
                clearTimeout(debouncedSaveRef.current);
            }
        };
    }, [form]);

    return (
        <EntityInstanceDraftContext.Provider value={storeRef.current}>
            <FormProvider {...form}>{children}</FormProvider>
        </EntityInstanceDraftContext.Provider>
    );
};

// Hook to access store with selector
export const useEntityInstanceDraftStore = <T,>(
    selector: (store: EntityInstanceDraftStore) => T
): T => {
    const context = useContext(EntityInstanceDraftContext);

    if (!context) {
        throw new Error(
            "useEntityInstanceDraftStore must be used within EntityInstanceDraftProvider"
        );
    }

    return useStore(context, selector);
};

// Optimized hook for accessing draft mode state
export const useIsDraftMode = () => {
    return useEntityInstanceDraftStore((state) => state.isDraftMode);
};

// Hook to access the form context
export const useDraftForm = () => {
    return useFormContext<Record<string, any>>();
};
