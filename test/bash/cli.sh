#!/usr/bin/env bash

SRC=$(cd $(dirname "$0"); pwd)
source "${SRC}/include.sh"

echo -e "\033[1mRunning tests:\033[0m"

cd $file_path

#
# Different way to stop process
#
$pm2 start echo.js
$pm2 start echo.js -f
$pm2 start echo.js -f

should 'should have start 3 apps' 'restart_time' 3

$pm2 stop 12412
$pm2 stop 0

should 'should have stopped 1 apps' 'stopped' 1

$pm2 stop asdsdaecho.js

$pm2 stop echo

should 'should have stopped 3 apps' 'stopped' 3


#
# Describe process
#
$pm2 describe 0
spec "should describe stopped process"

$pm2 restart 1

$pm2 describe 1
spec "should describe online process"

$pm2 describe asdsa
ispec "should exit with right exit code when no process found"

#
# Update pm2
#
$pm2 updatePM2
spec "should update pm2"



#
# Verify PID
#
$pm2 kill

$pm2 start echo.js -p echo.pid

sleep 0.5
ls echo-0.pid
spec "should pid file exists"

$pm2 stop all

sleep 1

ls echo-0.pid
ispec "should pid file be deleted once stopped"

$pm2 kill

$pm2 start echo.js -p echo.pid -i 1

sleep 1

ls echo-0.pid
spec "should pid file exists"

$pm2 stop all

sleep 1

ls echo-0.pid
ispec "should pid file be deleted once stopped"

$pm2 kill






#
# Main tests
#
$pm2 kill
spec "kill daemon"

$pm2 start eyayimfake
ispec "should fail if script doesnt exist"

$pm2
ispec "No argument"

$pm2 list

$pm2 start cluster-pm2.json
spec "Should start well formated json with name for file prefix"

$pm2 list
spec "Should list processes succesfully"


$pm2 start multi-echo.json
spec "Should start multiple applications"

$pm2 generate echo
spec "Should generate echo sample json"

$pm2 start echo-pm2.json -f
spec "Should start echo service"

$pm2 list


# $pm2 logs &
# spec "Should display logs"
# TMPPID=$!

# sleep 1

# kill $!
# spec "Should kill logs"

# $pm2 logs echo &
# spec "Should display logs"
# TMPPID=$!

# sleep 1

# kill $!
# spec "Should kill logs"


$pm2 web
spec "Should start web interface"

sleep 0.3

JSON_FILE='/tmp/web-json'

$http_get -q http://localhost:9615/ -O $JSON_FILE
cat $JSON_FILE | grep "HttpInterface.js" > /dev/null
spec "Should get the right JSON with HttpInterface file launched"

$pm2 flush
spec "Should clean logs"

# cat ~/.pm2/logs/echo-out.log | wc -l
# spec "File Log should be cleaned"

sleep 0.3
$http_get -q http://localhost:9615/ -O $JSON_FILE
cat $JSON_FILE | grep "restart_time\":0" > /dev/null
spec "Should get the right JSON with HttpInterface file launched"

#
# Restart only one process
#
$pm2 restart 1
should 'should has restarted process' 'restart_time: 1' 1

#
# Restart all processes
#
$pm2 restart all
spec "Should restart all processes"

sleep 1
$http_get -q http://localhost:9615/ -O $JSON_FILE
OUT=`cat $JSON_FILE | grep -o "restart_time\":1" | wc -l`

[ $OUT -eq 7 ] || fail "Error while wgeting data via web interface"
success "Got data from interface"


$pm2 list

$pm2 dump
spec "Should dump current processes"

$pm2 save
spec "Should save (dump alias) current processes"


ls ~/.pm2/dump.pm2
spec "Dump file should be present"

$pm2 stop all
spec "Should stop all processes"

sleep 0.5
should 'should have stopped 8 apps' 'stopped' 8


$pm2 kill

#
# Issue #71
#

PROC_NAME='ECHONEST'
# Launch a script with name option
$pm2 start echo.js --name $PROC_NAME -f
should 'should have started app with name' 'ECHONEST' 5

# Restart a process by name
$pm2 restart $PROC_NAME
should 'should have restarted app by name' 'restart_time: 1' 1



$pm2 kill

$pm2 resurrect
spec "Should resurrect all apps"

sleep 0.5
should 'should have resurrected all processes' 'restart_time' 8



$pm2 delete all
spec "Should delete all processes"

sleep 0.5
should 'should have deleted process' 'restart_time' 0

#
# Cron
#
$pm2 start cron.js -c "* * * asdasd"
ispec "Cron should throw error when pattern invalid"

$pm2 start cron.js -c "* * * * * *"
spec "Should cron restart echo.js"


$pm2 kill test
ispec "Should not kill with extra args"

$pm2 kill
spec "Should kill daemon"
