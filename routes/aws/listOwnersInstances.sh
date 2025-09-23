#!/bin/bash
#==list AWS instances owned by specific person==

list_owners_instances(){
  owner_email="${1}*"
  aws ec2 describe-instances --filter Name=tag:Owner,Values=${owner_email} \
  --query "Reservations[*].Instances[*].{Instance:InstanceId,SecurityGroup:NetworkInterfaces[0].[Groups][0][0].[GroupName][0],status:State.[Name][0],Name:Tags[?Key=='Name']|[0].Value}" --output json
}

list_owners_instances $1
