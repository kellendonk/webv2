import { Construct } from 'constructs';
import { Duration, Expiration } from 'aws-cdk-lib';

export function renderName(scope: Construct, name: string): string {
  return [...scope.node.path.split('/'), name].join('-');
}

/**
 * Stabilizes an expiration, so it doesn't change as often.
 */
export function toStableExpiration(expiration: Expiration): Expiration {
  const target = expiration.date.getTime();
  const thirtyDays = Duration.days(30).toMilliseconds();
  const number = Math.floor(target / thirtyDays) * thirtyDays;
  return Expiration.atTimestamp(number);
}
