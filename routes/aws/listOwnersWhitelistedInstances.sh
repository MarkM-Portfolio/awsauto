#!/bin/bash
#==list AWS instances owned by specific person and Area tags==

list_instances(){
  owner_email="${1}*"
  tag="${2}*"

  aws ec2 describe-instances --filter Name=tag:Owner,Values=${owner_email} \
  --query "Reservations[*].Instances[*].{Instance:InstanceId,SecurityGroup:NetworkInterfaces[0].[Groups][0][0].[GroupName][0],status:State.[Name][0],Name:Tags[?Key=='Name']|[0].Value,Owner:Tags[?Key=='Owner']|[0].Value,Area:Tags[?Key=='Area']|[0].Value}" --output json | sed '$d' | sed '$s/\]/],/g' > res1-$1.txt

  # check if owner has servers
  if [ -s res1-$1.txt ]; then
      aws ec2 describe-instances --filter Name=tag:Area,Values=$tag \
      --query "Reservations[*].Instances[*].{Instance:InstanceId,SecurityGroup:NetworkInterfaces[0].[Groups][0][0].[GroupName][0],status:State.[Name][0],Name:Tags[?Key=='Name']|[0].Value,Owner:Tags[?Key=='Owner']|[0].Value,Area:Tags[?Key=='Area']|[0].Value}" --output json | sed '1d' > res2-$1.txt

      cat res1-$1.txt res2-$1.txt 
  else
      aws ec2 describe-instances --filter Name=tag:Area,Values=$tag \
      --query "Reservations[*].Instances[*].{Instance:InstanceId,SecurityGroup:NetworkInterfaces[0].[Groups][0][0].[GroupName][0],status:State.[Name][0],Name:Tags[?Key=='Name']|[0].Value,Owner:Tags[?Key=='Owner']|[0].Value,Area:Tags[?Key=='Area']|[0].Value}" --output json > res2-$1.txt

      cat res2-$1.txt 
  fi

  rm res1-$1.txt res2-$1.txt &>> /dev/null 
}

list_instances $1 $2
