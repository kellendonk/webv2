import { CfnOutput, Stack, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SsrWebsite, SsrWebsiteCdn } from './SsrWebsite';

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
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const stack = new Stack(this, 'Stack');

    const website = new SsrWebsite(stack, 'Website', {
      distDir: 'dist/packages/web',
    });

    const cdn = new SsrWebsiteCdn(stack, 'Cdn', {
      website,
    });

    new CfnOutput(stack, 'Url', {
      value: `https://${cdn.domainName}/`,
    });
  }
}
