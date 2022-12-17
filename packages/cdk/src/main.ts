import { App } from 'aws-cdk-lib';
import { WebStage } from './WebStage';

const app = new App();

new WebStage(app, 'WebStage-Test', {

});
