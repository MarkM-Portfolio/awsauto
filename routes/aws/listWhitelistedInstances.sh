#!/bin/bash
#==list AWS whitelisted instances==

list_instances(){
  tag="${1}*"
  aws ec2 describe-instances --filter Name=tag:Area,Values=$tag \
  --query "Reservations[*].Instances[*].{Instance:InstanceId,SecurityGroup:NetworkInterfaces[0].[Groups][0][0].[GroupName][0],status:State.[Name][0],Name:Tags[?Key=='Name']|[0].Value}" --output json
}

list_instances $1 
