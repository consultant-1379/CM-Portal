#!/bin/bash
export COMPOSE_PROJECT_NAME="cmportaldevelopment"
time docker-compose down --volumes

# get ip address of host vm
HOST_IP=$(hostname)

if [[ $? -ne 0 ]]
then
    echo ok
fi
time docker-compose build
if [[ $? -ne 0 ]]
then
    exit 1
fi
time docker-compose up --force-recreate
if [[ $? -ne 0 ]]
then
    exit 1
fi
