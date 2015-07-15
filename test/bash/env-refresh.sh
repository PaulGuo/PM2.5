#!/usr/bin/env bash

SRC=$(cd $(dirname "$0"); pwd)
source "${SRC}/include.sh"
cd $file_path

echo -e "\033[1mENV REFRESH\033[0m"

#
# Restart via CLI
#
TEST_VARIABLE='hello1' $pm2 start env.js -o out-env.log --merge-logs --name "env"
>out-env.log

sleep 0.5
grep "hello1" out-env.log &> /dev/null
spec "should contain env variable"

TEST_VARIABLE='89hello89' $pm2 restart env

sleep 1.0
grep "89hello89" out-env.log &> /dev/null
spec "should contain refreshed environment variable"

$pm2 delete all

# HEYYYY

#
# Restart via JSON
#

$pm2 start env.json
>out-env.log

sleep 0.5
grep "YES" out-env.log &> /dev/null
spec "should contain env variable"


$pm2 restart env-refreshed.json
>out-env.log

sleep 0.5
grep '{"HEYYYY":true}' out-env.log &> /dev/null
spec "should contain refreshed env variable via json"


$pm2 start env-ecosystem.json --env production
>out-env.log

sleep 0.5
grep "No worries!" out-env.log &> /dev/null
spec "should use deploy.production.env.TEST_VARIABLE"


$pm2 kill
$pm2 l
NODE_PATH='/test' $pm2 start local_require.js
should 'should have loaded the right globalPaths' 'restart_time: 0' 1

$pm2 kill
$pm2 l
NODE_PATH='/test2' $pm2 start local_require.js -i 1
should 'should have loaded the right globalPaths' 'restart_time: 0' 1
