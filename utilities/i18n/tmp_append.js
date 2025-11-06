const fs = require('fs');
const path = require('path');

const content = '\nSnapTranslator.dict.zh_CN = { ...SnapTranslator.dict.zh_CN,\n' +
  '    "Dynamic scheduling": "动态调度",\n' +
  '    "uncheck to schedule\\nthreads framewise": "取消勾选后以逐帧方式调度线程",\n' +
  '    "check to quickstep\\nthreads atomically": "勾选后以原子快速步进方式调度线程",\n' +
  '    "Performer mode scale...": "演示模式缩放...",\n' +
  '    "specify the scale of the stage\\npixels in performer mode": "设置演示模式下舞台像素缩放比例",\n' +
  '};\n';

const target = path.join(__dirname, '../../locale/lang-zh_CN.js');
fs.appendFileSync(target, content, { encoding: 'utf8' });
console.log('Appended translations to', target);