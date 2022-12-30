import { App } from 'aws-cdk-lib';
import { KellendonkStage } from './constructs';

const app = new App();

new KellendonkStage(app, 'Kellendonk-Dev');

const kellendonkCa = {
  hostedZoneId: 'Z04480822SF8LKAO9VKJ5',
  hostedZoneName: 'kellendonk.ca',
};

new KellendonkStage(app, 'Kellendonk-Production', {
  domainName: {
    domainName: 'www.kellendonk.ca',
    subjectAlternativeNames: ['kellendonk.ca'],
    ...kellendonkCa,
  },
  identityDomainName: {
    domainName: 'auth.kellendonk.ca',
    ...kellendonkCa,
  },
});

app.synth();
