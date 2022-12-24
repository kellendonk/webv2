import { App } from 'aws-cdk-lib';
import { KellendonkStage } from './constructs';

const app = new App();

new KellendonkStage(app, 'Kellendonk-Dev');

new KellendonkStage(app, 'Kellendonk-Production', {
  domainName: {
    domainName: 'www.kellendonk.ca',
    subjectAlternativeNames: ['kellendonk.ca'],
    hostedZoneId: 'Z04480822SF8LKAO9VKJ5',
    hostedZoneName: 'kellendonk.ca',
  },
});

app.synth();
