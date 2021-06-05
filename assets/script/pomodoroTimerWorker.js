
var timer = null;
var count = 0;

onmessage = function(event) {
  if (event.data.command === 'start') {
    count = event.data.count;
    timer = setInterval(function() {
      count--;
      if (count < 0) {
        clearInterval(timer);
      }
      postMessage(count);
    }, 1000);
  } else if (event.data.command === 'stop') {
    if (timer != null) clearInterval(timer);
  }
};

