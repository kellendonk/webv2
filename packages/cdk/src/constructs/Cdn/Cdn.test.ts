import { cdnFunction } from './Cdn';

describe('cdnFunction', () => {
  const rendered = cdnFunction({
    primaryDomain: 'www.example.com',
    websiteHash: 'FAKE_HASH',
  });

  const handler = new Function(rendered + '\nreturn handler;')();

  test('adds x-website-hash', () => {
    const result = handler({
      request: {
        uri: '/foobar',
        headers: {
          host: {
            value: 'www.example.com',
          },
        },
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-website-hash': {
            value: 'FAKE_HASH',
          },
        }),
      }),
    );
  });

  test('redirect to primary domain', () => {
    const result = handler({
      request: {
        uri: '/foobar',
        headers: {
          host: {
            value: 'example.com',
          },
        },
      },
    });

    expect(result).toEqual({
      statusCode: 302,
      statusDescription: 'Found',
      headers: {
        location: {
          value: 'https://www.example.com/foobar',
        },
      },
    });
  });
});
