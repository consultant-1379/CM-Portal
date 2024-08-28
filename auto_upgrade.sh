#!/bin/bash
#To upgrade production CM-PORTAL to a specific version, run ./auto_upgrade.sh <version>
#Example:
#./auto_upgrade.sh 0.0.632

UPGRADE_VERSION=$1
SERVER=$2

echo "Checking out the latest CM-PORTAL code...";
git checkout -f master
git reset --hard origin/master
git pull -f

TAG=`git tag -l CM-Portal-$UPGRADE_VERSION`
if [[ $UPGRADE_VERSION == "" ]] || [[ $TAG == "" ]]
then
    echo "Version incorrect or not found. Please specify a valid CM-PORTAL version e.g 0.0.632";
    exit 1
else
    echo "Running git checkout -f "$TAG;
    git checkout -f $TAG
fi

read -p "Are you sure you want to upgrade CM-PORTAL to $UPGRADE_VERSION (Y/N)?" -n 1 -r
echo #move to a new line
if [[ $REPLY =~ ^[Y]$ ]]
then
    echo "Performing CM-PORTAL upgrade...";
    cp SmokeTests/.env .
    ./upgrade.sh $UPGRADE_VERSION $SERVER
    if [[ $? -ne 0 ]]
    then
        echo "CM-PORTAL upgrade failed.";
    else
        echo "CM-PORTAL upgrade complete.";
    fi
else
    echo "CM-PORTAL upgrade cancelled.";
fi

echo "Remove dangling Docker networks, containers and images..."
docker system prune -af
