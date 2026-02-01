/**
 * Maps frontend node type keys to backend schema keys
 *
 * Frontend uses: trigger_entity_event, action_create_entity, control_condition
 * Backend uses: TRIGGER.ENTITY_EVENT, ACTION.CREATE_ENTITY, CONTROL.CONDITION
 */

/**
 * Convert frontend node type key to backend schema key
 * @example frontendToBackendKey("trigger_entity_event") => "TRIGGER.ENTITY_EVENT"
 */
export function frontendToBackendKey(frontendKey: string): string {
  // Split by underscore: ["trigger", "entity", "event"]
  const parts = frontendKey.split("_");
  if (parts.length < 2) return frontendKey.toUpperCase();

  // First part is category: "trigger" -> "TRIGGER"
  const category = parts[0].toUpperCase();
  // Rest is subtype: ["entity", "event"] -> "ENTITY_EVENT"
  const subtype = parts.slice(1).join("_").toUpperCase();

  return `${category}.${subtype}`;
}

/**
 * Convert backend schema key to frontend node type key
 * @example backendToFrontendKey("TRIGGER.ENTITY_EVENT") => "trigger_entity_event"
 */
export function backendToFrontendKey(backendKey: string): string {
  // Split by period: ["TRIGGER", "ENTITY_EVENT"]
  const [category, subtype] = backendKey.split(".");
  if (!subtype) return backendKey.toLowerCase();

  // Convert: "TRIGGER" -> "trigger", "ENTITY_EVENT" -> "entity_event"
  return `${category.toLowerCase()}_${subtype.toLowerCase()}`;
}
