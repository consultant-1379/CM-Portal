#!/bin/bash
# This script is used to create a backup of the data and logging DBs from CM Portal.
# Note:
# - To create backup of production DBs, use: ./create_mongodb_backup.sh
# - To create backup of local DBs, provide the network name: ./create_mongodb_backup.sh <network_name>

BACKUP_ROOT="/export/CM_PORTAL/"
DATABASES=("cmportal")

for DATABASE in "${DATABASES[@]}"
do
  BACKUP_DIR=$BACKUP_ROOT$DATABASE/`date "+%Y%m%d%H%M%S"`
  echo "Backing up mongodb $DATABASE database to directory $BACKUP_DIR"
  mkdir -p $BACKUP_DIR
  if [[ $? -ne 0 ]]
  then
    exit 1
  fi
  chmod 777 $BACKUP_DIR
  if [[ $1 != "" ]]
  then
      echo "Creating backup via specified network ($1)"
      NETWORK=$1
      docker run --rm -v $BACKUP_DIR:/backup --network=$NETWORK armdocker.seli.gic.ericsson.se/dockerhub-ericsson-remote/mongo:5.0.0 mongodump --db=$DATABASE --excludeCollection=sessions --out /backup --host mongodb
  else
      # mongodump from replica test
      mongodump --uri "mongodb://cmportal_admin:t7Jf92XlVOK6xe4@cmportal-mongo-1880-m1.seli.gic.ericsson.se:27017,cmportal-mongo-1880-m2.seli.gic.ericsson.se:27017,cmportal-mongo-1880-m3.seli.gic.ericsson.se:27017/cmportal?replicaSet=seliiudb01828_MongoInstance27017_rs01" --excludeCollection=sessions --out /$BACKUP_DIR
      # to test db connectivity connect to the primary
      # mongodump --uri "mongodb://cmportal_admin:t7Jf92XlVOK6xe4@seliius28843.seli.gic.ericsson.se:27020/cmportal" --excludeCollection=sessions --out /$BACKUP_DIR
  fi
done
