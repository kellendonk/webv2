import { CfnOutput, Stack, Stage, StageProps, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SsrWebsite, SsrWebsiteCdn } from './SsrWebsite';
import { DomainConfig, DomainConfigProps } from './DomainConfig';
import { PokeApi } from './PokeApi';

export interface WebStageProps extends StageProps {
  readonly domain?: DomainConfigProps;
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

    new PokeApi(stack, 'PokeApi');

    const website = new SsrWebsite(stack, 'Website', {
      distDir: 'dist/packages/web',
    });

    const domainConfig =
      props.domain && new DomainConfig(stack, 'DomainConfig', props.domain);

    const cdn = new SsrWebsiteCdn(stack, 'Cdn', {
      website,
      domainConfig,
    });

    domainConfig?.createDnsRecords(stack, 'DnsRecords', cdn.recordTarget);

    new CfnOutput(stack, 'Url', {
      value: `https://${cdn.cdnDomainName}/`,
    });
  }
}
