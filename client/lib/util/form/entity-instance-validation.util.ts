import { SchemaOptions, SchemaUUID } from "@/lib/interfaces/common.interface";
import { DataFormat, DataType, EntityRelationshipCardinality, SchemaType } from "@/lib/types/types";
import { EntityRelationshipDefinition, EntityType } from "@/components/feature-modules/entity/interface/entity.interface";
import { attributeTypes } from "./schema.util";
import { z } from "zod";

/**
 * Build a Zod schema from an EntityType definition for validation
 */
export function buildZodSchemaFromEntityType(
    entityType: EntityType
): z.ZodObject<any> {
    const schemaShape: Record<string, z.ZodTypeAny> = {};

    // Build schemas for all attributes
    if (entityType.schema.properties) {
        Object.entries(entityType.schema.properties).forEach(([attributeId, schema]) => {
            schemaShape[attributeId] = buildFieldSchema(schema);
        });
    }

    // Build schemas for all relationships
    if (entityType.relationships) {
        entityType.relationships.forEach((relationship) => {
            schemaShape[relationship.id] = buildRelationshipFieldSchema(relationship);
        });
    }

    return z.object(schemaShape);
}

/**
 * Build a Zod schema for an individual attribute field
 */
export function buildFieldSchema(schema: SchemaUUID): z.ZodTypeAny {
    const attributeType = attributeTypes[schema.key];
    let fieldSchema: z.ZodTypeAny;

    // Base type mapping
    switch (attributeType.type) {
        case DataType.STRING:
            fieldSchema = buildStringSchema(schema);
            break;
        case DataType.NUMBER:
            fieldSchema = buildNumberSchema(schema);
            break;
        case DataType.BOOLEAN:
            fieldSchema = z.boolean();
            break;
        case DataType.ARRAY:
            fieldSchema = buildArraySchema(schema);
            break;
        case DataType.OBJECT:
            fieldSchema = z.record(z.any());
            break;
        default:
            fieldSchema = z.any();
    }

    // Handle required/optional
    if (!schema.required) {
        fieldSchema = fieldSchema.optional().nullable();
    }

    return fieldSchema;
}

/**
 * Build a Zod schema for string-based fields
 */
function buildStringSchema(schema: SchemaUUID): z.ZodString {
    let stringSchema = z.string();

    const options = schema.options;
    if (options) {
        // Min/max length constraints
        if (options.minLength !== undefined && options.minLength !== null) {
            stringSchema = stringSchema.min(
                options.minLength,
                `Must be at least ${options.minLength} characters`
            );
        }
        if (options.maxLength !== undefined && options.maxLength !== null) {
            stringSchema = stringSchema.max(
                options.maxLength,
                `Must be at most ${options.maxLength} characters`
            );
        }

        // Regex pattern validation
        if (options.regex) {
            try {
                const pattern = new RegExp(options.regex);
                stringSchema = stringSchema.regex(
                    pattern,
                    `Must match pattern: ${options.regex}`
                );
            } catch (error) {
                console.error("Invalid regex pattern:", options.regex, error);
            }
        }

        // Enum validation for SELECT types
        if (options.enum && options.enum.length > 0) {
            // Zod enum requires at least 1 value, and values must be tuples
            const enumValues = options.enum as [string, ...string[]];
            stringSchema = z.enum(enumValues) as any;
        }
    }

    // Format-specific validation
    const attributeType = attributeTypes[schema.key];
    if (attributeType.format) {
        switch (attributeType.format) {
            case DataFormat.EMAIL:
                stringSchema = stringSchema.email("Must be a valid email address");
                break;
            case DataFormat.URL:
                stringSchema = stringSchema.url("Must be a valid URL");
                break;
            case DataFormat.DATE:
                // Accept ISO date strings
                stringSchema = stringSchema.regex(
                    /^\d{4}-\d{2}-\d{2}$/,
                    "Must be a valid date (YYYY-MM-DD)"
                );
                break;
            case DataFormat.DATETIME:
                // Accept ISO datetime strings
                stringSchema = stringSchema.datetime("Must be a valid datetime");
                break;
            case DataFormat.PHONE:
                // Basic phone validation (can be enhanced)
                stringSchema = stringSchema.regex(
                    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
                    "Must be a valid phone number"
                );
                break;
        }
    }

    return stringSchema;
}

/**
 * Build a Zod schema for number-based fields
 */
function buildNumberSchema(schema: SchemaUUID): z.ZodNumber {
    let numberSchema = z.number({
        required_error: `${schema.label || "Field"} is required`,
        invalid_type_error: `${schema.label || "Field"} must be a number`,
    });

    const options = schema.options;
    if (options) {
        // Min/max value constraints
        if (options.minimum !== undefined && options.minimum !== null) {
            numberSchema = numberSchema.min(
                options.minimum,
                `Must be at least ${options.minimum}`
            );
        }
        if (options.maximum !== undefined && options.maximum !== null) {
            numberSchema = numberSchema.max(
                options.maximum,
                `Must be at most ${options.maximum}`
            );
        }

        // Integer validation if specified
        if (options.integer) {
            numberSchema = numberSchema.int("Must be a whole number");
        }
    }

    return numberSchema;
}

/**
 * Build a Zod schema for array-based fields (MULTI_SELECT, FILE_ATTACHMENT)
 */
function buildArraySchema(schema: SchemaUUID): z.ZodArray<any> {
    const options = schema.options;

    // For MULTI_SELECT with enum options
    if (schema.key === SchemaType.MULTI_SELECT && options?.enum && options.enum.length > 0) {
        const enumValues = options.enum as [string, ...string[]];
        return z.array(z.enum(enumValues));
    }

    // For FILE_ATTACHMENT
    if (schema.key === SchemaType.FILE_ATTACHMENT) {
        return z.array(z.string().url("Must be a valid file URL"));
    }

    // Default: array of strings
    return z.array(z.string());
}

/**
 * Build a Zod schema for relationship fields
 */
export function buildRelationshipFieldSchema(
    relationship: EntityRelationshipDefinition
): z.ZodTypeAny {
    const isSingleSelect =
        relationship.cardinality === EntityRelationshipCardinality.ONE_TO_ONE ||
        relationship.cardinality === EntityRelationshipCardinality.MANY_TO_ONE;

    let fieldSchema: z.ZodTypeAny;

    if (isSingleSelect) {
        // Single entity ID
        fieldSchema = z.string().uuid(`${relationship.name} must be a valid entity`);

        if (!relationship.required) {
            fieldSchema = fieldSchema.optional().nullable();
        }
    } else {
        // Array of entity IDs
        fieldSchema = z.array(
            z.string().uuid(`Each ${relationship.name} must be a valid entity`)
        );

        if (relationship.required) {
            fieldSchema = fieldSchema.min(1, `At least one ${relationship.name} is required`);
        } else {
            fieldSchema = fieldSchema.optional().nullable();
        }
    }

    return fieldSchema;
}

/**
 * Get default value for a schema field
 */
export function getDefaultValueForSchema(schema: SchemaUUID): any {
    const attributeType = attributeTypes[schema.key];

    switch (attributeType.type) {
        case DataType.STRING:
            return "";
        case DataType.NUMBER:
            // Use minimum if specified, otherwise 0
            return schema.options?.minimum ?? 0;
        case DataType.BOOLEAN:
            return false;
        case DataType.ARRAY:
            return [];
        case DataType.OBJECT:
            return {};
        default:
            return null;
    }
}

/**
 * Build default values for all fields in an entity type
 */
export function buildDefaultValuesFromEntityType(
    entityType: EntityType
): Record<string, any> {
    const defaults: Record<string, any> = {};

    // Set defaults for attributes
    if (entityType.schema.properties) {
        Object.entries(entityType.schema.properties).forEach(([id, schema]) => {
            defaults[id] = getDefaultValueForSchema(schema);
        });
    }

    // Set defaults for relationships
    if (entityType.relationships) {
        entityType.relationships.forEach((rel) => {
            const isMulti =
                rel.cardinality === EntityRelationshipCardinality.ONE_TO_MANY ||
                rel.cardinality === EntityRelationshipCardinality.MANY_TO_MANY;
            defaults[rel.id] = isMulti ? [] : null;
        });
    }

    return defaults;
}
