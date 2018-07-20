const view = require('think-view');
const model = require('think-model');
const mongo = require('think-mongo');
const cache = require('think-cache');
const session = require('think-session');

module.exports = [
  view, // make application support view
  model(think.app),
  mongo(think.app),
  cache,
  session
];
