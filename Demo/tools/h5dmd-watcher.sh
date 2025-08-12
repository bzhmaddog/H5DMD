#!/bin/bash

WATCH_DIR="/app/node_modules/h5dmd/dist"
DEBOUNCE_TIME=500  # debounce time in ms
LAST_EVENT_TIME=0

inotifywait -m -r -e modify,create --exclude $WATCH_DIR/index.js $WATCH_DIR/*.js | while read FILE EVENT
do
    CURRENT_TIME=$(date +%s%3N)  # Current time in ms
    TIME_DIFF=$((CURRENT_TIME - LAST_EVENT_TIME))

    if [ $TIME_DIFF -ge $DEBOUNCE_TIME ]; then
        LAST_EVENT_TIME=$CURRENT_TIME

        if [ $EVENT = "MODIFY" ]; then
          echo "Change detected in : $FILE"
        fi

        if [ $EVENT = "CREATE" ]; then
          echo "File created : $FILE"
        fi


        touch "/app/main.ts"
    fi
done
