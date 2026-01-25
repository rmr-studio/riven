#!/bin/bash

npx openapi-generator-cli generate \
      -i http://localhost:8081/docs/v3/api-docs \
      -g typescript-fetch \
      -o lib/types \
      --additional-properties=\
withSeparateModelsAndApi=true,\
modelPackage=models,\
apiPackage=api,\
supportsES6=true