# pomodoro-timer
pomodoro-timer on web

## use
[URL](https://awazo.github.io/pomodoro-timer/)

## develop

### MUST setup scriptPath for each environment
* on web server (branch main)
```: assets/script/pomodoroTimerWorker.js
// for local use: setup script directory path as "file://xxx"
let scriptPath = 'https://awazo.github.io/pomodoro-timer/assets/script/';
```
* on local use (branch dev/main)
```: assets/script/pomodoroTimerWorker.js
// for local use: setup script directory path as "file://xxx"
let scriptPath = 'file://YOUR/LOCAL/PATH/assets/script/';
```

