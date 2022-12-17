import { App } from 'aws-cdk-lib';
import { WebStage } from './WebStage';

const app = new App();

new WebStage(app, 'Kellendonk-Test');

new WebStage(app, 'Kellendonk-Production');

app.synth();
