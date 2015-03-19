
var Modularizer = module.exports = {};

var shelljs = require('shelljs');
var path    = require('path');
var fs      = require('fs');
var async   = require('async');
var p       = path;

var Configuration = require('./Configuration.js');
var cst           = require('../constants.js');
var CLI           = require('./CLI.js');
var Common        = require('./Common');
var UX            = require('./CliUx.js');

// [X] 1# verify that there is a process.json or process.json5 else not a pm2 module
// [X] 2# Keep separated list for modules when doing pm2 list
// [X] Avoid dumping module processes
// [X] Stats process.json process.json5 package.json ecosystem.json
// [X] 4# pm2 uninstall <probe> = delete folder and stop process
// [X] Name of app must be the same than the module name
// [X] At PM2 initialization start all .pm2/node_modules
// [X] Block all tentatives to stop a module
// [X] NO NEED pm2 generate module   = Provide a module skeleton
// [X] pm2 update=install <module> = not deleting the conf file
// pm2 publish module (increment version, git push, npm publish)
// [X] API normalization = dont block adoption, find common way to transform current software into propack

function startModule(opts, cb) {
  var module_conf = Configuration.getAllSync() || {};

  /** SCRIPT
   * Open file and make the script detection smart
   */

  if (!opts.cmd) throw new Error('module package.json not defined');
  if (!opts.development_mode) opts.development_mode = false;

  var package_json = require(opts.cmd);

  if (!package_json.apps) {
    package_json.apps = {};

    if (package_json.bin) {
      var bin = Object.keys(package_json.bin)[0];

      package_json.apps.script = package_json.bin[bin];
    }
    else if (package_json.main) {
      package_json.apps.script = package_json.main;
    }
  }

  /**
   * Verify that the module is valid
   * If not, delete
   */
  if (isValidModule(package_json) === false) {
    if (!opts.development_mode) shelljs.rm('-rf', opts.proc_path);
    Common.printError(cst.PREFIX_MSG_MOD + 'Module uninstalled');
    return cb({msg:'Invalid module'});
  }

  /**
   * Only merge configuration variables for this module
   */
  var additional_env = {};

  if (!module_conf[package_json.name]) {
    additional_env = {};
    additional_env[package_json.name] = {};
  }
  else {
    additional_env = Common.serialize(module_conf[package_json.name]);
    additional_env[package_json.name] = JSON.stringify(module_conf[package_json.name]);
  }

  // Start the module
  CLI.startJson(package_json, {
    cwd               : opts.proc_path,
    watch             : opts.development_mode,
    force_name        : opts.development_mode ? '.' : package_json.name,
    started_as_module : true,
    additional_env    : additional_env
  }, function(err, data) {
    if (err) return cb(err);
    return cb(null, data);
  });
}

Modularizer.launchAll = function(cb) {
  var module_folder = p.join(cst.PM2_ROOT_PATH, 'node_modules');

  shelljs.config.silent = true;
  var modules = shelljs.ls(module_folder);
  shelljs.config.silent = false;

  var module_conf = Configuration.getAllSync() || {};

  async.eachLimit(modules, 1, function(module, next) {
    var pmod = p.join(module_folder, module, cst.DEFAULT_MODULE_JSON);

    Common.printOut(cst.PREFIX_MSG_MOD + 'Starting module ' + module);

    startModule({
      cmd : pmod,
      development_mode : false,
      proc_path : p.join(module_folder, module)
    }, function(err, dt) {
      return next();
    });

  }, function() {
    return cb ? cb() : false;
  });
};

Modularizer.install = function(module_name, cb) {
  Common.printOut(cst.PREFIX_MSG_MOD + 'Installing module ' + module_name);

  var proc_path = '',
      cmd  = '',
      conf = {},
      development_mode = false;

  /**
   * Check if module exists
   */
  if (moduleExist(module_name) === true) {
    Common.printError(cst.PREFIX_MSG_MOD_ERR + 'Module already installed. Installation canceled.');
    return cb({msg:'Module already installed'});

  }

  if (module_name == '.') {
    /**
     * Development mode
     */
    Common.printOut(cst.PREFIX_MSG_MOD + 'Installing local module in DEVELOPMENT MODE with WATCH auto restart');
    development_mode = true;
    proc_path = process.cwd();

    cmd = p.join(proc_path, cst.DEFAULT_MODULE_JSON);

    startModule({
      cmd : cmd,
      development_mode : development_mode,
      proc_path : proc_path
    }, function(err, dt) {
      if (err) return cb(err);
      Common.printOut(cst.PREFIX_MSG_MOD + 'Module succesfully installed and launched');
      Common.printOut(cst.PREFIX_MSG_MOD + ': To configure module use');
      Common.printOut(cst.PREFIX_MSG_MOD + ': $ pm2 set <key> <value>');
      Common.printOut(cst.PREFIX_MSG_MOD + ': $ pm2 restart module-name');
      return cb(null, cmd);
    });
  }
  else {
    Common.printOut(cst.PREFIX_MSG_MOD + 'Processing...');

    /**
     * Install npm module via NPM INSTALL
     */
    var inter = setInterval(function() {
      process.stdout.write('.');
    }, 500);

    shelljs.exec('npm install ' + module_name + ' --prefix ' + cst.PM2_ROOT_PATH, function(code) {
      clearInterval(inter);

      if (code != 0) {
        Common.printError(cst.PREFIX_MSG_MOD_ERR + 'Unknown module');
        return cb({msg:'Unknown module'});
      }

      Common.printOut(cst.PREFIX_MSG_MOD + 'Module downloaded');
      proc_path = p.join(cst.PM2_ROOT_PATH, 'node_modules', module_name);


      cmd = p.join(proc_path, cst.DEFAULT_MODULE_JSON);

      startModule({
        cmd : cmd,
        development_mode : development_mode,
        proc_path : proc_path
      }, function(err, dt) {
        if (err) return cb(err);
        Common.printOut(cst.PREFIX_MSG_MOD + 'Module succesfully installed and launched');
        Common.printOut(cst.PREFIX_MSG_MOD + ': To configure module use');
        Common.printOut(cst.PREFIX_MSG_MOD + ': $ pm2 set <key> <value>');
        Common.printOut(cst.PREFIX_MSG_MOD + ': $ pm2 restart module-name');
        return cb(null, cmd);
      });
    });


  }

};

/**
 * Uninstall module
 */
Modularizer.uninstall = function(module_name, cb) {
  Common.printOut(cst.PREFIX_MSG_MOD + 'Uninstalling module ' + module_name);
  var proc_path = p.join(cst.PM2_ROOT_PATH, 'node_modules', module_name);

  if (moduleExist(module_name) === false && module_name != '.') {
    Common.printError(cst.PREFIX_MSG_MOD_ERR + 'Module unknown.');
    return cb({msg:'Module unknown'});
  }

  CLI.deleteModule(module_name, function(err, data) {
    if (err) {
      Common.printError(err);

      if (module_name != '.') {
        console.log(proc_path);
        shelljs.rm('-rf', proc_path);
      }

      return cb(err);
    }

    if (module_name != '.') {
      shelljs.rm('-rf', proc_path);
    }

    return cb();
  });
};

/**
 * Publish a module
 */
Modularizer.publish = function(cb) {
  var readline = require('readline');

  console.error('Not available');

  return cb();

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question("Publish? [Y/N]", function(answer) {
    if (answer != "Y")
      return cb();

    var package_json = fs.readFileSync(p.join(process.cwd(), 'package.json'));

    var child = shelljs.exec('npm install ' + module_name + ' --prefix ' + cst.PM2_ROOT_PATH);

  });
};


function isValidModule(conf) {
  var valid = true;

  if (!conf.apps) {
    Common.printError(cst.PREFIX_MSG_MOD_ERR + 'apps attribute indicating the script to launch is not defined in the package.json');
    return false;
  }

  if (Array.isArray(conf.apps)) {
    conf.apps.forEach(function(app) {
      if (!app.script)
        valid = false;
    });
  }
  else {
    if (!conf.apps.script)
      valid = false;
  }

  return valid;
};

function moduleExist(module_name) {
  var modules = getModuleInstalled();
  return modules.indexOf(module_name) > -1 ? true : false;
};

function getModuleInstalled() {
  shelljs.config.silent = true;
  var module_folder = p.join(cst.PM2_ROOT_PATH, 'node_modules');
  var modules       = shelljs.ls('-A', module_folder);
  shelljs.config.silent = false;
  return modules;
}
