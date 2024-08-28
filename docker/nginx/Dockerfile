FROM armdocker.seli.gic.ericsson.se/dockerhub-ericsson-remote/nginx:1.15.12-alpine

RUN apk --no-cache add curl

ENV SERVER=SERVERNAME

COPY production.conf /etc/nginx/conf.d/default.conf
