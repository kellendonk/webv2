//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withNx } = require('@nrwl/next/plugins/with-nx');

/**
 * @type {import("@nrwl/next/plugins/with-nx").WithNxOptions}
 **/
const nextConfig = {
  nx: {
    svgr: true,
  },
  compress: false,
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
};

module.exports = withNx(nextConfig);
