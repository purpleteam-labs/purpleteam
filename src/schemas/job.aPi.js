const internals = { config: null };

const init = (config) => {
  internals.config = config;
};

const schema = {};

module.exports = { init, schema };
