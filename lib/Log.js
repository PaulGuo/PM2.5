var fs     = require('fs'),
    util   = require('util'),
    chalk  = require('chalk'),
    CLI    = require('./CLI.js'),
    moment = require('moment');

var Log = module.exports = {};

/**
 * Tail logs from file stream.
 * @param {Object} apps_list
 * @param {Number} lines
 * @param {Boolean} raw
 * @param {Function} callback
 * @return
 */

Log.tail = function(apps_list, lines, raw, callback) {
  if (lines === 0 || apps_list.length === 0)
    return callback && callback();

  var count = 0;

  var getLastLines = function (filename, lines, callback) {
    var chunk = '';
    var size = fs.statSync(filename).size - (lines * 200);

    var fd = fs.createReadStream(filename, {start : size});
    fd.on('data', function(data) { chunk += data.toString(); });
    fd.on('end', function() {
      chunk = chunk.split('\n').slice(-(lines+1));
      chunk.pop();
      callback(chunk);
    });
  };

  apps_list.sort(function(a, b) {
    return (fs.existsSync(a.path) ? fs.statSync(a.path).mtime.valueOf() : 0) -
      (fs.existsSync(b.path) ? fs.statSync(b.path).mtime.valueOf() : 0);
  });

  apps_list.forEach(function(app, index) {
    if (fs.existsSync(app.path || '')) {
      getLastLines(app.path, lines, function(output) {
        output.forEach(function(out) {
          if (!raw) {
            if (app.type === 'out') process.stdout.write(chalk.bold['green'](app.app_name + ' (out): '));
            else if (app.type === 'err') process.stdout.write(chalk.bold['red'](app.app_name + ' (err): '));
            else process.stdout.write(chalk.bold['blue']('PM2:') + ' ');
          }
          console.log(out);
        });
        if (output.length)
          process.stdout.write('\n');
        ++count;
        if (count === apps_list.length)
          callback && callback();
      });
    }
    else {
      ++count;
      if (count === apps_list.length)
        callback && callback();
    }
  });
};

/**
 * Stream logs in realtime from the bus eventemitter.
 * @param {String} id
 * @param {Boolean} raw
 * @return
 */

Log.stream = function(id, raw, timestamp, exclusive) {

  if (!raw)
    console.log(chalk['inverse'](util.format.call(this, '[PM2] Streaming realtime logs for [%s] process%s', id, id === 'all' ? 'es' : '', '\n')));

  CLI.launchBus(function(err, bus) {

    bus.on('log:*', function(type, data) {
      if (id !== 'all'
          && data.process.name != id
          && data.process.pm_id != id)
        return;

      if ((type === 'out' && exclusive === 'err')
         || (type === 'err' && exclusive === 'out')
         || (type === 'PM2' && exclusive !== false))
        return;

      var name = data.process.name + '-' + data.process.pm_id;

      if (!raw) {
        if (timestamp) process.stdout.write(chalk['dim'](chalk['inverse'](chalk.bold['grey'](moment().format(timestamp) + ' '))));
        if (type === 'out') process.stdout.write(chalk['inverse'](chalk.bold['green'](name)) + ' ');
        else if (type === 'err') process.stdout.write(chalk['inverse'](chalk.bold['red'](name)) + ' ');
        else if (!raw && (id === 'all' || id === 'PM2')) process.stdout.write(chalk['inverse'](chalk.bold['blue']('PM2')) + ' ');
      }
      if (type === 'PM2' && raw)
        return;
      process.stdout.write(data.data ? util.format(data.data) : '');
    });

  });

};
