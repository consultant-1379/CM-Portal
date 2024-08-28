#!/bin/bash
# This script is used to restore a DB Backup to MongDB Docker CONTAINER
# For CM-PORTAL For Local Development & Testing Purposes only.
#  NOT TO BE USED IN PRODUCTION
# Note:
# - Has to be run outside the container.
# - To restore to another network, also provide the network name: ./restore_mongodb_backup.sh <db_folder> <network_name>

BACKUP_DIR=$1
NETWORK=$2
if [[ $BACKUP_DIR == "" ]] || [[ ! -d $BACKUP_DIR ]] || [[ $2 == "" ]]
then
    echo "You must specify a valid directory & network to restore the database from"
    exit 1
fi
echo "Restoring mongodb database from directory $BACKUP_DIR"

docker run --rm -i -v $BACKUP_DIR:/backup --network=$NETWORK armdocker.seli.gic.ericsson.se/dockerhub-ericsson-remote/mongo:5.0.0 mongorestore /backup --host mongodb --drop
