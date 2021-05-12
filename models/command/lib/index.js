"use strict";

const semver = require("semver");
const colors = require("colors/safe");

const log = require("@wilber-cli/log");

const LOWEST_NODE_VERSION = "12.0.0";

class Command {
  constructor(argv) {
    if (!argv) {
      throw new Error("argv参数不能为空");
    }
    if (!Array.isArray(argv)) {
      throw new Error("argv参数必须为数组");
    }
    if (argv.length < 1) {
      throw new Error("参数列表为空");
    }
    this._argv = argv;
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => this.checkNodeVersion());
      chain = chain.then(() => this.initArgs());
      chain = chain.then(() => this.init());
      chain = chain.then(() => this.exec());
      chain.catch((e) => {
        log.error(e.message);
      });
    });
  }

  initArgs() {
    const len = this._argv.length - 1;
    this._cmd = this._argv[len]; //commander版本号为7.0.0需要加opts()
    this._argv = this._argv.slice(0, len);
  }

  checkNodeVersion() {
    //第一步，获取当前Node版本号
    const currentVersion = process.version;
    const lowestVersion = LOWEST_NODE_VERSION;
    //第二步，对比最低版本号
    if (!semver.gte(currentVersion, lowestVersion)) {
      throw new Error(
        colors.red(`wilber-cli 需要安装v${lowestVersion}以上版本的Node.js`)
      );
    }
  }

  init() {
    throw Error("init必须实现");
  }
  exec() {
    throw Error("exec必须实现");
  }
}

module.exports = Command;
