# EntityAttributeRelationPayloadReference

An attribute payload representing relationships to other entities by their IDs

## Properties

| Name        | Type                                        |
| ----------- | ------------------------------------------- |
| `type`      | [EntityPropertyType](EntityPropertyType.md) |
| `relations` | Array&lt;string&gt;                         |

## Example

```typescript
import type { EntityAttributeRelationPayloadReference } from '';

// TODO: Update the object below with actual values
const example = {
  type: null,
  relations: null,
} satisfies EntityAttributeRelationPayloadReference;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EntityAttributeRelationPayloadReference;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
