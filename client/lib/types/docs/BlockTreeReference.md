# BlockTreeReference

Reference to another block tree

## Properties

| Name        | Type                                                |
| ----------- | --------------------------------------------------- |
| `type`      | [ReferenceType](ReferenceType.md)                   |
| `reference` | [ReferenceItemBlockTree](ReferenceItemBlockTree.md) |

## Example

```typescript
import type { BlockTreeReference } from '';

// TODO: Update the object below with actual values
const example = {
  type: null,
  reference: null,
} satisfies BlockTreeReference;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as BlockTreeReference;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
