'use strict';


const log = require('npmlog')

log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info' // 判断debug模式
log.heading = 'wilber' // 修改前缀
// log.headingStyle = { fg: 'green', bg: 'red', bold: true}
log.addLevel('success', 2000, { fg: 'green', bold: false}) // 添加自定义命令

module.exports = log;