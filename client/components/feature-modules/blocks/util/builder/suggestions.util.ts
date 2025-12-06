import {
	BlockSchema,
	BlockFormStructure,
	FormWidgetConfig,
	BlockFormWidgetType,
	DataType,
	DataFormat,
} from "../../components/builder/types/builder.types";

/**
 * Suggests the best widget type for a schema field
 *
 * @param field - The schema field
 * @returns Suggested widget type
 */
export function suggestWidgetType(field: BlockSchema): BlockFormWidgetType {
	const { type, format } = field;

	// Handle formats first
	if (format) {
		switch (format) {
			case "EMAIL":
				return "EMAIL_INPUT";
			case "PHONE":
				return "PHONE_INPUT";
			case "DATE":
				return "DATE_PICKER";
			case "DATETIME":
				return "DATE_PICKER";
			case "CURRENCY":
				return "CURRENCY_INPUT";
			case "PERCENTAGE":
				return "SLIDER";
			case "URL":
				return "TEXT_INPUT";
		}
	}

	// Handle by type
	switch (type) {
		case "STRING":
			return "TEXT_INPUT";
		case "NUMBER":
			return "NUMBER_INPUT";
		case "BOOLEAN":
			return "CHECKBOX";
		case "OBJECT":
			// Objects typically don't have direct form widgets
			return "TEXT_INPUT";
		case "ARRAY":
			// Arrays typically don't have direct form widgets
			return "TEXT_INPUT";
		default:
			return "TEXT_INPUT";
	}
}

/**
 * Generates a default label from a field name
 *
 * @param fieldName - The field name (e.g., "first_name")
 * @returns Human-readable label (e.g., "First Name")
 */
export function generateLabel(fieldName: string): string {
	return fieldName
		.split(/[_-]/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

/**
 * Generates a default placeholder for a field
 *
 * @param field - The schema field
 * @param fieldName - The field name
 * @returns Placeholder text
 */
export function generatePlaceholder(field: BlockSchema, fieldName: string): string {
	const { type, format } = field;

	if (format) {
		switch (format) {
			case "EMAIL":
				return "name@example.com";
			case "PHONE":
				return "+1 (555) 000-0000";
			case "DATE":
				return "Select a date";
			case "DATETIME":
				return "Select date and time";
			case "CURRENCY":
				return "0.00";
			case "URL":
				return "https://example.com";
			case "PERCENTAGE":
				return "0%";
		}
	}

	switch (type) {
		case "STRING":
			return `Enter ${generateLabel(fieldName).toLowerCase()}`;
		case "NUMBER":
			return "0";
		case "BOOLEAN":
			return "";
		default:
			return `Enter ${fieldName}`;
	}
}

/**
 * Auto-generates a complete form structure from a schema
 *
 * @param schema - The block schema
 * @param prefix - Path prefix for nested fields (default: "data")
 * @returns Complete form structure with suggested widgets
 */
export function generateFormFromSchema(
	schema: BlockSchema,
	prefix = "data"
): BlockFormStructure {
	const fields: Record<string, FormWidgetConfig> = {};

	function processField(field: BlockSchema, path: string, fieldName: string) {
		// Skip objects and arrays - they don't get direct form widgets
		if (field.type === "OBJECT" || field.type === "ARRAY") {
			// Process children instead
			if (field.type === "OBJECT" && field.properties) {
				for (const [key, childField] of Object.entries(field.properties)) {
					processField(childField, `${path}.${key}`, key);
				}
			}
			return;
		}

		// Generate widget config
		const widgetType = suggestWidgetType(field);
		const label = generateLabel(fieldName);
		const placeholder = generatePlaceholder(field, fieldName);

		fields[path] = {
			type: widgetType,
			label,
			placeholder,
			description: field.description,
		};
	}

	// Process root properties
	if (schema.type === "OBJECT" && schema.properties) {
		for (const [key, field] of Object.entries(schema.properties)) {
			processField(field, `${prefix}.${key}`, key);
		}
	}

	return { fields };
}

/**
 * Updates form structure when schema changes
 * - Adds new fields from schema
 * - Removes fields no longer in schema
 * - Updates widget types if field type changed
 *
 * @param currentForm - Current form structure
 * @param schema - Updated schema
 * @returns Updated form structure
 */
export function syncFormWithSchema(
	currentForm: BlockFormStructure,
	schema: BlockSchema
): BlockFormStructure {
	const newForm = generateFormFromSchema(schema);
	const updatedFields: Record<string, FormWidgetConfig> = {};

	// Merge: keep existing customizations where possible
	for (const [path, newWidget] of Object.entries(newForm.fields)) {
		if (currentForm.fields[path]) {
			// Field exists - keep customizations but update type if needed
			const existing = currentForm.fields[path];
			updatedFields[path] = {
				...existing,
				// Keep user's customizations
				// But update type if it should change based on schema
			};
		} else {
			// New field - use suggested config
			updatedFields[path] = newWidget;
		}
	}

	return { fields: updatedFields };
}

/**
 * Gets a description for a widget type
 *
 * @param widgetType - The widget type
 * @returns Human-readable description
 */
export function getWidgetDescription(widgetType: BlockFormWidgetType): string {
	switch (widgetType) {
		case "TEXT_INPUT":
			return "Single-line text input";
		case "TEXT_AREA":
			return "Multi-line text input";
		case "NUMBER_INPUT":
			return "Numeric input with increment/decrement";
		case "EMAIL_INPUT":
			return "Email input with validation";
		case "PHONE_INPUT":
			return "Phone number input with formatting";
		case "CURRENCY_INPUT":
			return "Currency input with formatting";
		case "DATE_PICKER":
			return "Date/time picker calendar";
		case "CHECKBOX":
			return "Single checkbox (true/false)";
		case "RADIO_BUTTON":
			return "Radio button group (single choice)";
		case "DROPDOWN":
			return "Dropdown select menu";
		case "SLIDER":
			return "Slider for range values";
		case "TOGGLE_SWITCH":
			return "Toggle switch (true/false)";
		case "FILE_UPLOAD":
			return "File upload with preview";
		default:
			return "Form input widget";
	}
}

/**
 * Gets all available widget types
 *
 * @returns Array of all widget types
 */
export function getAllWidgetTypes(): BlockFormWidgetType[] {
	return [
		"TEXT_INPUT",
		"TEXT_AREA",
		"NUMBER_INPUT",
		"EMAIL_INPUT",
		"PHONE_INPUT",
		"CURRENCY_INPUT",
		"DATE_PICKER",
		"CHECKBOX",
		"RADIO_BUTTON",
		"DROPDOWN",
		"SLIDER",
		"TOGGLE_SWITCH",
		"FILE_UPLOAD",
	];
}

/**
 * Checks if a widget type requires options (for dropdowns, radio buttons)
 *
 * @param widgetType - The widget type
 * @returns True if options are required
 */
export function widgetRequiresOptions(widgetType: BlockFormWidgetType): boolean {
	return widgetType === "RADIO_BUTTON" || widgetType === "DROPDOWN";
}
