const fs = require('node:fs');
const path = require('node:path');

module.exports = ({ config }) => {
  const file = process.env.GOOGLE_SERVICES_JSON || './google-services.json';
  if (process.env.GOOGLE_SERVICES_JSON && !fs.existsSync(path.resolve(__dirname, file))) {
    throw new Error('GOOGLE_SERVICES_JSON points to a missing Android Firebase client configuration');
  }
  return {
    ...config,
    android: {
      ...config.android,
      ...(fs.existsSync(path.resolve(__dirname, file)) ? { googleServicesFile: file } : {}),
    },
  };
};
