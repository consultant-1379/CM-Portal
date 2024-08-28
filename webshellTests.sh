#!/bin/bash
docker exec -it $(docker ps --filter "ancestor=cmportaldevelopment_nodejs" -q) ./tests/styles.sh
docker exec -it $(docker ps --filter "ancestor=cmportaldevelopment_nodejs" -q) ./tests/server.sh
docker cp cmportaldevelopment_nodejs_1:/opt/mean.js/coverage .
