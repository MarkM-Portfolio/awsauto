# awsauto
 ### A Lightweight Web Service to manager Pool servers

Set secure AWS Web Service on: cnxawsauto.cnx.cwp.pnp-hcl.com

* [Install and  Configuring WAS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) with cnxtool@hcl.com

* [Install boto3](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/quickstart.html) : Amazon Web Services (AWS) SDK for Python

* Deploy and run awsauto Web Service:

        On cnxawsauto, under /home/pwang/git
        git clone git@git.cwp.pnp-hcl.com:conn-automation/awsauto.git
        Generate openssl keys and cert (for HTTPs )
        cd awsauto
        Run: DEBUG=awsauto:* npm start
        
* To refresh the build on cnxawsauto:
        -kill the currently running node process
        screen
        sudo su pwang
        cd /home/pwang/git/awsauto
        git pull
        DEBUG=awsauto:* npm start

Dashboard consume that service with proper credential, send request (REST API) to the service.  The web service verify the request and send response back.

Current version of awsauto Service only allow create/delete/update AWS instances within Pool Servers.

Pool server AWS instances are based on exist pool template, they share same properties.

### Supported REST API ( with return example ):
     
    GET server_host/instances
    curl -k -u admin:token https://cnxawsauto.cnx.cwp.pnp-hcl.com:3000/instances
    HTTP 200 OK
        [[{
            "Instance": "i-0e787cb23d6576468",
            "Name": "lcauto26"
        }],
        [{
            "Instance": "i-0d915efac1ca2c13e",
            "Name": "lcauto100"
        },
        {
            "Instance": "i-09a8d8d8e1d6a1390",
            "Name": "lcauto102"
        },
        {
            "Instance": "i-051bf275e446a4111",
            "Name": "lcauto101"
        }],
        ...
        [{
            "Instance": "i-06e7297bfa07f3421",
            "Name": "lcauto158"
        },
        ...
        {
            "Instance": "i-09b4d3f0b57d7ca44",
            "Name": "lcauto119"
        }],
        [{
            "Instance": "i-014d11ca64fcc9f9b",
            "Name": "lcauto0"
        }]]

    GET server_host/instances/<instance_name>
        status: pending | running | stopping | stopped
        curl -k -u admin:token https://cnxawsauto.cnx.cwp.pnp-hcl.com:3000/instances/bvtdb2
        return:
            HTTP Code: 400
            Content: {"error": "invalid instance name, only lcauto* allowed"}
        curl -k -u admin:token https://cnxawsauto.cnx.cwp.pnp-hcl.com:3000/instances/lcauto2000
        return:
            HTTP Code: 404
            Content: {"error": "lcauto2000 does not exist"}
        curl -k -u admin:token https://cnxawsauto.cnx.cwp.pnp-hcl.com:3000/instances/lcauto27
            HTTP Code: 200
            Content: {'Status': 'running', 'IP': '10.190.160.180', 'ID': 'i-0e847edcf2ab3c34e'}

    POST server_host/instances - create new instance
        request body:
            {
                "instance_name":"lcautoxxx",
                "instance_type":"t2.xlarge"|"t2.2xlarge"
            }
        return:
            instance_name + " is not valid.";
            instance_type + " is not valid.";
            instance_name + " is already exist, Skip Launch";
            "Lanuch failed. Please contact AWS admin.";
            instance_name + " is Launching...";

    PUT server_host/instances/<instance_name>
        request body:
            {
                "action":"on"|"off"
            }

        curl -k -u admin:token -H "Content-Type: application/json" \
            -X PUT -d '{"action": "on"}'
            https://cnxawsauto.cnx.cwp.pnp-hcl.com:3000/instances/bvtdb2
        return:
            HTTP Code: 400
            Content: {"error": "invalid instance name, only lcauto* allowed"}

        curl -k -u admin:token -H "Content-Type: application/json" \
            -X PUT -d '{"action": "start"}'
            https://cnxawsauto.cnx.cwp.pnp-hcl.com:3000/instances/lcauto27
        return:
            HTTP Code: 400
            Content: {"error": "invalid action, must be on or off"}

        curl -k -u admin:token -H "Content-Type: application/json" \
            -X PUT -d '{"action": "off"}'
            https://cnxawsauto.cnx.cwp.pnp-hcl.com:3000/instances/lcauto27777
        return:
            HTTP Code: 404
            Content: {"error": "lcauto27777 does not exits"}

        curl -k -u admin:token -H "Content-Type: application/json" \
            -X PUT -d '{"action": "on"}'
            https://cnxawsauto.cnx.cwp.pnp-hcl.com:3000/instances/lcauto27
        return:
            HTTP Code: 200
            Content: {"status": "starting", "name": "lcauto27"}

        curl -k -u admin:token -H "Content-Type: application/json" \
            -X PUT -d '{"action": "off"}'
            https://cnxawsauto.cnx.cwp.pnp-hcl.com:3000/instances/lcauto27
        return:
            HTTP Code: 200
            Content: {"status": "stopping", "name": "lcauto27"}

    DELETE server_host/intances/<instance_name>
        return:
            <instance_name> + " is not valid.";
            <instance_name> + " not exist.";
            <instance_name> + " is terminating... ";
     
    GET server_host/instances/owner/<owner_aws_email>
        curl -k -u admin:token https://cnxawsauto:3000/instances/owner/alexander.rice@hcl.com
        return:
            [
                [
                    {
                        "Instance": "i-0752c44e85549b464",
                        "Name": "quickstart"
                    }
                ]
            ]
         curl -k -u admin:token https://cnxawsauto:3000/instances/owner/fake_email@fake.com
         return:
             []

    GET server_host/instances/whitelist/area/<tag>
        curl -k -u admin:token https://cnxawsauto:3000/instances/whitelist/area/ansible
        return:
            [
                [
                    {
                        "Instance": "i-0d250965f21ea6d64",
                        "SecurityGroup": "OrionExternalSecureTraffic",
                        "status": "running",
                        "Name": "c7cnx-almalinux9connections1"
                    }
                ]
            ]

    GET server_host/instances/ownerwhitelist/<owner_aws_email>/area/<tag>
        curl -k -u admin:token https://cnxawsauto:3000/instances/ownerwhitelist/cameron.bosnic@hcl.com/area/ansible
        return:
            [
                [
                    {
                        "Instance": "i-09f0a25af23c91dde",
                        "SecurityGroup": "launch-wizard-9",
                        "status": "stopped",
                        "Name": "c7cf8-eks",
                        "Owner": "cameron.bosnic@hcl.com",
                        "Area": "Prod"
                    }
                ],
                [
                    {
                        "Instance": "i-0d250965f21ea6d64",
                        "SecurityGroup": "OrionExternalSecureTraffic",
                        "status": "running",
                        "Name": "c7cnx-almalinux9connections1",
                        "Owner": "sabrina.yee@hcl.com",
                        "Area": "ansible"
                    }
                ]
            ]
