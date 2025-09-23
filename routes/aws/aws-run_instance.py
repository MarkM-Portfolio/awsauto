import sys
import boto3
import json
from botocore.exceptions import ClientError

ec2 = boto3.client('ec2')

hostname = sys.argv[1]
instance_type = sys.argv[2]

response = ec2.describe_instances(
    Filters=[
        {
            'Name': 'tag:Name',
            'Values': [
                hostname,
            ]
        },
    ],
    DryRun=False,
    MaxResults=111
)
print(response)

instance_number = 0
for reservation in response["Reservations"]:
    for instance in reservation["Instances"]:
        #print(instance)
        print(instance["InstanceId"])
        instance_number += 1
        for tag in instance["Tags"]:
            #print(tag)
            if tag["Key"] == 'Name':
                print(tag["Value"])

print (instance_number)
if instance_number > 0 :
    print(hostname + " exist, can't Launch")
    exit(3)

response = ec2.run_instances(
    TagSpecifications=[
        {
            'ResourceType': 'instance',
            'Tags': [{
                    'Key': 'Name',
                    'Value': hostname
                }]
        }
    ],
    MaxCount=1,
    MinCount=1,
    InstanceType=instance_type,
    LaunchTemplate={
        'LaunchTemplateId': 'lt-0a1c4c5f6d7f2351b',    
    }
)
print(response)

ip = response['Instances'][0]['PrivateIpAddress']
print(ip)

route53 = boto3.client('route53')
hostname = hostname+'.cnx.cwp.pnp-hcl.com'

response = route53.change_resource_record_sets(
    HostedZoneId='Z1HC50WPQE5P2W',
    ChangeBatch={
        'Comment': 'CREATE/DELETE/UPSERT a record',
        'Changes': [{
                'Action': 'CREATE',
                'ResourceRecordSet': {
                'Name': hostname,
                'Type': 'A',
                'SetIdentifier': 'string',
                'Region': 'us-east-1',
                'TTL': 300,
                'ResourceRecords': [{
                        'Value': ip
                    }]
                }
        }]
    }
)

print(response)

