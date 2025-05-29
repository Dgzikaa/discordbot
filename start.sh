#!/bin/sh
cd /app/cs2-service && python app.py &
cd /app && node discord-bot.js
