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

pomodoro.current = {
  status: pomodoro.status.init,
  turn: 1,
  time: pomodoro.defaultWorkMinute * 60
};
pomodoro.setStatus = function(status) {
  if (!(status in pomodoro.status))
    pomodoro.current.status = pomodoro.status.init;
  if (status === pomodoro.current.status) return;
  if ((pomodoro.current.status !== pomodoro.status.init)
      && (status !== pomodoro.status.init))
    pomodoro.event[pomodoro.current.status + 'End'](pomodoro.current);
  pomodoro.current.status = status;
  if (pomodoro.current.status !== pomodoro.status.init)
    pomodoro.event[pomodoro.current.status + 'Start'](pomodoro.current);
};
pomodoro.setCurrent = function(status, turn, time) {
  if (!(status in pomodoro.status))
    status = pomodoro.status.init;
  if ((turn == null) || isNaN(turn))
    turn = 1;
  if ((time == null) || isNaN(time))
    time = pomodoro.defaultWorkMinute * 60;
  pomodoro.setStatus(status);
  pomodoro.current.turn = turn;
  pomodoro.current.time = time;
};

pomodoro.defaultUpdater = function(current) {};
pomodoro.updater = pomodoro.defaultUpdater;

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
  pomodoro.current.turn = 1;
  pomodoro.current.time = workMinute * 60;
};

pomodoro.timer = null;

pomodoro.start = function(updater) {
  if ((updater == null) || (typeof updater !== 'function'))
    updater = pomodoro.defaultUpdater;
  pomodoro.updater = updater;
  if (pomodoro.current.status === pomodoro.status.init) {
    pomodoro.setStatus(pomodoro.status.work);
  }
  pomodoro.updater(pomodoro.current);
  pomodoro.timer = setInterval(function() {
    pomodoro.current.time -= 1;
    if (pomodoro.current.time <= 0) {
      let nextStatus = pomodoro.getNextStatus(pomodoro.current);
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
      pomodoro.setCurrent(nextStatus, nextTurn, nextTime);
    }
    pomodoro.updater(pomodoro.current);
  }, 1000);
};

pomodoro.stop = function() {
  if (pomodoro.timer == null) return;
  clearInterval(pomodoro.timer);
};

pomodoro.reset = function() {
  pomodoro.setCurrent(pomodoro.status.init, 1, 0);
  pomodoro.updater(pomodoro.current);
};
pomodoro.resetTurn = function() {
  pomodoro.setCurrent(pomodoro.status.work, 1, pomodoro.config.workMinute * 60);
  pomodoro.updater(pomodoro.current);
};
pomodoro.resetTime = function() {
  let time = 0;
  if (pomodoro.current.status === pomodoro.status.work) {
    time = pomodoro.config.workMinute * 60;
  } else if (pomodoro.current.status === pomodoro.status.rest) {
    time = pomodoro.config.restMinute * 60;
  } else if (pomodoro.current.status === pomodoro.status.longRest) {
    time = pomodoro.config.longRestMinute * 60;
  }
  pomodoro.setCurrent(pomodoro.current.status, pomodoro.current.turn, time);
  pomodoro.updater(pomodoro.current);
};

