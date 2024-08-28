#!/bin/bash
export COMPOSE_PROJECT_NAME="cmportalproduction_local"
time docker-compose -f docker-compose-production-local.yml up --build --force-recreate
