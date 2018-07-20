const Base = require('./base.js');

module.exports = class extends Base {
  async indexAction() {
    let sql = this.config('sql');
    console.log(sql);
    let model = think.model('bi_report_amb_story');
    let data = await model.limit(1).select();
    console.log(JSON.stringify(data));
    console.log('it is ok!');
  }

};
