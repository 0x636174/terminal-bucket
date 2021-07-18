const colors = require('colors');
// const console = require('consolemd');

const n = '\n'
const c = (x) => console.log(x)
const cl = (content, color) => console.log(colors[color](content))
const clear = () => console.clear()
const maxWidth = process.stdout.columns
const bar = (char) => { c(n); cl(char.repeat(maxWidth), 'grey'); c(n); }

const rand = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
  }

  const colorList = [
    'black',
    'red',
    'green',
    'yellow',
    'blue',
    'magenta',
    'cyan',
    'white',
    'grey',
    'brightRed',
    'brightGreen',
    'brightYellow',
    'brightBlue',
    'brightMagenta',
    'brightCyan',
    'brightWhite'
  ]

module.exports = { n, c, cl, clear, maxWidth, bar, rand, colorList }