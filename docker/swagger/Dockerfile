FROM armdocker.seli.gic.ericsson.se/dockerhub-ericsson-remote/swaggerapi/swagger-ui:v3.9.1

RUN mkdir -p /opt/meanjs
WORKDIR /opt/meanjs
ENV HOME /opt/meanjs

COPY ["modules/*/swagger/*.json", "./swagger/"]
COPY docker/swagger/gulpfile.js gulpfile.js
COPY docker/swagger/package.json package.json
COPY VERSION VERSION

RUN apk add --update nodejs \
  && npm install -g gulp-cli@2.3.0 gulp@4.0.2 \
    && npm cache clean --force

RUN apk add --update nodejs \
  && npm install && npm cache clean --force \

RUN  npm link gulp@4.0.2 \
  && gulp