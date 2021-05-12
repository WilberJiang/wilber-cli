"use strict";

const path = require("path");
const cp = require("child_process");

const Package = require("@wilber-cli/package");
const log = require("@wilber-cli/log");

const SETTINGS = {
  init: "@wilber-cli/init",
};

const CATCH_DIR = "dependencies";

async function exec() {
  // 1. targetPath -> modulePath
  // 2. modulePath -> Package(npm模块)
  // 3. Package.getRootFile(获取入口文件)
  // 4. Package.update / Package.install'
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  let storeDir = "";
  let pkg;
  log.verbose("targetPath", targetPath);
  log.verbose("homePath", homePath);
  const cmdObj = arguments[arguments.length - 1];
  const cmdName = cmdObj.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = "latest";
  if (!targetPath) {
    //生成缓存路径
    targetPath = path.resolve(homePath, CATCH_DIR);
    storeDir = path.resolve(targetPath, "node_modules");
    log.verbose("targetPath:", targetPath);
    log.verbose("storeDir:", storeDir);
    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    });
    if (await pkg.exists()) {
      // 更新package
      await pkg.update();
    } else {
      // 安装package
      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }
  const rootFile = pkg.getRootFilePath();
  if (rootFile) {
    try {
      // 在当前进程中使用
      // require(rootFile).call(null,Array.from(arguments));
      // 在node子进程中调用
      const args = Array.from(arguments);
      const cmd = args[args.length - 1]; // 拿到command，且进行瘦身，对不需要的参数进行过滤
      const o = Object.create(null);
      Object.keys(cmd).forEach((key) => {
        if (
          cmd.hasOwnProperty(key) &&
          !key.startsWith("_") &&
          key !== "parent"
        ) {
          o[key] = cmd[key];
        }
      });
      args[args.length - 1] = o;
      const code = `require('${rootFile}').call(null,${JSON.stringify(args)})`;
      const child = spawn("node", ["-e", code], {
        cwd: process.cwd(),
        stdio: "inherit", // 加入这行代码，下面的就可以注释掉了
      });
      // child.stdout.on('data',(chunk =>{
      // }))
      // child.stderr.on('data',(chunk =>{
      // }))

      // 当然存在错误的情况，我们还是需要添加两个监听事件
      child.on("error", (e) => {
        log.error(e.message);
        process.exit(1);
      });
      child.on("exit", (e) => {
        log.verbose("命令执行成功" + e);
        process.exit(e);
      });
    } catch (e) {
      log.error(e.message);
    }
  }
}

function spawn(command, args, options) {
  const win32 = process.platform === "win32";
  const cmd = win32 ? "cmd" : command;
  const cmdArgs = win32 ? ["/c"].concat(command, args) : args;
  return cp.spawn(cmd, cmdArgs, options || {});
}

module.exports = exec;
