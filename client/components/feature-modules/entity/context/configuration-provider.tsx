"use client";

import { EntityPropertyType } from "@/lib/types/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useForm, useFormState } from "react-hook-form";
import { toast } from "sonner";
import { isUUID } from "validator";
import { z } from "zod";
import { useStore } from "zustand";
import { baseEntityTypeFormSchema } from "../hooks/form/type/use-new-type-form";
import { useSaveEntityTypeConfiguration } from "../hooks/mutation/type/use-save-configuration-mutation";
import { EntityType } from "../interface/entity.interface";
import {
    createEntityTypeConfigStore,
    EntityTypeConfigStore,
} from "../stores/type/configuration.store";

type EntityTypeConfigStoreApi = ReturnType<typeof createEntityTypeConfigStore>;

const EntityTypeConfigContext = createContext<EntityTypeConfigStoreApi | undefined>(undefined);

export interface EntityTypeConfigurationProviderProps {
    children: ReactNode;
    organisationId: string;
    entityType: EntityType;
}

// Zod schema for entity type form
const entityTypeFormSchema = z
    .object({
        identifierKey: z.string().min(1, "Identifier key is required").refine(isUUID),
        order: z.array(
            z.object({
                key: z.string().min(1, "Ordering key is required").refine(isUUID),
                type: z.nativeEnum(EntityPropertyType),
            })
        ),
    })
    .extend(baseEntityTypeFormSchema.shape);

export type EntityTypeFormValues = z.infer<typeof entityTypeFormSchema>;

export const EntityTypeConfigurationProvider = ({
    children,
    organisationId,
    entityType,
}: EntityTypeConfigurationProviderProps) => {
    const storeRef = useRef<EntityTypeConfigStoreApi | null>(null);
    const unsavedToastRef = useRef<string | number | undefined>(undefined);

    // Create form instance
    const form = useForm<EntityTypeFormValues>({
        resolver: zodResolver(entityTypeFormSchema),
        defaultValues: {
            key: entityType.key,
            singularName: entityType.name.singular,
            pluralName: entityType.name.plural,
            identifierKey: entityType.identifierKey,
            description: entityType.description ?? "",
            type: entityType.type,
            icon: entityType.icon.icon,
            iconColour: entityType.icon.colour,
            order: entityType.order,
        },
    });

    // Create mutation function
    const { mutateAsync: updateType } = useSaveEntityTypeConfiguration(organisationId, {
        onSuccess: () => {
            // These will be called from the store's handleSubmit
        },
    });

    // Create store only once per entity type
    if (!storeRef.current) {
        storeRef.current = createEntityTypeConfigStore(
            entityType.key,
            organisationId,
            entityType,
            form,
            updateType
        );
    }

    // Load draft and set up form watchers on mount
    useEffect(() => {
        const store = storeRef.current?.getState();
        if (!store) return;

        // Check for draft and prompt user to restore
        const draft = store.loadDraft();
        if (draft && !unsavedToastRef.current) {
            unsavedToastRef.current = toast.info("Unsaved changes found", {
                description: "Would you like to restore your previous changes?",
                action: {
                    label: "Restore",
                    onClick: () => {
                        form.reset(draft, {
                            keepDefaultValues: true,
                        });
                        store.setDirty(true);
                    },
                },
            });
        }
    }, [entityType.key]);

    const { dirtyFields } = useFormState({
        control: form.control,
    });

    // Subscribe to form changes for dirty state tracking and auto-save
    useEffect(() => {
        const store = storeRef.current?.getState();
        if (!store) return;

        const debouncedSaveRef = { current: null as NodeJS.Timeout | null };

        const subscription = form.watch((values) => {
            const dirty = Object.keys(dirtyFields).length > 0;
            store.setDirty(dirty);

            if (dirty) {
                if (debouncedSaveRef.current) {
                    clearTimeout(debouncedSaveRef.current);
                }

                debouncedSaveRef.current = setTimeout(() => {
                    store.saveDraft(values);
                }, 1000);
            }
        });

        return () => {
            subscription.unsubscribe();
            if (debouncedSaveRef.current) {
                clearTimeout(debouncedSaveRef.current);
            }
        };
    }, [form]);

    return (
        <EntityTypeConfigContext.Provider value={storeRef.current}>
            {children}
        </EntityTypeConfigContext.Provider>
    );
};

// Hook to access store with selector
export const useEntityTypeConfigurationStore = <T,>(
    selector: (store: EntityTypeConfigStore) => T
): T => {
    const context = useContext(EntityTypeConfigContext);

    if (!context) {
        throw new Error(
            "useEntityTypeConfigurationStore must be used within EntityTypeConfigurationProvider"
        );
    }

    return useStore(context, selector);
};

export const useConfigFormState = () => {
    return useEntityTypeConfigurationStore((state) => state);
};

// Optimized hooks for common access patterns
export const useConfigForm = () => {
    return useEntityTypeConfigurationStore((state) => state.form);
};

export const useConfigIsDirty = () => {
    return useEntityTypeConfigurationStore((state) => state.isDirty);
};
