import { App } from 'aws-cdk-lib';
import { WebStage } from './constructs';

const app = new App();

new WebStage(app, 'Kellendonk-Dev');

const hostedZoneInfo = {
  hostedZoneId: 'Z04480822SF8LKAO9VKJ5',
  hostedZoneName: 'kellendonk.ca',
};

new WebStage(app, 'Kellendonk-Production', {
  domainName: {
    domainName: 'www.kellendonk.ca',
    subjectAlternativeNames: ['kellendonk.ca'],
    ...hostedZoneInfo,
  },
});

app.synth();
