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
  // Don't compress as
  compress: false,
};

module.exports = withNx(nextConfig);
