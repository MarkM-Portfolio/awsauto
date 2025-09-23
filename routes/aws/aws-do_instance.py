import sys
import os
import json

from botocore.exceptions import ClientError
import boto3

instance_name = sys.argv[2]
action = sys.argv[1].upper()

ec2 = boto3.client('ec2')

response = ec2.describe_instances(
    Filters=[
        {
            'Name': 'tag:Name',
            'Values': [
                instance_name,
            ]
        },
    ],
    DryRun=False,
    MaxResults=111
)
#time.sleep(1)
#print(response)

cur_path = os.path.dirname(__file__)
#print(cur_path)

instance_number = 0
result = {}

for reservation in response["Reservations"]:
    for instance in reservation["Instances"]:
        result['ID'] = instance["InstanceId"]
        result['IP'] = instance["PrivateIpAddress"]
        result['status'] = instance["State"]["Name"]
        result['SecurityGroupName'] = instance["SecurityGroups"][0]["GroupName"]
        instance_number += 1

#print (instance_number)

instance_id = response['Reservations'][0]['Instances'][0]['InstanceId']
ip = response['Reservations'][0]['Instances'][0]['PrivateIpAddress']

if instance_name == 'lcauto*':
    exit()

if action == 'T':
    # Do a dryrun first to verify permissions
    try:
        ec2.terminate_instances(InstanceIds=[instance_id], DryRun=True)
    except ClientError as e:
        if 'DryRunOperation' not in str(e):
            raise

    # Dry run succeeded, terminate_instance
    try:
        response = ec2.terminate_instances(InstanceIds=[instance_id], DryRun=False)
        print(json.dumps(response))
    except ClientError as e:
        print(e)

    route53 = boto3.client('route53')
    instance_name = instance_name + '.cnx.cwp.pnp-hcl.com'

    response = route53.change_resource_record_sets(
        HostedZoneId='Z1HC50WPQE5P2W',
        ChangeBatch={
            'Comment': 'CREATE/DELETE/UPSERT a record',
            'Changes': [{
                'Action': 'DELETE',
                'ResourceRecordSet': {
                    'Name': instance_name,
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
    print(json.dumps(response))
elif action == 'ON':
    # Do a dryrun first to verify permissions
    try:
        ec2.start_instances(InstanceIds=[instance_id], DryRun=True)
    except ClientError as e:
        if 'DryRunOperation' not in str(e):
            raise

    # Dry run succeeded, start_instances
    try:
        response = ec2.start_instances(InstanceIds=[instance_id], DryRun=False)
        print(response)
    except ClientError as e:
        print(e)
elif action == 'OFF':
    # Do a dryrun first to verify permissions
    try:
        ec2.stop_instances(InstanceIds=[instance_id], DryRun=True)
    except ClientError as e:
        if 'DryRunOperation' not in str(e):
            raise

    # Dry run succeeded,  stop_instances
    try:
        response = ec2.stop_instances(InstanceIds=[instance_id], DryRun=False)
        print(response)
    except ClientError as e:
        print(e)
elif action == 'SECURITYGROUPS':
    print(result['SecurityGroupName'])
else:
    # Do nothing now, DryRun

    print(json.dumps(result))
