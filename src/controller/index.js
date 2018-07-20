const Base = require('./base.js');

module.exports = class extends Base {
  indexAction() {
    return this.display();
  }

  async testAction() {
    let sql = this.config('sql');
    console.log(sql);
    const story = think.model('bi_report_amb_story');
    console.log(story);
    let data = await story.select();
    console.log(JSON.stringify(data));
  }
};
