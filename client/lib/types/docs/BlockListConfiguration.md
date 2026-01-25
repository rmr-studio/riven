# BlockListConfiguration

## Properties

| Name              | Type                                      |
| ----------------- | ----------------------------------------- |
| `listType`        | Array&lt;string&gt;                       |
| `allowDuplicates` | boolean                                   |
| `display`         | [ListDisplayConfig](ListDisplayConfig.md) |
| `config`          | [ListConfig](ListConfig.md)               |

## Example

```typescript
import type { BlockListConfiguration } from '';

// TODO: Update the object below with actual values
const example = {
  listType: null,
  allowDuplicates: null,
  display: null,
  config: null,
} satisfies BlockListConfiguration;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as BlockListConfiguration;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
