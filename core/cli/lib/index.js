'use strict';

const path = require('path')

const semver = require('semver')
const colors = require('colors/safe')
const userHome = require('user-home')
const pathExists = require('path-exists').sync
const dotEnv = require('dotenv')
const commander = require('commander')

const log = require('@wilber-cli/log')
const { getNpmSemverVersion } = require('@wilber-cli/get-npm-info')
const exec = require('@wilber-cli/exec')

const constant = require('./const')
const pkg = require('../package.json')

const program = new commander.Command()
async function core() {
    try {    
        await prepare()
        registerCommand()
    } catch (e) {
        log.error(e.message)
        if(program.opts().debug){
            console.log(e)
        }
    }
}

function registerCommand(){
    program
        .name(Object.keys(pkg.bin)[0])
        .usage('<command> [options]')
        .version(pkg.version)
        .option('-d, --debug', '是否开启调试模式', false)
        .option('-tp, --targetPath <targetPath>','是否指定本地调试文件路径','');

    program
        .command('init [projectName]')
        .option('-f,--force','是否强制更新项目')
        .action(exec)

    // 开启debug模式
    program.on('option:debug',function(){
        if(program.opts().debug){
            process.env.LOG_LEVEL='verbose'
        }else{
            process.env.LOG_LEVEL='info'
        }
        log.level = process.env.LOG_LEVEL
    })
    
    //指定targetPath
    program.on('option:targetPath',function(){
        process.env.CLI_TARGET_PATH = program.opts().targetPath 
    })

    // 对未知命令监听
    program.on('command:*',function(obj){
        const availableCommands = program.commands.map(cmd => cmd.name())
        console.log(colors.red('未知的命令：'+obj[0]))
        if(availableCommands.length > 0){
            console.log(colors.red('可用命令为：'+availableCommands.join(',')))
        }
    })

    
    program.parse(program.argv)

    if(program.args && program.args.length < 1) {
        program.outputHelp();
        console.log()
    }

}

async function prepare(){
    checkPkgVersion()
    checkRoot()
    checkUserHome()
    checkEnv()
    await checkGlobalUpdate()
}

async function checkGlobalUpdate() {
    // 1.获取当前版本号和模块名
    const currentVersion = pkg.version
    const npmName = pkg.name
    // 2.调用npm API获取所有的版本号和模块名
    const lastVersion = await getNpmSemverVersion(currentVersion, npmName)
    // 3.提取所有版本版本号，比对那些版本号是大于当前版本号的
    // 4.获取最新的版本号，提示用户更新到该版本号
    if(lastVersion && semver.gt(lastVersion,currentVersion)) log.warn(colors.yellow(`请手动更新${npmName} 当前版本：${currentVersion} 最新版本：${lastVersion}
更新命令:npm install -g ${npmName}`))
}

function checkEnv() {
    const dotEnvPath = path.resolve(userHome, '.env')// 获取本地.env文件内容
  
    if (pathExists(dotEnvPath)) {
        dotEnv.config({
            path: dotEnvPath
        })
    }
    createDefaultConfig() // 设置默认配置
  }
// 设置默认的环境变量
function createDefaultConfig() {
    const cliConfig = {
        home: userHome,
    }
    if(process.env.CLI_HOME) {
        cliConfig['cli_home'] = path.join(userHome, process.env.CLI_HOME)
    } else {
        cliConfig['cli_home'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
    }
    process.env['CLI_HOME_PATH'] = cliConfig['cli_home']
}

function checkUserHome() {
    if (!userHome || !pathExists(userHome)) {
        throw new Error(colors.red('当前登陆用户主目录不存在！'))
    }
}

function checkRoot() {
    //使用后，检查到root账户启动，会进行降级为用户账户process.getuid()
    const rootCheck = require('root-check');
    rootCheck();
}

function checkPkgVersion(){
    log.notice('cli', pkg.version)
}

module.exports = core;
