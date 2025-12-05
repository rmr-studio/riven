import type { components } from "@/lib/types/types";

// Re-export commonly used types from API
export type BlockSchema = components["schemas"]["BlockSchema"];
export type BlockDisplay = components["schemas"]["BlockDisplay"];
export type BlockFormStructure = components["schemas"]["BlockFormStructure"];
export type BlockRenderStructure = components["schemas"]["BlockRenderStructure"];
export type BlockTypeNesting = components["schemas"]["BlockTypeNesting"];
export type BlockValidationScope = components["schemas"]["BlockValidationScope"];
export type BlockFormWidgetType = components["schemas"]["BlockFormWidgetType"];
export type DataType = components["schemas"]["DataType"];
export type DataFormat = components["schemas"]["DataFormat"];
export type ComponentType = components["schemas"]["ComponentType"];
export type BlockComponentNode = components["schemas"]["BlockComponentNode"];
export type BlockBinding = components["schemas"]["BlockBinding"];
export type FormWidgetConfig = components["schemas"]["FormWidgetConfig"];
export type GridRect = components["schemas"]["GridRect"];
export type LayoutGrid = components["schemas"]["LayoutGrid"];
export type LayoutGridItem = components["schemas"]["LayoutGridItem"];

// Builder-specific types

/**
 * The 6 steps of the block type builder wizard
 */
export enum BuilderStep {
	BASIC_INFO = 0,
	SCHEMA_DESIGNER = 1,
	FORM_CONFIG = 2,
	RENDER_DESIGNER = 3,
	NESTING_RULES = 4,
	PREVIEW_SAVE = 5,
}

/**
 * Step metadata for display purposes
 */
export interface StepMetadata {
	step: BuilderStep;
	title: string;
	description: string;
	icon?: string;
}

/**
 * Validation error for a specific step
 */
export interface ValidationError {
	field: string;
	message: string;
}

/**
 * Main state for the Block Type Builder
 */
export interface BlockTypeBuilderState {
	// Basic info (Step 1)
	id: string | null;
	key: string;
	name: string;
	description: string;
	icon?: string;

	// Schema (Step 2)
	schema: BlockSchema;

	// Form configuration (Step 3)
	form: BlockFormStructure;

	// Render configuration (Step 4)
	render: BlockRenderStructure;

	// Nesting rules (Step 5)
	nesting: BlockTypeNesting | null;
	nestingEnabled: boolean;

	// Validation settings
	strictness: BlockValidationScope;

	// Wizard state
	currentStep: BuilderStep;
	validationErrors: Map<BuilderStep, ValidationError[]>;

	// Preview data (Step 6)
	previewData: Record<string, unknown>;

	// Draft state
	isDraft: boolean;
	lastSaved: Date | null;
}

/**
 * Context value for the BuilderProvider
 */
export interface BuilderContextValue {
	state: BlockTypeBuilderState;

	// Basic info operations
	updateBasicInfo: (updates: {
		name?: string;
		key?: string;
		description?: string;
		icon?: string;
	}) => void;

	// Schema operations
	updateSchema: (schema: BlockSchema) => void;
	addSchemaField: (parentPath: string | null, field: BlockSchema) => void;
	removeSchemaField: (path: string) => void;
	updateSchemaField: (path: string, updates: Partial<BlockSchema>) => void;
	reorderSchemaFields: (parentPath: string | null, fromIndex: number, toIndex: number) => void;

	// Form operations
	updateFormStructure: (form: BlockFormStructure) => void;
	updateWidgetConfig: (fieldPath: string, config: FormWidgetConfig) => void;
	removeFormField: (fieldPath: string) => void;
	reorderFormFields: (fromIndex: number, toIndex: number) => void;

	// Render operations
	addComponent: (component: BlockComponentNode) => void;
	updateComponent: (id: string, updates: Partial<BlockComponentNode>) => void;
	removeComponent: (id: string) => void;
	updateComponentLayout: (id: string, rect: GridRect) => void;
	addBinding: (componentId: string, binding: BlockBinding) => void;
	updateBinding: (componentId: string, bindingIndex: number, binding: BlockBinding) => void;
	removeBinding: (componentId: string, bindingIndex: number) => void;
	updateRenderLayout: (layoutGrid: LayoutGrid) => void;

	// Nesting operations
	updateNesting: (nesting: BlockTypeNesting | null) => void;
	setNestingEnabled: (enabled: boolean) => void;

	// Validation operations
	updateStrictness: (strictness: BlockValidationScope) => void;
	validateStep: (step: BuilderStep) => ValidationError[];
	validateAll: () => boolean;

	// Navigation
	goToStep: (step: BuilderStep) => void;
	nextStep: () => void;
	prevStep: () => void;
	canGoNext: () => boolean;
	canGoPrev: () => boolean;

	// Preview
	updatePreviewData: (data: Record<string, unknown>) => void;

	// Actions
	saveDraft: () => Promise<void>;
	publish: () => Promise<components["schemas"]["BlockType"]>;
	reset: () => void;
	loadDraft: (draftId: string) => void;
}

/**
 * Component palette item for the render designer
 */
export interface ComponentPaletteItem {
	type: ComponentType;
	name: string;
	description: string;
	icon?: string;
	category: "primitive" | "bespoke" | "container";
	defaultProps?: Record<string, unknown>;
}

/**
 * Schema path for bindings dropdown
 */
export interface SchemaPath {
	path: string;
	displayPath: string;
	fieldName: string;
	type: DataType;
	format?: DataFormat;
	required: boolean;
}

/**
 * Draft saved to localStorage
 */
export interface BlockTypeDraft {
	id: string;
	state: BlockTypeBuilderState;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Step validation result
 */
export interface StepValidationResult {
	valid: boolean;
	errors: ValidationError[];
}
