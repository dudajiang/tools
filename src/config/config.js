const path = require('path');

// default config
module.exports = {
  workers: 1,
  sql:'select * from bi_report_amb_story',
  gitlab_url: 'https://119.18.198.5:8443/',
  zentao_url: 'http://182.18.57.5:9999/zentao/',
  gitlab_token: 'LiRz4_efq2uue4S_vDMk',
  UPLOAD_PATH: path.join(think.ROOT_PATH, 'output'),
};
