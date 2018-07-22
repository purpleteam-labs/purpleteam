const blessed = require('blessed');

const screen = blessed.screen({
  dump: `${process.cwd()}/logs/dashboard/log.log`,
  smartCSR: true,
  autoPadding: false,
  warnings: true
});


const createTesterProgressLogScreen = () => {
  const logger = blessed.log({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '50%',
    height: '50%',
    border: 'line',
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    scrollback: 100,
    scrollbar: {
      ch: ' ',
      track: {
        bg: 'yellow'
      },
      style: {
        inverse: true
      }
    }
  });

  logger.focus();

  screen.key('q', () => screen.destroy());

  screen.render();

  return logger;
};


const test = (subscribeToTestersProgress) => {
  return new Promise((resolve, reject) => {
    try {
      const dashboarddLogger = createTesterProgressLogScreen();
      subscribeToTestersProgress(dashboarddLogger);
    } catch (err) {
      return reject(err);
    }
    return resolve(screen);
  });
};


module.exports = {
  test
};
