let scriptPath = './';

try {
importScripts(scriptPath + 'workerBase.js');
} catch(e) {
  console.log(e);
  console.log('for local use: setup script directory path as "file://xxx"');
  throw e;
}

var count = 0;
var timer = null;

let handlerMap = {
  'result': function(message) {
  },
  'start': function(message) {
    if (!isNaN(message.content))
      count = message.content;
    timer = setInterval(function() {
      count--;
      workerBase.send(workerBase.createMessageCommand('update', count));
    }, 1000);
    workerBase.send(workerBase.createMessageResult(message.name, true));
  },
  'stop': function(message) {
    if (timer != null)
      clearInterval(timer);
    workerBase.send(workerBase.createMessageResult(message.name, true));
  },
  'reset': function(message) {
    if (!isNaN(message.content))
      count = message.content;
    workerBase.send(workerBase.createMessageResult(message.name, true));
  }
};
workerBase.initWorker(workerBase.handlerMapper(handlerMap));

