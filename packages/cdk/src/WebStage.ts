import { CfnOutput, Stack, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Website } from './Website';
import { Cdn } from './Cdn';

/**
 * Responsible for creating website stacks and wiring up their constructs.
 *
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
 */
export class WebStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const stack = new Stack(this, 'Stack');

    const website = new Website(stack, 'Website', {
      distDir: 'dist/packages/web',
    });

    const cdn = new Cdn(stack, 'Cdn', {
      defaultOrigin: website.restApiOrigin,
      additionalBehaviors: {
        '_next/static': {
          origin: website.assetsOrigin,
        },
      },
    });

    new CfnOutput(stack, 'Url', {
      value: `https://${cdn.domainName}/`,
    });
  }
}
