#!/bin/bash
echo 'Starting Health-check'
export COMPOSE_PROJECT_NAME="cmportaltest"

cd SmokeTests

CMPORTAL_IP='seliius21596.seli.gic.ericsson.se:8008'

docker build . -t smoketest --force-rm
docker run --rm -e "HEALTH_CHECK=true" -e "BASE_URL=$CMPORTAL_IP" -e "TEST_USERNAME=dttadm100" -e "TEST_PASSWORD=Hilstfsr3v1ZSfQ67H92" -v "$PWD"/images:/opt/SmokeTest/images smoketest
if [[ $? -ne 0 ]]
then
    echo 'Health-check Failed. Please review failures to determine the next steps.'
else
    echo 'Health-check Passed.'
fi
exit 0
