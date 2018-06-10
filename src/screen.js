const blessed = require('blessed');
const contrib = require('blessed-contrib');

let screen = undefined;
let grid = undefined;

const initScreen = () => { console.log('initialising screen'); }; // eslint-disable-line no-console

const runScreen = () => {
  initScreen();
};

module.exports = {
  runScreen

};
