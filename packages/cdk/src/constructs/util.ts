import { Construct } from 'constructs';

export function renderName(scope: Construct, name: string): string {
  return [...scope.node.path.split('/'), name].join('-');
}
