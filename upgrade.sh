#!/bin/bash
export COMPOSE_PROJECT_NAME="cmportalproduction"
if [[ $1 == "" ]]
then
    echo "Version incorrect or not found. Please specify a valid CM PORTAL version e.g. 0.0.632";
    exit 1
fi
if [[ $2 == "" ]]
then
    echo "Server not specified. Please specify the FQDN of the server";
    exit 1
fi
time UPGRADE_VERSION=$1 SERVER=$2 docker-compose -f docker-compose-production.yml pull
if [[ $? -ne 0 ]]
then
    exit 1
fi
SCRIPTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
${SCRIPTDIR}/create_mongodb_backup.sh
if [[ $? -ne 0 ]]
then
    exit 1
fi
time UPGRADE_VERSION=$1 SERVER=$2 docker-compose -f docker-compose-production.yml up -d

./health_check.sh
