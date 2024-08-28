## Tool Description

The Configuration Management Portal provides automation solutions for Mimer, including management of products and new product requests. Different roles can access different areas of the tool:
* User - Has no permissions past initial login
* Admin - Can manage users and perform primary administrative tasks
* Super Admin - Has all admin privillages as well as being ables to perform CRUD operations on users and roles with no restrictions

## Prerequisites

There are a number of prerequisites to run the tool in the development environment:

1. Docker (v18 - v24)
2. Docker-Compose (> v2)
3. Mongodb-tools (v100.9.0)

## Setup

To set up the application to run locally, following the below steps after cloning this project:

1. Copy the `.env` file from the `/SmokeTests` directory into the root directory of the project (`/CM-Portal`)
2. Inside the `.env` file, set the `ISTEST` value at the end of the file to an empty value. This allows access to the mimer-sandbox for development.

```
ISTEST=
```
3. Run the `dev.sh` file from the terminal in the root of the project

```
$ cd CM-Portal
CM-Portal$ ./dev.sh
```
5. In order to access the database, run the following commands to find the name of the network the containers are using and then copy a version of the live database to the local container:

```
CM-Portal$ docker network ls
CM-Portal$ tests/import_latest_DB.sh <network-name> live
```
6. The tool will now be running locally with a copy of the database. Login to the tool to add your details to the database. If the tool is running on your local machine go to http://localhost:8008
7. When the application is started, you will be assigned a basic user role. To update this, you must connect to the database on:

```
mongodb://localhost:27018/
```

9. After connecting, go to the `cmportal.roles` collection and copy the super admin object id. Then go to the `cmportal.users` collection and update the role id for your user with this code

```
_id: ObjectId('6605514d4566250046f6e1b6')
role_id: ObjectId('6605514d4566250046f6e1b7') // Update the number here
salt: "-------------------"
username: "eusetes"
displayName: "test user"
permissions: Array (empty)
created: 2024-03-28T11:15:25.138+00:00
password: "---------------"
email: "test.user@ericsson.com"
lastName: "test"
firstName: "user"
```

10. **Optional** \- For developing functionality in relation to Mimer\, a mimer token will be required for the mimer sandbox\, which can be requested here: [Mimer (ericsson.com)](https://mimer-sandbox.internal.ericsson.com/home). Take your token and enter it into the tool running in development, under the Mimer token tab.

## Deployment

When code changes are made, the following needs to be included in the commit message:

* Jira Ticket Number
* Minor, Major or Patch (From Jira ticket description)
* Short change description

```
$ git add .
$ git commit -m "[ETTD-XXXX][MINOR]short description of the change"
$ git push origin HEAD:refs/for/master
```

When code is pushed, 2 Jenkins jobs are triggered for Precode and Functional tests:

* [Precode Review Job](https://fem13s11-eiffel004.eiffel.gic.ericsson.se:8443/jenkins/job/cm-portal_PreCodeReview/)
* [Functional Tests Job](https://fem13s11-eiffel004.eiffel.gic.ericsson.se:8443/jenkins/job/cm-portal_FunctionalTests/)

When both jobs are successful and the code is merged, a release job is triggered on Jenkins which publishes docker images to the Ericsson docker registry and creates an updated change log.
* [Jenkinks Release Job](https://fem13s11-eiffel004.eiffel.gic.ericsson.se:8443/jenkins/job/cm-portal_Release/)
* [Change Log Report](https://arm1s11-eiffel004.eiffel.gic.ericsson.se:8443/nexus/content/sites/tor/CM-Portal/latest/changelog.html)


Below are links to the images on the Ericsson docker registry:
* [CM Portal Docker Image](https://arm.seli.gic.ericsson.se/artifactory/proj-cm-tools-docker-global/proj-cm-tools/)
* [SmokeTests Docker Image](https://arm.seli.gic.ericsson.se/artifactory/proj-cm-tools-docker-global/proj-cm-tools/cmportal_smoketest/)
* [CM Portal Reverse Proxy Docker Image](https://arm.seli.gic.ericsson.se/artifactory/proj-cm-tools-docker-global/proj-cm-tools/cmportal_reverse_proxy/)
* [API Docs Docker Image](https://arm.seli.gic.ericsson.se/artifactory/proj-cm-tools-docker-global/proj-cm-tools/cmportal_api_docs)
* [Help Docs Docker Image](https://arm.seli.gic.ericsson.se/artifactory/proj-cm-tools-docker-global/proj-cm-tools/cmportal_help_docs/)

Now that the tool is ready for upgrading, there is a few steps:

* Verify the version number to upgrade to via the change log
* SSH into the live tool and do the following, replacing UPGRADE_VERSION to your version and the SERVER_DOMAIN_NAME to the current server, e.g. seliius21596.seli.gic.ericsson.se:

```
$ ssh eatools@<SERVER_DOMAIN_NAME>
Enter Windows Password:
$ cd /local/CM-Portal
$ sudo su
Enter Windows Password:
$ printf 'Y' | ./auto_upgrade.sh <UPGRADE_VERSION> <SERVER_DOMAIN_NAME>
```

## New Install
In the event that the tool needs to be migrated to another server, SSH into the server where you would like to deploy the tool and you can follow these steps, replacing UPGRADE_VERSION to your version and the SERVER_DOMAIN_NAME to the current server, e.g. seliius21596.seli.gic.ericsson.se:
```
$ ssh eatools@<SERVER_DOMAIN_NAME>
Enter Windows Password:
$ cd /local/CM-Portal
$ sudo su
Enter Windows Password:
$ printf 'Y' | ./install.sh <UPGRADE_VERSION> <SERVER_DOMAIN_NAME>
```
**After this, the next step is to follow the SSL certficate instructions at the bottom of this document**

## Testing

To run the smoke tests in the project, set the `ISTEST` variable to `test` in the `.env` file:

```
ISTEST=test
```

Then run the following command:

```
// If the tool is running locally
$ ./smoke_tests_on_dev.sh
// If the tool is not running
$ ./smokeTests.sh
```

To run Lint tests:

```
// If the tool is running locally
$ ./webshellTests.sh
// If the tool is not running
$ ./preCodeReview.sh
```

## SSL Certificates
In the event of moving the tool to another server or updating the SSL Certificates, certs should be located in `CM-Portal/config/sslcerts` directory.

**Note that this directory is not there by default on a fresh clone of the tool, and will have to be made manaully**
Here should be the following:
* `cabundle.crt`
* `cert.pem`
* `key.pem`

Naming is important as the tool uses these names for referencing.
After the files have been changed/updated, the nginx container running the tool will need to be restarted:
```
docker restart <NGINX_CONTAINER_ID>
```

## Changelog

Below find the link to the CM Portal Changelog:
[CM PORTAL – Change Log Report (ericsson.se)](https://arm1s11-eiffel004.eiffel.gic.ericsson.se:8443/nexus/content/sites/tor/CM-Portal/latest/changelog.html)