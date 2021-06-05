var workerBase = workerBase || {};


workerBase.createWorker = function(path) {
  try {
    try {
      let baseUrl = window.location.href.replace(/\\/g, '/');
      baseUrl = baseUrl.replace(/\/[^\/]*$/, '/');
      let blobContent = ['importScripts("' + baseUrl + path + '");'];
      let blobType = 'text/javascript';
      let blob = new Blob(blobContent, {type: blobType});
      let url = window.URL.createObjectURL(blob);
      return new Worker(url);
    } catch(e) {
      return new Worker(path);
    }
  } catch(e) {
    console.log(e);
    console.log('for local use: setup script directory path');
  }
  return null;
};


workerBase.messageType = {
  command: 'command',
  result: 'result',
  error: 'error'
};

workerBase.createMessage = function(type, name, content) {
  return { type: type, name: name, content: content};
};

workerBase.createMessageCommand = function(name, args) {
  return workerBase.createMessage(workerBase.messageType.command, name, args);
};
workerBase.createMessageResult = function(name, args) {
  return workerBase.createMessage(workerBase.messageType.result, name, args);
};
workerBase.createMessageError = function(name, args) {
  return workerBase.createMessage(workerBase.messageType.error, name, args);
};

workerBase.createMessageErrorOnMessage = function(description, message) {
  let args = {description: description, message: message};
  return workerBase.createMessageError(message.name, args);
};

workerBase.isMessageCommand = function(message) {
  return (message.type === workerBase.messageType.command);
};
workerBase.isMessageResult = function(message) {
  return (message.type === workerBase.messageType.result);
};
workerBase.isMessageError = function(message) {
  return (message.type === workerBase.messageType.error);
};


workerBase.handlerDefault = function(message) {};

workerBase.handlerMapDefault = (function() {
  let map = {};
  map[workerBase.messageType.command] = workerBase.handlerDefault;
  map[workerBase.messageType.result] = workerBase.handlerDefault;
  map[workerBase.messageType.error] = function(message) { console.log(message); };
  return map;
})();
workerBase.handlerMapper = function(handlerMap) {
  return function(message) {
    if (message.type in handlerMap) {
      return handlerMap[message.type](message);
    } else if (message.name in handlerMap) {
      return handlerMap[message.name](message);
    } else if (message.type === workerBase.messageType.error) {
      return workerBase.handlerMapDefault[message.type](message);
    } else {
      let description = 'no handlerMapper matched';
      let messageError = workerBase.createMessageErrorOnMessage(description, message);
      return workerBase.handler(messageError);
    }
  };
};

workerBase.handler = workerBase.handlerDefault;
workerBase.initWorker = function(handler, worker) {
  if ((handler != null) && (typeof handler === 'function'))
    workerBase.handler = handler;
  let handlerFunction = function(event) {
    try {
      workerBase.handler(event.data);
    } catch(e) {
      try {
        workerBase.handler(workerBase.createMessageError(event.data.name, e));
      } catch(ex) {
        workerBase.handlerMapDefault[workerBase.messageType.error](event.data);
      }
    }
  };
  if (worker == null) {
    onmessage = handlerFunction;
  } else {
    worker.onmessage = handlerFunction;
  }
};

workerBase.send = function(message, worker) {
  try {
    if (worker == null) {
      postMessage(message);
    } else {
      worker.postMessage(message);
    }
  } catch(e) {
    if ((workerBase.handler != null)
        && (typeof workerBase.handler === 'function')) {
      let description = 'send error';
      let messageError = workerBase.createMessageErrorOnMessage(description, message);
      workerBase.handler(messageError);
    }
  }
};

