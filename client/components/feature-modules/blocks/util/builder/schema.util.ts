import { BlockSchema, DataType, DataFormat, SchemaPath } from "../../components/builder/types/builder.types";

/**
 * Parses a JSONPath-style path into parts
 * Example: "$.data/address/street" -> ["address", "street"]
 */
function parsePath(path: string): string[] {
	// Remove $.data/ prefix if present
	const cleanPath = path.replace(/^\$\.data\/?/, "");
	if (!cleanPath) return [];
	return cleanPath.split("/");
}

/**
 * Gets a schema field by path
 *
 * @param schema - The root schema
 * @param path - JSONPath to the field (e.g., "$.data/address/street" or "address/street")
 * @returns The schema field at that path, or null if not found
 *
 * @example
 * ```ts
 * const addressSchema = getSchemaField(schema, "$.data/address");
 * const streetSchema = getSchemaField(schema, "$.data/address/street");
 * ```
 */
export function getSchemaField(schema: BlockSchema, path: string): BlockSchema | null {
	const parts = parsePath(path);
	if (parts.length === 0) return schema;

	let current = schema;

	for (const part of parts) {
		if (current.type === "OBJECT" && current.properties?.[part]) {
			current = current.properties[part];
		} else if (current.type === "ARRAY" && part === "[]" && current.items) {
			current = current.items;
		} else {
			return null; // Path not found
		}
	}

	return current;
}

/**
 * Updates a schema field at a specific path immutably
 *
 * @param schema - The root schema
 * @param path - JSONPath to the field
 * @param updates - Partial updates to apply
 * @returns New schema with updates applied
 */
export function updateSchemaField(
	schema: BlockSchema,
	path: string,
	updates: Partial<BlockSchema>
): BlockSchema {
	const parts = parsePath(path);

	// Base case: updating root
	if (parts.length === 0) {
		return { ...schema, ...updates };
	}

	// Recursive case
	const [head, ...tail] = parts;
	const newSchema = { ...schema };

	if (schema.type === "OBJECT" && schema.properties) {
		const field = schema.properties[head];
		if (!field) return schema; // Field doesn't exist

		newSchema.properties = {
			...schema.properties,
			[head]: updateSchemaField(field, tail.join("/"), updates),
		};
	} else if (schema.type === "ARRAY" && head === "[]" && schema.items) {
		newSchema.items = updateSchemaField(schema.items, tail.join("/"), updates);
	}

	return newSchema;
}

/**
 * Adds a new field to a schema at the specified parent path
 *
 * @param schema - The root schema
 * @param parentPath - Path to the parent (null for root)
 * @param fieldName - Name of the new field
 * @param field - The field schema to add
 * @returns New schema with field added
 */
export function addSchemaField(
	schema: BlockSchema,
	parentPath: string | null,
	fieldName: string,
	field: BlockSchema
): BlockSchema {
	// Adding to root
	if (parentPath === null || parentPath === "") {
		if (schema.type !== "OBJECT") return schema;

		return {
			...schema,
			properties: {
				...(schema.properties || {}),
				[fieldName]: field,
			},
		};
	}

	// Adding to nested path
	const parts = parsePath(parentPath);
	const newSchema = { ...schema };
	let current: any = newSchema;

	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];

		if (current.type === "OBJECT" && current.properties) {
			if (i === parts.length - 1) {
				// Last part - add here
				current.properties = {
					...current.properties,
					[part]: {
						...current.properties[part],
						properties: {
							...(current.properties[part].properties || {}),
							[fieldName]: field,
						},
					},
				};
			} else {
				// Navigate deeper
				current.properties = { ...current.properties };
				current = current.properties[part];
			}
		}
	}

	return newSchema;
}

/**
 * Removes a field from the schema
 *
 * @param schema - The root schema
 * @param path - Path to the field to remove
 * @returns New schema with field removed
 */
export function removeSchemaField(schema: BlockSchema, path: string): BlockSchema {
	const parts = parsePath(path);
	if (parts.length === 0) return schema;

	const parentPath = parts.slice(0, -1).join("/");
	const fieldName = parts[parts.length - 1];

	if (parentPath === "") {
		// Removing from root
		if (schema.type !== "OBJECT" || !schema.properties) return schema;

		const { [fieldName]: removed, ...rest } = schema.properties;
		return {
			...schema,
			properties: rest,
		};
	}

	// Removing from nested path - use updateSchemaField
	const parent = getSchemaField(schema, parentPath);
	if (!parent || parent.type !== "OBJECT" || !parent.properties) return schema;

	const { [fieldName]: removed, ...rest } = parent.properties;
	return updateSchemaField(schema, parentPath, { properties: rest });
}

/**
 * Gets all valid paths in a schema for use in bindings
 *
 * @param schema - The root schema
 * @param prefix - Path prefix (default: "$.data")
 * @returns Array of SchemaPath objects
 *
 * @example
 * ```ts
 * const paths = getAllSchemaPaths(schema);
 * // Returns:
 * // [
 * //   { path: "$.data/name", displayPath: "name", fieldName: "name", type: "STRING", required: true },
 * //   { path: "$.data/address/street", displayPath: "address.street", fieldName: "street", type: "STRING", required: false }
 * // ]
 * ```
 */
export function getAllSchemaPaths(schema: BlockSchema, prefix = "$.data"): SchemaPath[] {
	const paths: SchemaPath[] = [];

	function traverse(current: BlockSchema, currentPath: string, displayParts: string[]) {
		// Add current path (except root)
		if (currentPath !== "$.data") {
			paths.push({
				path: currentPath,
				displayPath: displayParts.join("."),
				fieldName: current.name,
				type: current.type,
				format: current.format,
				required: current.required,
			});
		}

		// Traverse children
		if (current.type === "OBJECT" && current.properties) {
			for (const [key, childSchema] of Object.entries(current.properties)) {
				traverse(childSchema, `${currentPath}/${key}`, [...displayParts, key]);
			}
		} else if (current.type === "ARRAY" && current.items) {
			traverse(current.items, `${currentPath}/[]`, [...displayParts, "[]"]);
		}
	}

	traverse(schema, prefix, []);
	return paths;
}

/**
 * Generates default data for a schema
 *
 * @param schema - The schema to generate data for
 * @returns Default data object
 */
export function generateDefaultDataFromSchema(schema: BlockSchema): any {
	switch (schema.type) {
		case "STRING":
			return "";
		case "NUMBER":
			return 0;
		case "BOOLEAN":
			return false;
		case "ARRAY":
			return [];
		case "OBJECT":
			if (!schema.properties) return {};
			const obj: any = {};
			for (const [key, childSchema] of Object.entries(schema.properties)) {
				obj[key] = generateDefaultDataFromSchema(childSchema);
			}
			return obj;
		case "NULL":
			return null;
		default:
			return null;
	}
}

/**
 * Validates a field name
 *
 * @param name - The field name to validate
 * @returns True if valid
 */
export function isValidFieldName(name: string): boolean {
	// Must start with letter, can contain letters, numbers, underscores
	return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
}

/**
 * Gets the default format for a data type
 *
 * @param type - The data type
 * @returns Default format, if any
 */
export function getDefaultFormat(type: DataType): DataFormat | undefined {
	// No default formats for now
	return undefined;
}

/**
 * Gets available formats for a data type
 *
 * @param type - The data type
 * @returns Array of available formats
 */
export function getAvailableFormats(type: DataType): DataFormat[] {
	switch (type) {
		case "STRING":
			return ["DATE", "DATETIME", "EMAIL", "PHONE", "URL"];
		case "NUMBER":
			return ["CURRENCY", "PERCENTAGE"];
		default:
			return [];
	}
}

/**
 * Checks if a schema has any fields
 *
 * @param schema - The schema to check
 * @returns True if schema has fields
 */
export function hasFields(schema: BlockSchema): boolean {
	if (schema.type === "OBJECT") {
		return !!schema.properties && Object.keys(schema.properties).length > 0;
	}
	if (schema.type === "ARRAY") {
		return !!schema.items;
	}
	return false;
}

/**
 * Gets a human-readable type label
 *
 * @param type - The data type
 * @param format - Optional format
 * @returns Human-readable label
 */
export function getTypeLabel(type: DataType, format?: DataFormat): string {
	if (format) {
		return `${type} (${format})`;
	}
	return type;
}
