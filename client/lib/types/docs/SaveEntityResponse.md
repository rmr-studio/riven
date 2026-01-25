# SaveEntityResponse

## Properties

| Name               | Type                                    |
| ------------------ | --------------------------------------- |
| `entity`           | [Entity](Entity.md)                     |
| `errors`           | Array&lt;string&gt;                     |
| `impactedEntities` | { [key: string]: Array&lt;Entity&gt;; } |

## Example

```typescript
import type { SaveEntityResponse } from '';

// TODO: Update the object below with actual values
const example = {
  entity: null,
  errors: null,
  impactedEntities: null,
} satisfies SaveEntityResponse;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SaveEntityResponse;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
