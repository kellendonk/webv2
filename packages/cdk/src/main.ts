import { App } from 'aws-cdk-lib';
import { WebStage } from './constructs';

const app = new App();

new WebStage(app, 'Kellendonk-Dev');

new WebStage(app, 'Kellendonk-Test', {
  domain: {
    domainName: 'www-test.kellendonk.ca',
    hostedZoneId: 'Z04480822SF8LKAO9VKJ5',
    hostedZoneName: 'kellendonk.ca',
  },
});

new WebStage(app, 'Kellendonk-Production', {
  domain: {
    domainName: 'www.kellendonk.ca',
    secondaryDomainNames: ['kellendonk.ca'],
    hostedZoneId: 'Z04480822SF8LKAO9VKJ5',
    hostedZoneName: 'kellendonk.ca',
  },
});

app.synth();
