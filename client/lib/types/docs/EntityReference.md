# EntityReference

Reference to one or more of an workspace\'s entities (e.g. teams, projects, clients)

## Properties

| Name        | Type                                                       |
| ----------- | ---------------------------------------------------------- |
| `type`      | [ReferenceType](ReferenceType.md)                          |
| `reference` | [Array&lt;ReferenceItemEntity&gt;](ReferenceItemEntity.md) |

## Example

```typescript
import type { EntityReference } from '';

// TODO: Update the object below with actual values
const example = {
  type: null,
  reference: null,
} satisfies EntityReference;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EntityReference;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
