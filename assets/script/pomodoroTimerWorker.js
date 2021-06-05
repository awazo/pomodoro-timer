let scriptPath = 'file:///C:/Users/awazo/Desktop/repositories/git/pomodoro-timer/assets/script/';

// for local use: setup script directory path as "file://xxx"
importScripts(scriptPath + 'workerBase.js');

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

