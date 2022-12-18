import { scriptSub } from './SsrWebsite';

test('replace string', () => {
  const script = `foo: "{{TEST_VALUE}}"`;

  const result = scriptSub(script, {
    TEST_VALUE: 'bar',
  });

  expect(result).toEqual('foo: "bar"');
});
