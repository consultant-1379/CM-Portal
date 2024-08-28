#!/bin/bash
docker exec -it $(docker ps --filter "ancestor=cmportaldevelopment_nodejs" -q) sh
