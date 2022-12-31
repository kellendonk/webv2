import { CfnOutput, Stack, Stage, StageProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SsrWebsite } from './SsrWebsite';
import { Api, ApiTable } from './Api';
import { DomainName, DomainNameOptions } from './DomainName';
import { Cdn } from './Cdn';
import { Identity } from './Identity';

export interface WebStageProps extends StageProps {
  /** Give the CDN a domain name. */
  readonly domainName?: DomainNameOptions;

  /** Give the identity service a domain name */
  readonly identityDomainName?: DomainNameOptions;
}

/**
 * Responsible for creating stacks and wiring up constituent constructs.
 *
 * ```
 *          ┌──────────────────────────────┐
 *          │ Content Distribution Network │
 *          │        <<cloudfront>>        ├──────/graphql──────┐
 *          └──┬──────────────────────┬────┘                    │
 *             │                      │                         │
 *             /*               /_next/static/*                 │
 *   ┌─────────┼──────────────────────┼─────────────┐  ┌────────┼─────────────────────────┐
 *   │         │                      │             │  │        │                         │
 *   │ ┌───────▼────────┐ ┌───────────▼───────────┐ │  │ ┌──────▼──────┐ ┌──────────────┐ │
 *   │ │ Next.js server │ │ Next.js Static Assets │ │  │ │ GraphQL API │ │ API Database │ │
 *   │ │   <<lambda>>   │ │       <<bucket>>      │ │  │ │ <<appsync>> │ │ <<dynamodb>> │ │
 *   │ └────────────────┘ └───────────────────────┘ │  │ └─────────────┘ └──────────────┘ │
 *   │                                              │  │                                  │
 *   │                 SsrWebsite                   │  │               API                │
 *   └──────────────────────────────────────────────┘  └──────────────────────────────────┘
 *
 *       Modify by copy/paste via https://asciiflow.com
 * ```
 */
export class KellendonkStage extends Stage {
  constructor(scope: Construct, id: string, props: WebStageProps = {}) {
    super(scope, id, props);

    Tags.of(this).add('Stage', id);

    const stack = new Stack(this, 'Stack');

    const identity = new Identity(stack, 'Identity', {
      domainName:
        props.identityDomainName &&
        new DomainName(stack, 'IdentityDomainName', props.identityDomainName),
    });

    const api = new Api(stack, 'Api', {
      table: new ApiTable(stack, 'ApiTable'),
      identity,
    });

    const website = new SsrWebsite(stack, 'Website', {
      distDir: 'dist/packages/web',
    });

    const cdn = new Cdn(stack, 'Cdn', {
      website,
      api,
      domainName:
        props.domainName &&
        new DomainName(stack, 'DomainName', props.domainName),
    });

    new CfnOutput(stack, 'Url', {
      value: `https://${cdn.domainName}/`,
    });

    new CfnOutput(stack, 'IdentityUrl', {
      value: identity.baseUrl,
    });
  }
}
