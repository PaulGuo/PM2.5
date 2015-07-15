#!/usr/bin/env bash

SRC=$(cd $(dirname "$0"); pwd)
source "${SRC}/bash/include.sh"

# Abort script at first error
set -e
# Display all commands executed
set -o verbose

echo "####################### DEBUG ############################"
echo "PM2 Command = " $pm2
echo "Node version = " $nodeVersion
$node -e "var os = require('os'); console.log('arch : %s\nplatform : %s\nrelease : %s\ntype : %s\nmem : %d', os.arch(), os.platform(), os.release(), os.type(), os.totalmem())"
echo "###################### !DEBUG! ###########################"

# if [ $TRAVIS ]
# then
#   export DEBUG="*"
# fi

bash ./test/bash/pmx_injection.sh
spec "automatic pmx injection"
bash ./test/bash/log-timestamp.sh
spec "timetstamp prefix of pm2.log"
bash ./test/bash/smart-start.sh
spec "smart start test"
bash ./test/bash/cli.sh
spec "CLI basic test"
bash ./test/bash/json_file.sh
spec "JSON file test"
bash ./test/bash/watch.sh
spec "Watch feature"
bash ./test/bash/harmony.sh
spec "Harmony test"
bash ./test/bash/es6.sh
spec "Next gen JS with Babel"
bash ./test/bash/log-custom.sh
spec "Custom log timestamp"
bash ./test/bash/reload.sh
spec "Reload"
bash ./test/bash/right-exit-code.sh
spec "Verification exit code"
bash ./test/bash/log-reload.sh
spec "Log reload"
bash ./test/bash/gracefulReload.sh
spec "gracefulReload system 1"
bash ./test/bash/gracefulReload2.sh
spec "gracefulReload system 2"
bash ./test/bash/gracefulReload3.sh
spec "gracefulReload system 3"
bash ./test/bash/cli2.sh
spec "Second hard cli tests"
bash ./test/bash/misc.sh
spec "MISC features"
bash ./test/bash/fork.sh
spec "Fork system working"
bash ./test/bash/get_set.sh
spec "Configuration system working"
bash ./test/bash/infinite_loop.sh
spec "Infinite loop stop"
bash ./test/bash/env-refresh.sh
spec "Environment refresh on restart"
bash ./test/bash/reset.sh
spec "Reset meta"
bash ./test/bash/startOrX.sh
spec "startOrX commands"
bash ./test/bash/binary.sh
spec "binary test"
bash ./test/bash/log-entire.sh
spec "merge stdout && stderr"
bash ./test/bash/module.sh
spec "module system"
bash ./test/bash/vizion.sh
spec "vizion features (versioning control)"
bash ./test/bash/wrapped_fork.sh
spec "wrapped fork"

bash ./test/bash/inside-pm2.sh
spec "Starting a process inside a PM2 process"

$pm2 kill
