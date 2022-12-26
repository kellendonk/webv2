/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type AddInteractionResponse = {
  __typename?: 'AddInteractionResponse';
  interaction: Scalars['String'];
  subject: Scalars['String'];
};

export type InteractionCount = {
  __typename?: 'InteractionCount';
  count: Scalars['Int'];
  id: Scalars['ID'];
  interaction: Scalars['String'];
  subject: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addInteraction: AddInteractionResponse;
};

export type MutationAddInteractionArgs = {
  interaction: Scalars['String'];
  subject: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  getInteractions: Array<InteractionCount>;
};

export type QueryGetInteractionsArgs = {
  subject: Scalars['String'];
};

export type QueryQueryVariables = Exact<{
  subject: Scalars['String'];
}>;

export type QueryQuery = {
  __typename?: 'Query';
  getInteractions: Array<{
    __typename?: 'InteractionCount';
    id: string;
    subject: string;
    interaction: string;
    count: number;
  }>;
};

export type MutationMutationVariables = Exact<{
  subject: Scalars['String'];
  interaction: Scalars['String'];
}>;

export type MutationMutation = {
  __typename?: 'Mutation';
  addInteraction: {
    __typename?: 'AddInteractionResponse';
    subject: string;
    interaction: string;
  };
};

export const QueryDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Query' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'subject' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'String' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getInteractions' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'subject' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'subject' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'subject' } },
                { kind: 'Field', name: { kind: 'Name', value: 'interaction' } },
                { kind: 'Field', name: { kind: 'Name', value: 'count' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<QueryQuery, QueryQueryVariables>;
export const MutationDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'Mutation' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'subject' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'String' },
            },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'interaction' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'String' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'addInteraction' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'subject' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'subject' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'interaction' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'interaction' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'subject' } },
                { kind: 'Field', name: { kind: 'Name', value: 'interaction' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MutationMutation, MutationMutationVariables>;
