const fs = require('fs');
const xlsx = require('node-xlsx');

module.exports = class extends think.Controller {
  __before() {

  }

  //将excel表格的数据导出形成一个list，用第一行做属性名，从第二行开始做对应的值
  async importListFromExcel(filename) {
    let obj = xlsx.parse(filename);
    let plists = obj[0].data;
    let first = plists[0];
    let ret = [];
    for (let index = 1; index < plists.length; index++) {
      const element = plists[index];
      let obj = {};
      for (let j = 0; j < element.length; j++) {
        const ename = first[j];
        const evalue = element[j];        
        obj[ename] = evalue;
      }
      ret.push(obj);      
    }
    return ret;
  }

  async exportListToExcel(datalist, filename) {
    let ret = '';
    try {
      let dataarr = [];
      // console.log('###########');
      let itemhead = Object.keys(datalist[0]);
      // console.log(JSON.stringify(itemhead));
      
      dataarr.push(itemhead);
      datalist.forEach((x) => {
        let item = [];
        for (let it of itemhead) {
          item.push(x[it]);
        }
        dataarr.push(item);
      });
      // console.log(JSON.stringify(dataarr));
      var buffer = xlsx.build([{
        name: 'work',
        data: dataarr
      }]); // Returns a buffer
      fs.writeFileSync(filename, buffer, {
        'flag': 'w'
      });
      // console.log('###########');
    } catch (error) {
      
      ret = '导出失败';
      console.log(JSON.stringify(error),ret);
      return ret;
    }
    ret = filename + '导出成功';
    return ret;
  };
};
