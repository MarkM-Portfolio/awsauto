var express = require('express');
var router = express.Router();
var spawn = require("child_process").spawn;
var path = require('path');
var exec = require('child_process').exec;
var child_process = require("child_process");

var requestLogger = function (req, res, next) {
  var today = new Date();
  var dateTime = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate() + " "
                 + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  console.log("\n");
  console.log("INCOMING REQUEST " + dateTime + " " + req.method + " " + req.path);
  next();
}

router.use(requestLogger);

function configInstance(name, numberCalls) {
  numberCalls = numberCalls || 10;
  function timeoutHandler(){
    console.log(numberCalls);
    exec(path.join(__dirname + '/aws/setInstance.sh')+" "+name, function (error, stdout, stderr) {
      console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
        if (numberCalls > 1) {
          numberCalls -= 1;
          setTimeout(timeoutHandler,9000);
        } else {
          return;
        }
      }
    });
  }
  timeoutHandler();
}

function isAllowedMachine(machine_name, fn) {
  console.log("Determine if security access allowed for machine: " + machine_name);
  const pythonProcess = spawn('python',[path.join(__dirname + '/aws/aws-do_instance.py'), "SECURITYGROUPS", machine_name]);
  var securityGroup = "";
  pythonProcess.stdout.on('data', function(data) {
    securityGroup = data.toString();
    console.log(machine_name + " security group: " + securityGroup);
  });
  pythonProcess.on('exit', (code) => {
    if (code == 0){
      var groups = ["default", "rtc", "SSBE db2 ports for isljazz02"];
      fn(groups.some(it => securityGroup.includes(it)));
    } else {
      fn(false);
    }
  });
}


/* GET homw page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'AWS Instances Manager' });
});

/* GET instances */
router.get('/instances/:machineName', function(req, res, next) {

  const machine = req.params.machineName;
  console.log("Attempting to list " + machine + " AWS info and status");
  isAllowedMachine(machine, function(isAllowed){
    if (! isAllowed) {
      res.status(400).json({error: "invalid instance, only instances in the default security group are allowed."});
    } else {
      console.log("Security access approved for " + machine);
      let response = "";
      const pythonProcess = spawn('python',[path.join(__dirname + '/aws/aws-do_instance.py'), "", machine]);
      pythonProcess.stdout.on('data', function(data) {
        console.log(data.toString());
        response = data.toString();
      });
      pythonProcess.on('exit', (code) => {
        if (code != 0){
          res.status(404).json({error: machine + " not exist."});
        } else {
          console.log("Listing " + machine + " info was successful");
          res.send(response);
        }
      });
    }
  });
});

router.get('/instances', function(req, res, next) {

  filter_name = "lcauto";
  console.log("Attempting to list all server pool instances");
  exec(path.join(__dirname + '/aws/listInstances.sh')+" '"+filter_name+"'", function (error, stdout, stderr) {

    if (error !== null) {
      console.log('exec error: ' + error);
      console.log('stderr: ' + stderr);
      res.status(500);
      res.json({error: error,  stderr: stderr});
    } else {
      console.log("Listing all pool server instances successful");
      res.send(stdout);
    }
  });
});

router.get('/instances/owner/:ownerEmail', function(req, res, next) {
  const owner_email = req.params.ownerEmail;
  console.log("Attempting to look up all instances owned by " + owner_email);

  exec(path.join(__dirname + '/aws/listOwnersInstances.sh')+" '"+owner_email+"'", function (error, stdout, stderr) {
    if (error !== null) {
      console.log('exec error: ' + error);
      console.log('stderr: ' + stderr);
      res.status(500);
      res.json({error: error, stderr: stderr});
    } else {
      console.log("Look up of instances owned by " + owner_email + " successful");
      res.send(stdout);
    }
  });
});

router.get('/instances/whitelist/area/:tag', function(req, res, next) {
  const tag = req.params.tag;

  console.log("Attempting to look up all whitelisted instances with area tag value: " + tag);

  exec(path.join(__dirname + '/aws/listWhitelistedInstances.sh')+" '"+tag+"'", function (error, stdout, stderr) {
    if (error !== null) {
      console.log('exec error: ' + error);
      console.log('stderr: ' + stderr);
      res.status(500);
      res.json({error: error, stderr: stderr});
    } else {
      console.log("Look up of whitelisted instances successful");
      res.send(stdout);
    }
  });
});

router.get('/instances/ownerwhitelist/:ownerEmail/area/:tag', function(req, res, next) {
  const owner_email = req.params.ownerEmail;
  const tag = req.params.tag;

  console.log("Attempting to look up all instances owned by " + owner_email);
  console.log("Attempting to look up all whitelisted instances with area tag value: " + tag);

  exec(path.join(__dirname + '/aws/listOwnersWhitelistedInstances.sh')+" '"+owner_email+"'" +" '"+tag+"'", function (error, stdout, stderr) {
    if (error !== null) {
      console.log('exec error: ' + error);
      console.log('stderr: ' + stderr);
      res.status(500);
      res.json({error: error, stderr: stderr});
    } else {
      console.log("Look up of instances successful");
      res.send(stdout);
    }
  });
});

router.delete('/instances/:machineName', function(req, res, next) {

  const machine = req.params.machineName;
  console.log("Attempting to terminate instance " + machine_name)
  isAllowedMachine(machine, function(isAllowed){
    if (! isAllowed) {
      res.status(400);
      res.json({error: machine + " name is invalid, only instances in the default security group are allowed."});
    } else {
      console.log("Security access approved for " + machine);
      const pythonProcess = spawn('python',[path.join(__dirname + '/aws/aws-do_instance.py'), "t", machine]);
      pythonProcess.stdout.on('data', function(data) {
        console.log(data.toString());
      });
      pythonProcess.on('exit', (code) => {
        if (code != 0){
          res.status(404).json({error: machine + " does not exist."});
        } else {
          console.log(machine + " termination successful");
          res.json({name: machine, status: "terminating"});
        }
      });
    }
  });
});

router.put('/instances/:machineName', function(req, res, next) {

  const machine = req.params.machineName;

  const action = req.body && req.body.action

  console.log("Attempting to turn " + action + " " + machine)
  if (!action)
    return res.status(400).json({error: 'action is required. '});

  isAllowedMachine(machine, function(isAllowed){
    if (! isAllowed) {
      res.status(400).json({error: machine + " is not valid, only instances in the default security group are allowed."});
    } else if (action != "on" && action != "off"){
      res.status(400).json({error: 'invalid action, must be "on" or "off"'});
    } else {
      console.log("Security access approved for " + machine);
      const pythonProcess = spawn('python',[path.join(__dirname + '/aws/aws-do_instance.py'), action, machine]);
      pythonProcess.stdout.on('data', function(data) {
        console.log(data.toString());
      });
      pythonProcess.on('exit', (code) => {
        if (code != 0){
          res.status(404).json({error: `${machine} does not exist.`});
        } else {
          console.log(action + " request sent to AWS successfully for " + machine + ". Status above");
          if (action == "on"){
            res.json({status: "pending", name: machine});
          } else {
            res.json({status: "stopping", name: machine});
          }
        }
      });
    }
  });
});

router.post('/instances', function(req, res, next) {

  name = req.body && req.body.instance_name
  if (!name)
    return res.status(400).json({error: 'name is required'});

  type = req.body.instance_type
  if (!type)
    type ="t2.xlarge";

  console.log("Attempting to create a new instance " + name + " of type " + type);
  isAllowedMachine(machine, function(isAllowed){
    if (! isAllowed) {
      res.status(400).json({error: name + " is not valid, only instances in the default security group are allowed."});
    } else if (type != "t2.xlarge" && type != "t2.2xlarge") {
      res.status(400).json({error: 'invalid type, must be "t2.xlarge" or "t2.2xlarge"'});
    } else {
      console.log("Security access approved for " + machine);
      const pythonProcess = spawn('python',[path.join(__dirname + '/aws/aws-run_instance.py'), name, type]);
      pythonProcess.stdout.on('data', function(data) {
        console.log(data.toString());
      });
      pythonProcess.on('exit', (code) => {
        if (code != 0){
          if (code == 3){
            res.status(400).json({error: name + " already exist"});
          } else {
            res.status(500).json({error: "Return code is " + code + ". Launch failed. Please contact AWS admin."});
          }
        } else {
          console.log("Launching of " + machine + " successful.");
          res.json({name: name, status: "launching"});
          configInstance(name);
        }
      });
    }
  });
});

module.exports = router;

