
# Widget


## Properties

Name | Type
------------ | -------------
`id` | string
`x` | number
`y` | number
`w` | number
`h` | number
`minW` | number
`minH` | number
`maxW` | number
`maxH` | number
`autoPosition` | boolean
`locked` | boolean
`noResize` | boolean
`noMove` | boolean
`content` | [RenderContent](RenderContent.md)
`subGridOpts` | [TreeLayout](TreeLayout.md)

## Example

```typescript
import type { Widget } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "x": null,
  "y": null,
  "w": null,
  "h": null,
  "minW": null,
  "minH": null,
  "maxW": null,
  "maxH": null,
  "autoPosition": null,
  "locked": null,
  "noResize": null,
  "noMove": null,
  "content": null,
  "subGridOpts": null,
} satisfies Widget

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Widget
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


