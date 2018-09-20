const Base = require('./base.js');
var exec = require('child_process').exec;
const fs = require('fs');
const join = require('path').join;

module.exports = class extends Base {
    async indexAction() {
        console.log('it is ok!！！');
    }

    /**
     * 执行 node production.js tools/print
     * 可以打印/Users/shirly/ddj/temp/printfile目录下的所有图片文件、pdf文件、docx文件
     */
    async printAction() {
        let dir = '/Users/shirly/ddj/temp/printfile';
        let files = this.findSync(dir);
        for (let i = 0; i < files.length; i++) {
            const element = files[i];
            await this.printFiles(element);
        }
    }

    async printFiles(fileName) {
        var cmdStr = "lp " + fileName;
        await exec(cmdStr, function (err, stdout, stderr) {
            if (err) {
                console.log('print error:' + stderr);
            } else {
                console.log('print ok!' + fileName);
            }
        });
    
    }

    findSync(startPath) {
        let result = [];
        let postfix = ['png', 'jpeg', 'pdf', 'jpg', 'docx'];

        function finder(path) {
            let files = fs.readdirSync(path);
            files.forEach((val, index) => {
                let fPath = join(path, val);
                let stats = fs.statSync(fPath);
                //if(stats.isDirectory()) finder(fPath);
                if (stats.isFile()) {
                    let arrval = val.split('.');
                    let valpost = arrval[arrval.length - 1];
                    if (postfix.indexOf(valpost) > -1) result.push(fPath);
                    // if (arrval[arrval.length - 1] == 'xlsx' || arrval[arrval.length - 1] == 'xls') result.push(fPath);
                }
            });

        }
        finder(startPath);
        return result;
    }

};