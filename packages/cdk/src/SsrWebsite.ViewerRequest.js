var websiteHash = '{{WEBSITE_HASH}}';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handler(event) {
  var request = event.request;

  // Add the website hash as a cache key
  request.headers['x-website-hash'] = { value: websiteHash };

  return request;
}
