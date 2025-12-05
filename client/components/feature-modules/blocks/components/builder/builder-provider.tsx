"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
	BlockSchema,
	BlockTypeBuilderState,
	BuilderContextValue,
	BuilderStep,
	ValidationError,
	BlockFormStructure,
	FormWidgetConfig,
	BlockComponentNode,
	BlockTypeNesting,
	GridRect,
	LayoutGrid,
	BlockBinding,
	BlockValidationScope,
} from "./types/builder.types";
import { DataType } from "@/lib/types/types";

const DRAFT_STORAGE_KEY = "block-type-builder-draft";

/**
 * Creates the initial default state for a new block type
 */
function createInitialState(): BlockTypeBuilderState {
	return {
		// Basic info
		id: null,
		key: "",
		name: "",
		description: "",

		// Schema - start with a simple root object
		schema: {
			name: "Root",
			type: "OBJECT" as DataType,
			required: true,
			properties: {},
		},

		// Form - empty initially
		form: {
			fields: {},
		},

		// Render - minimal structure
		render: {
			version: 1,
			layoutGrid: {
				layout: {
					x: 0,
					y: 0,
					width: 12,
					height: 10,
					locked: false,
				},
				items: [],
			},
			components: {},
		},

		// Nesting
		nesting: null,
		nestingEnabled: false,

		// Validation
		strictness: "SOFT" as BlockValidationScope,

		// Wizard state
		currentStep: BuilderStep.BASIC_INFO,
		validationErrors: new Map(),

		// Preview
		previewData: {},

		// Draft state
		isDraft: true,
		lastSaved: null,
	};
}

export const BuilderContext = createContext<BuilderContextValue | null>(null);

interface BuilderProviderProps {
	children: React.ReactNode;
	initialState?: Partial<BlockTypeBuilderState>;
}

export const BuilderProvider: React.FC<BuilderProviderProps> = ({ children, initialState }) => {
	const [state, setState] = useState<BlockTypeBuilderState>(() => {
		// Try to load from localStorage first
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					return {
						...createInitialState(),
						...parsed,
						validationErrors: new Map(parsed.validationErrors || []),
					};
				} catch (e) {
					console.warn("Failed to load draft from localStorage", e);
				}
			}
		}

		return {
			...createInitialState(),
			...initialState,
		};
	});

	// Basic info operations
	const updateBasicInfo = useCallback(
		(updates: { name?: string; key?: string; description?: string; icon?: string }) => {
			setState((prev) => ({
				...prev,
				...updates,
				// Auto-generate key from name if name is provided and key is empty
				key:
					updates.name && !prev.key
						? updates.name
								.toLowerCase()
								.replace(/[^a-z0-9]+/g, "_")
								.replace(/^_|_$/g, "")
						: updates.key ?? prev.key,
			}));
		},
		[]
	);

	// Schema operations
	const updateSchema = useCallback((schema: BlockSchema) => {
		setState((prev) => ({ ...prev, schema }));
	}, []);

	const addSchemaField = useCallback((parentPath: string | null, field: BlockSchema) => {
		setState((prev) => {
			const newSchema = { ...prev.schema };

			if (parentPath === null) {
				// Adding to root
				if (newSchema.type === "OBJECT" && newSchema.properties) {
					newSchema.properties = {
						...newSchema.properties,
						[field.name]: field,
					};
				}
			} else {
				// Adding to nested object - implement path traversal
				// This is simplified; full implementation would need schema utilities
				console.warn("Nested field addition not yet implemented");
			}

			return { ...prev, schema: newSchema };
		});
	}, []);

	const removeSchemaField = useCallback((path: string) => {
		setState((prev) => {
			// Simplified implementation
			// Full version would use schema utilities for path traversal
			const newSchema = { ...prev.schema };
			const parts = path.split("/");

			if (
				parts.length === 1 &&
				newSchema.type === "OBJECT" &&
				newSchema.properties
			) {
				const { [parts[0]]: removed, ...rest } = newSchema.properties;
				newSchema.properties = rest;
			}

			return { ...prev, schema: newSchema };
		});
	}, []);

	const updateSchemaField = useCallback(
		(path: string, updates: Partial<BlockSchema>) => {
			setState((prev) => {
				// Simplified implementation
				const newSchema = { ...prev.schema };
				const parts = path.split("/");

				if (
					parts.length === 1 &&
					newSchema.type === "OBJECT" &&
					newSchema.properties &&
					newSchema.properties[parts[0]]
				) {
					newSchema.properties = {
						...newSchema.properties,
						[parts[0]]: {
							...newSchema.properties[parts[0]],
							...updates,
						},
					};
				}

				return { ...prev, schema: newSchema };
			});
		},
		[]
	);

	const reorderSchemaFields = useCallback(
		(parentPath: string | null, fromIndex: number, toIndex: number) => {
			// Would be implemented with proper schema utilities
			console.warn("Schema reordering not yet implemented");
		},
		[]
	);

	// Form operations
	const updateFormStructure = useCallback((form: BlockFormStructure) => {
		setState((prev) => ({ ...prev, form }));
	}, []);

	const updateWidgetConfig = useCallback(
		(fieldPath: string, config: FormWidgetConfig) => {
			setState((prev) => ({
				...prev,
				form: {
					...prev.form,
					fields: {
						...prev.form.fields,
						[fieldPath]: config,
					},
				},
			}));
		},
		[]
	);

	const removeFormField = useCallback((fieldPath: string) => {
		setState((prev) => {
			const { [fieldPath]: removed, ...rest } = prev.form.fields;
			return {
				...prev,
				form: {
					...prev.form,
					fields: rest,
				},
			};
		});
	}, []);

	const reorderFormFields = useCallback((fromIndex: number, toIndex: number) => {
		// Would need to track field order separately
		console.warn("Form field reordering not yet implemented");
	}, []);

	// Render operations
	const addComponent = useCallback((component: BlockComponentNode) => {
		setState((prev) => ({
			...prev,
			render: {
				...prev.render,
				components: {
					...prev.render.components,
					[component.id]: component,
				},
			},
		}));
	}, []);

	const updateComponent = useCallback(
		(id: string, updates: Partial<BlockComponentNode>) => {
			setState((prev) => {
				const existing = prev.render.components[id];
				if (!existing) return prev;

				return {
					...prev,
					render: {
						...prev.render,
						components: {
							...prev.render.components,
							[id]: {
								...existing,
								...updates,
							},
						},
					},
				};
			});
		},
		[]
	);

	const removeComponent = useCallback((id: string) => {
		setState((prev) => {
			const { [id]: removed, ...rest } = prev.render.components;
			const newItems = prev.render.layoutGrid.items.filter((item) => item.id !== id);

			return {
				...prev,
				render: {
					...prev.render,
					components: rest,
					layoutGrid: {
						...prev.render.layoutGrid,
						items: newItems,
					},
				},
			};
		});
	}, []);

	const updateComponentLayout = useCallback((id: string, rect: GridRect) => {
		setState((prev) => {
			const itemIndex = prev.render.layoutGrid.items.findIndex((item) => item.id === id);

			if (itemIndex === -1) {
				// Add new layout item
				return {
					...prev,
					render: {
						...prev.render,
						layoutGrid: {
							...prev.render.layoutGrid,
							items: [...prev.render.layoutGrid.items, { id, rect }],
						},
					},
				};
			}

			// Update existing item
			const newItems = [...prev.render.layoutGrid.items];
			newItems[itemIndex] = { ...newItems[itemIndex], rect };

			return {
				...prev,
				render: {
					...prev.render,
					layoutGrid: {
						...prev.render.layoutGrid,
						items: newItems,
					},
				},
			};
		});
	}, []);

	const addBinding = useCallback((componentId: string, binding: BlockBinding) => {
		setState((prev) => {
			const component = prev.render.components[componentId];
			if (!component) return prev;

			return {
				...prev,
				render: {
					...prev.render,
					components: {
						...prev.render.components,
						[componentId]: {
							...component,
							bindings: [...component.bindings, binding],
						},
					},
				},
			};
		});
	}, []);

	const updateBinding = useCallback(
		(componentId: string, bindingIndex: number, binding: BlockBinding) => {
			setState((prev) => {
				const component = prev.render.components[componentId];
				if (!component) return prev;

				const newBindings = [...component.bindings];
				newBindings[bindingIndex] = binding;

				return {
					...prev,
					render: {
						...prev.render,
						components: {
							...prev.render.components,
							[componentId]: {
								...component,
								bindings: newBindings,
							},
						},
					},
				};
			});
		},
		[]
	);

	const removeBinding = useCallback((componentId: string, bindingIndex: number) => {
		setState((prev) => {
			const component = prev.render.components[componentId];
			if (!component) return prev;

			const newBindings = component.bindings.filter((_, i) => i !== bindingIndex);

			return {
				...prev,
				render: {
					...prev.render,
					components: {
						...prev.render.components,
						[componentId]: {
							...component,
							bindings: newBindings,
						},
					},
				},
			};
		});
	}, []);

	const updateRenderLayout = useCallback((layoutGrid: LayoutGrid) => {
		setState((prev) => ({
			...prev,
			render: {
				...prev.render,
				layoutGrid,
			},
		}));
	}, []);

	// Nesting operations
	const updateNesting = useCallback((nesting: BlockTypeNesting | null) => {
		setState((prev) => ({ ...prev, nesting }));
	}, []);

	const setNestingEnabled = useCallback((enabled: boolean) => {
		setState((prev) => ({
			...prev,
			nestingEnabled: enabled,
			nesting: enabled ? prev.nesting || { max: undefined, allowedTypes: [] } : null,
		}));
	}, []);

	// Validation operations
	const updateStrictness = useCallback((strictness: BlockValidationScope) => {
		setState((prev) => ({ ...prev, strictness }));
	}, []);

	const validateStep = useCallback(
		(step: BuilderStep): ValidationError[] => {
			const errors: ValidationError[] = [];

			switch (step) {
				case BuilderStep.BASIC_INFO:
					if (!state.name.trim()) {
						errors.push({ field: "name", message: "Name is required" });
					}
					if (!state.key.trim()) {
						errors.push({ field: "key", message: "Key is required" });
					}
					break;

				case BuilderStep.SCHEMA_DESIGNER:
					if (
						state.schema.type === "OBJECT" &&
						(!state.schema.properties || Object.keys(state.schema.properties).length === 0)
					) {
						errors.push({
							field: "schema",
							message: "At least one field is required",
						});
					}
					break;

				case BuilderStep.FORM_CONFIG:
					// Check that all required schema fields have form widgets
					// Simplified check for now
					break;

				case BuilderStep.RENDER_DESIGNER:
					if (Object.keys(state.render.components).length === 0) {
						errors.push({
							field: "components",
							message: "At least one component is required",
						});
					}
					break;

				case BuilderStep.NESTING_RULES:
					if (
						state.nestingEnabled &&
						state.nesting &&
						state.nesting.allowedTypes.length === 0
					) {
						errors.push({
							field: "allowedTypes",
							message: "At least one allowed type is required when nesting is enabled",
						});
					}
					break;
			}

			return errors;
		},
		[state]
	);

	const validateAll = useCallback((): boolean => {
		const allErrors = new Map<BuilderStep, ValidationError[]>();

		for (let step = BuilderStep.BASIC_INFO; step <= BuilderStep.PREVIEW_SAVE; step++) {
			const errors = validateStep(step);
			if (errors.length > 0) {
				allErrors.set(step, errors);
			}
		}

		setState((prev) => ({ ...prev, validationErrors: allErrors }));
		return allErrors.size === 0;
	}, [validateStep]);

	// Navigation
	const goToStep = useCallback((step: BuilderStep) => {
		setState((prev) => ({ ...prev, currentStep: step }));
	}, []);

	const nextStep = useCallback(() => {
		setState((prev) => {
			const nextStep = Math.min(prev.currentStep + 1, BuilderStep.PREVIEW_SAVE);
			return { ...prev, currentStep: nextStep };
		});
	}, []);

	const prevStep = useCallback(() => {
		setState((prev) => {
			const prevStep = Math.max(prev.currentStep - 1, BuilderStep.BASIC_INFO);
			return { ...prev, currentStep: prevStep };
		});
	}, []);

	const canGoNext = useCallback((): boolean => {
		return state.currentStep < BuilderStep.PREVIEW_SAVE;
	}, [state.currentStep]);

	const canGoPrev = useCallback((): boolean => {
		return state.currentStep > BuilderStep.BASIC_INFO;
	}, [state.currentStep]);

	// Preview
	const updatePreviewData = useCallback((data: Record<string, unknown>) => {
		setState((prev) => ({ ...prev, previewData: data }));
	}, []);

	// Actions
	const saveDraft = useCallback(async () => {
		if (typeof window !== "undefined") {
			const draft = {
				...state,
				validationErrors: Array.from(state.validationErrors.entries()),
				lastSaved: new Date(),
			};

			localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
			setState((prev) => ({ ...prev, lastSaved: new Date() }));
		}
	}, [state]);

	const publish = useCallback(async () => {
		// Validate all steps
		if (!validateAll()) {
			throw new Error("Validation failed. Please fix errors before publishing.");
		}

		// Create the request payload
		const createRequest = {
			key: state.key,
			name: state.name,
			description: state.description || undefined,
			mode: state.strictness,
			schema: state.schema,
			display: {
				form: state.form,
				render: state.render,
			},
			organisationId: "", // Would be provided from context/props
		};

		// TODO: Make API call to create block type
		// const response = await fetch('/api/v1/block/schema/', {
		//   method: 'POST',
		//   body: JSON.stringify(createRequest),
		// });

		// For now, just return a mock response
		console.log("Publishing block type:", createRequest);
		throw new Error("API integration not yet implemented");
	}, [state, validateAll]);

	const reset = useCallback(() => {
		setState(createInitialState());
		if (typeof window !== "undefined") {
			localStorage.removeItem(DRAFT_STORAGE_KEY);
		}
	}, []);

	const loadDraft = useCallback((draftId: string) => {
		// Would load a specific draft
		console.warn("Load draft not yet implemented");
	}, []);

	const contextValue = useMemo<BuilderContextValue>(
		() => ({
			state,
			updateBasicInfo,
			updateSchema,
			addSchemaField,
			removeSchemaField,
			updateSchemaField,
			reorderSchemaFields,
			updateFormStructure,
			updateWidgetConfig,
			removeFormField,
			reorderFormFields,
			addComponent,
			updateComponent,
			removeComponent,
			updateComponentLayout,
			addBinding,
			updateBinding,
			removeBinding,
			updateRenderLayout,
			updateNesting,
			setNestingEnabled,
			updateStrictness,
			validateStep,
			validateAll,
			goToStep,
			nextStep,
			prevStep,
			canGoNext,
			canGoPrev,
			updatePreviewData,
			saveDraft,
			publish,
			reset,
			loadDraft,
		}),
		[
			state,
			updateBasicInfo,
			updateSchema,
			addSchemaField,
			removeSchemaField,
			updateSchemaField,
			reorderSchemaFields,
			updateFormStructure,
			updateWidgetConfig,
			removeFormField,
			reorderFormFields,
			addComponent,
			updateComponent,
			removeComponent,
			updateComponentLayout,
			addBinding,
			updateBinding,
			removeBinding,
			updateRenderLayout,
			updateNesting,
			setNestingEnabled,
			updateStrictness,
			validateStep,
			validateAll,
			goToStep,
			nextStep,
			prevStep,
			canGoNext,
			canGoPrev,
			updatePreviewData,
			saveDraft,
			publish,
			reset,
			loadDraft,
		]
	);

	return <BuilderContext.Provider value={contextValue}>{children}</BuilderContext.Provider>;
};

/**
 * Hook to access the builder context
 */
export function useBuilder(): BuilderContextValue {
	const context = useContext(BuilderContext);
	if (!context) {
		throw new Error("useBuilder must be used within a BuilderProvider");
	}
	return context;
}
