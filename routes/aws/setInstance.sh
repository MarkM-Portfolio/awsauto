#!/bin/bash
#==config AWS instance from lcauto23-pool-template to input Name and IP==

configInstance(){
  echo "====== remote access $1  ==========="
  newhostname=$1

  replaceHost=$(grep -lRZ lcauto23 /etc | xargs -0 -l sed -i -e s/lcauto23/${newhostname}/g)
  replaceIp=$(grep -lRZ 10.190.160.158 /etc | xargs -0 -l sed -i -e s/10.190.160.158/${ip}/g)
  replacedb2cfg=$(grep -lRZ lcauto23 /home/db2inst1/sqllib/db2nodes.cfg | xargs -0 -l sed -i -e s/lcauto23/${newhostname}/g)
  hostnamectl set-hostname --static ${newhostname}.cnx.cwp.pnp-hcl.com
}

AWSinstanceConfig(){
 
  newhostname=$1

  instanceId=$(aws ec2 describe-instances --filters Name=tag:Name,Values=${newhostname} --output text --query Reservations[*].Instances[*].InstanceId)
  echo $instanceId
  ip=$(aws ec2 describe-instances --filters Name=tag:Name,Values=${newhostname} --output text --query Reservations[*].Instances[*].PrivateIpAddress)
  echo $ip
  ssh -o StrictHostKeyChecking=no root@$ip "$(set); configInstance $newhostname $ip"
}

#python aws-run_instance.py $1
#sleep 1m
AWSinstanceConfig $1 
