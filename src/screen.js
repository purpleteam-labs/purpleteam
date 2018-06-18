const log = require('purpleteam-logger').logger();
const blessed = require('blessed');
const contrib = require('blessed-contrib');

let screen = undefined;
let grid = undefined;

const initScreen = () => { log.info('initialising screen', {tags: ['startup']}) };

const runScreen = () => {
  initScreen();
};

module.exports = {
  runScreen

};
