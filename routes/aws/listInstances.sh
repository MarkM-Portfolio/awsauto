#!/bin/bash
#==list AWS instances==

list_instances(){
  filtername="${1}*"
  aws ec2 describe-instances --filter Name=tag:Name,Values=$filtername --query "Reservations[*].Instances[*].{Instance:InstanceId,Name:Tags[?Key=='Name']|[0].Value}"
}

list_instances $1 
