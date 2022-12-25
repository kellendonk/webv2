import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './packages/cdk/src/constructs/Api/schema.graphql',
  documents: ['packages/web/src/**/*.tsx'],
  generates: {
    'packages/web/src/__generated__/': {
      preset: 'client',
      plugins: [],
      presetConfig: {
        gqlTagName: 'gql',
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
