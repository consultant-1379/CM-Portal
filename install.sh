#!/bin/bash
export COMPOSE_PROJECT_NAME="cmportalproduction"
if [[ $1 == "" ]]
then
    echo "Version not found. Please specify a valid CM-PORTAL version e.g 0.0.632";
    exit 1
fi
if [[ $2 == "" ]]
then
    echo "Server not specified. Please specify the FQDN of the server";
    exit 1
fi
UPGRADE_VERSION=$1 SERVER=$2 docker-compose -f docker-compose-production.yml pull
if [[ $? -ne 0 ]]
then
    exit 1
fi
UPGRADE_VERSION=$1 SERVER=$2 docker-compose -f docker-compose-production.yml up -d
