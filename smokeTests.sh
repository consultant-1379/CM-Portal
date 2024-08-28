#!/bin/bash
echo 'Starting Smoke Tests'
export COMPOSE_PROJECT_NAME="cmportaltest"

cp SmokeTests/.env .
time docker-compose build
time docker-compose up -d --force-recreate

count=1
max=10
CMPORTAL_IP=`docker inspect -f "{{ .NetworkSettings.Networks.cmportaltest_default.Gateway }}" cmportaltest_nginx_1`

until $(http_proxy= curl --output /dev/null --silent --head --fail $CMPORTAL_IP:8008/authentication/signin); do
    echo -n 'Attempt '$count'/'$max': Waiting for container to come up at '
    echo $CMPORTAL_IP:8008/authentication/signin
    sleep 10
    CMPORTAL_IP=`docker inspect -f "{{ .NetworkSettings.Networks.cmportaltest_default.Gateway }}" cmportaltest_nginx_1`
    count=`expr $count + 1`
    if [ $count -gt $max ]
    then
        echo "Container didn't come up. Smoke Tests Failed. Exiting..."
        exit 1
    fi
done

# Run Smoke Tests
cd SmokeTests
./prepare_db_for_smoke_tests.sh cmportaltest_default
docker build . -t smoketest --force-rm
docker run --rm -e "HEALTH_CHECK=false" -e "BASE_URL=$CMPORTAL_IP:8008" -e "TEST_USERNAME=dttadm100" -e "TEST_PASSWORD=Hilstfsr3v1ZSfQ67H92" -v "$PWD"/images:/opt/SmokeTest/images -v "$PWD"/allure-results:/opt/SmokeTest/allure-results smoketest

if [[ $? -ne 0 ]]
then
    echo 'Smoke tests failed.'
    time docker-compose down --volumes
    exit 1
fi

time docker-compose down --volumes
