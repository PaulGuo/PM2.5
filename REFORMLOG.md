##### 静态配置信息调整

```
KEYMETRICS_ROOT_URL : 'root.pm25.io',
DEFAULT_MODULE_JSON : 'package.json',
REMOTE_PORT_TCP : 80,
REMOTE_PORT : 41624,
REMOTE_REVERSE_PORT : 43554,
REMOTE_HOST : 's1.pm25.io',
SEND_INTERVAL : 1000
```

##### 基础握手信息服务

```
端口：443 -> 4438
```

##### 安装包元信息调整

```
包名称、版本号
```

##### 改动文件列表

- `constants.js`
- `lib/Interactor/Daemon.js`
- `package.json`
