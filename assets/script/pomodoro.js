var pomodoro = pomodoro || {};

pomodoro.defaultWorkMinute = 25;
pomodoro.defaultRestMinute = 5;
pomodoro.defaultTurns = 4;
pomodoro.defaultLongRestMinute = 15;

pomodoro.config = {
  workMinute: pomodoro.defaultWorkMinute,
  restMinute: pomodoro.defaultRestMinute,
  turns: pomodoro.defaultTurns,
  longRestMinute: pomodoro.defaultLongRestMinute
};

pomodoro.status = {
  init: 'init',
  work: 'work',
  rest: 'rest',
  longRest: 'longRest'
};
pomodoro.getNextStatus = function(current) {
  if (!(current.status in pomodoro.status)) return pomodoro.status.init;
  if (current.status === pomodoro.status.init) return pomodoro.status.work;
  if (current.status === pomodoro.status.work) {
    if (current.turn < pomodoro.config.turns) {
      return pomodoro.status.rest;
    } else {
      return pomodoro.status.longRest;
    }
  }
  if ((current.status === pomodoro.status.rest)
      || (current.status === pomodoro.status.longRest)) {
    return pomodoro.status.work;
  }
  return pomodoro.status.init;
};

pomodoro.timerStatus = {
  stop: 'stop',
  start: 'start'
};

pomodoro.current = {
  status: pomodoro.status.init,
  timerStatus: pomodoro.timerStatus.stop,
  turn: 1,
  time: pomodoro.defaultWorkMinute * 60
};
pomodoro.setStatus = function(status) {
  if (!(status in pomodoro.status))
    pomodoro.current.status = pomodoro.status.init;
  if (status === pomodoro.current.status) return;
  if (!pomodoro.isSuppressEvent &&
      (pomodoro.current.status !== pomodoro.status.init))
    pomodoro.event[pomodoro.current.status + 'End'](pomodoro.current);
  pomodoro.current.status = status;
  if (!pomodoro.isSuppressEvent &&
      (pomodoro.current.status !== pomodoro.status.init))
    pomodoro.event[pomodoro.current.status + 'Start'](pomodoro.current);
};
pomodoro.setTimerStatus = function(timerStatus) {
  if (!(timerStatus in pomodoro.timerStatus))
    timerStatus = pomodoro.timerStatus.stop;
  if (timerStatus === pomodoro.current.timerStatus) return;
  pomodoro.current.timerStatus = timerStatus;
};
pomodoro.setCurrent = function(status, timerStatus, turn, time) {
  if ((turn == null) || isNaN(turn))
    turn = 1;
  if ((time == null) || isNaN(time))
    time = pomodoro.defaultWorkMinute * 60;
  pomodoro.setStatus(status);
  pomodoro.setTimerStatus(timerStatus);
  pomodoro.current.turn = turn;
  pomodoro.current.time = time;
};

pomodoro.defaultUpdater = function(current) {};
pomodoro.updater = pomodoro.defaultUpdater;

pomodoro.isSuppressEvent = false;
pomodoro.event = {
  workStart: function(current) {},
  workEnd: function(current) {},
  restStart: function(current) {},
  restEnd: function(current) {},
  longRestStart: function(current) {},
  longRestEnd: function(current) {}
};
pomodoro.on = function(event, handler) {
  if (!(event in pomodoro.event)) return;
  if ((handler == null) || (typeof handler !== 'function')) return;
  pomodoro.event[event] = handler;
};

pomodoro.init = function(workMinute, restMinute, turns, longRestMinute) {
  try {
    pomodoro.isSuppressEvent = true;
    pomodoro.stop();
    pomodoro.reset();
    if ((workMinute == null) || isNaN(workMinute))
      workMinute = pomodoro.defaultWorkMinute;
    if ((restMinute == null) || isNaN(restMinute))
      restMinute = pomodoro.defaultRestMinute;
    if ((turns == null) || isNaN(turns))
      turns = pomodoro.defaultTurns;
    if ((longRestMinute == null) || isNaN(longRestMinute))
      longRestMinute = pomodoro.defaultLongRestMinute;
    pomodoro.config.workMinute = workMinute;
    pomodoro.config.restMinute = restMinute;
    pomodoro.config.turns = turns;
    pomodoro.config.longRestMinute = longRestMinute;
    pomodoro.setStatus(pomodoro.status.init);
    pomodoro.setTimerStatus(pomodoro.timerStatus.stop);
    pomodoro.current.turn = 1;
    pomodoro.current.time = workMinute * 60;
  } finally {
    pomodoro.isSuppressEvent = false;
  }
};

pomodoro.timer = null;

pomodoro.start = function(updater) {
  if ((updater == null) || (typeof updater !== 'function'))
    updater = pomodoro.defaultUpdater;
  pomodoro.updater = updater;
  if (pomodoro.current.status === pomodoro.status.init) {
    pomodoro.setStatus(pomodoro.status.work);
  }
  pomodoro.setTimerStatus(pomodoro.timerStatus.start);
  pomodoro.updater(pomodoro.current);
  pomodoro.timer = setInterval(function() {
    pomodoro.current.time -= 1;
    if (pomodoro.current.time <= 0) {
      let nextStatus = pomodoro.getNextStatus(pomodoro.current);
      let nextTimerStatus = pomodoro.current.timerStatus;
      let nextTurn = pomodoro.current.turn;
      let nextTime = 0;
      if ((pomodoro.current.status === pomodoro.status.work)
          && (nextStatus === pomodoro.status.rest)) {
        nextTime = pomodoro.config.restMinute * 60;
      } else if ((pomodoro.current.status === pomodoro.status.work)
                 && (nextStatus === pomodoro.status.longRest)) {
        nextTime = pomodoro.config.longRestMinute * 60;
      } else if ((pomodoro.current.status === pomodoro.status.rest)
                 && (nextStatus === pomodoro.status.work)) {
        nextTurn += 1;
        nextTime = pomodoro.config.workMinute * 60;
      } else if ((pomodoro.current.status === pomodoro.status.longRest)
                 && (nextStatus === pomodoro.status.work)) {
        nextTurn = 1;
        nextTime = pomodoro.config.workMinute * 60;
      } else {
        pomodoro.stop();
        return;
      }
      pomodoro.setCurrent(nextStatus, nextTimerStatus, nextTurn, nextTime);
    }
    pomodoro.updater(pomodoro.current);
  }, 1000);
};

pomodoro.stop = function() {
  if (pomodoro.timer == null) return;
  clearInterval(pomodoro.timer);
  pomodoro.setTimerStatus(pomodoro.timerStatus.stop);
};

pomodoro.reset = function() {
  let status = pomodoro.status.init;
  let timerStatus = pomodoro.current.timerStatus;
  let turns = 1;
  let time = 0;
  pomodoro.setCurrent(status, timerStatus, turns, time);
  pomodoro.updater(pomodoro.current);
};
pomodoro.resetTurn = function() {
  let status = pomodoro.status.work;
  let timerStatus = pomodoro.current.timerStatus;
  let turns = 1;
  let time = pomodoro.config.workMinute * 60;
  if (pomodoro.current.timerStatus === pomodoro.timerStatus.stop)
    status = pomodoro.status.init;
  try {
    pomodoro.isSuppressEvent = true;
    pomodoro.setStatus(pomodoro.status.init);
    if (pomodoro.current.timerStatus === pomodoro.timerStatus.start)
      pomodoro.isSuppressEvent = false;
    pomodoro.setCurrent(status, timerStatus, turns, time);
  } finally {
    pomodoro.isSuppressEvent = false;
  }
  pomodoro.updater(pomodoro.current);
};
pomodoro.resetTime = function() {
  let status = pomodoro.current.status;
  let timerStatus = pomodoro.current.timerStatus;
  let turns = pomodoro.current.turn;
  let time = 0;
  if (pomodoro.current.status === pomodoro.status.work) {
    time = pomodoro.config.workMinute * 60;
  } else if (pomodoro.current.status === pomodoro.status.rest) {
    time = pomodoro.config.restMinute * 60;
  } else if (pomodoro.current.status === pomodoro.status.longRest) {
    time = pomodoro.config.longRestMinute * 60;
  }
  try {
    pomodoro.isSuppressEvent = true;
    pomodoro.setStatus(pomodoro.status.init);
    if (pomodoro.current.timerStatus === pomodoro.timerStatus.start)
      pomodoro.isSuppressEvent = false;
    pomodoro.setCurrent(status, timerStatus, turns, time);
  } finally {
    pomodoro.isSuppressEvent = false;
  }
  pomodoro.updater(pomodoro.current);
};

