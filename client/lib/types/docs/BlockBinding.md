# BlockBinding

## Properties

| Name     | Type                                        |
| -------- | ------------------------------------------- |
| `prop`   | string                                      |
| `source` | [BlockBindingSource](BlockBindingSource.md) |

## Example

```typescript
import type { BlockBinding } from '';

// TODO: Update the object below with actual values
const example = {
  prop: null,
  source: null,
} satisfies BlockBinding;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as BlockBinding;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
