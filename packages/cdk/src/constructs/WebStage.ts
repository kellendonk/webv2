import { CfnOutput, Stack, Stage, StageProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SsrWebsite } from './SsrWebsite';
import { Api, ApiTable } from './Api';
import { DomainName, DomainNameOptions } from './DomainName';
import { Cdn } from './Cdn';

export interface WebStageProps extends StageProps {
  readonly domainName?: DomainNameOptions;
}

/**
 * Responsible for creating website stacks and wiring up their constructs.
 *
 * ```
 *          ┌────────────────────────────┐
 *          │Content Distribution Network│
 *          │       <<cloudfront>>       │
 *          └──┬──────────────────────┬──┘
 *             │                      │
 *             │                      │
 *   ┌─────────┼──────────────────────┼─────────────┐
 *   │         │                      │             │
 *   │ ┌───────▼────────┐ ┌───────────▼───────────┐ │
 *   │ │ Next.js server │ │ Next.js Static Assets │ │
 *   │ │   <<lambda>>   │ │       <<bucket>>      │ │
 *   │ └────────────────┘ └───────────────────────┘ │
 *   │                                              │
 *   │                  Website                     │
 *   └──────────────────────────────────────────────┘
 *    Modify by copy/paste via https://asciiflow.com
 * ```
 */
export class WebStage extends Stage {
  constructor(scope: Construct, id: string, props: WebStageProps = {}) {
    super(scope, id, props);

    Tags.of(this).add('Stage', id);

    const stack = new Stack(this, 'Stack');

    const apiTable = new ApiTable(stack, 'ApiTable');

    const api = new Api(stack, 'Api', {
      table: apiTable,
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
  }
}
