const api = require('src/presenter/apiDecoratingAdapter');

exports.flags = 'status';
exports.desc = 'Check whether the purpleteam orchestrator is up.';
exports.run = async () => {
  await api.status();
};
