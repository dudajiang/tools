const Base = require('./base.js');
const request = require('request');
const format = require('string-format');
const jsonfile = require('jsonfile');

module.exports = class extends Base {

  indexAction() {
    return this.display();
  }

  async testAction() {
    // let sql = this.config('sql');
    // console.log(sql);
    // const story = think.model('bi_report_amb_story');
    // console.log(story);
    // let data = await story.select();
    // console.log(JSON.stringify(data));

    // let file = this.config('UPLOAD_PATH') + '/starprojects.json';
    // let aa = jsonfile.readFileSync(file);
    // for (let i = 0; i < aa.length; i++) {
    //   const element = aa[i];
    //   console.log(element.web_url);
    // }
    // let cts = JSON.parse(jsonfile.readFileSync(file));
    // console.log(cts.length);

    let fileexcel = this.config('UPLOAD_PATH') + '/groupupdate.xlsx';
    let arr = await this.importListFromExcel(fileexcel);
    let file = this.config('UPLOAD_PATH') + '/groupproduct.json';
    jsonfile.writeFileSync(file, arr);
    console.log(arr);
  }

  /**
   * 从gitlab中获取最新的我标星的项目
   * 一般来说当我有新标的项目的时候，就需要执行此命令
   * 第1步：更新标星json文件：starprojects.json
   */
  async saveStarsAction() {
    let giturls = 'https://119.18.198.5:8443/api/v4/projects?starred=true';
    let data = await this.getBranchs(giturls);
    console.log(data.length);
    // console.log(data);
    let file = this.config('UPLOAD_PATH') + '/starprojects.json';
    jsonfile.writeFileSync(file, data)
    console.log('完成第1步[saveStars]：更新标星json文件：starprojects.json,请执行第2步[saveDoit]');
  }

  /**
   * 从gitlab中获取最新的我标星的项目
   * 一般来说当我有新标的项目的时候，就需要执行此命令
   * 第2步：更新doit文件：doitpackages
   */
  async saveDoitAction() {
    let giturls = 'http://119.18.198.4:6888/gitlab/packages';
    console.log(giturls);
    let data = await this.getDataByUrl(giturls);
    let cts = data.data.packages;
    // console.log(cts[0]);
    let filedoit = this.config('UPLOAD_PATH') + '/doitpackages.json';
    jsonfile.writeFileSync(filedoit, cts);
    console.log('完成第2步[saveDoit]：更新doit文件：doitpackages.json,请执行第3-1步[checkGroups]');
  }

  /**
   * 一旦发现从api中获得的group和groupsproduct.json中的有不同，则提示出不同点，并将不同点导出成group.xlsx
    手工对groupupdate.xlsxj进行修改，并另外执行命令updateGroupsAction，生成新的groupsproduct.json使用
    第3-1步：检查group是否有变化，如果有则执行3-2，如果没有变化，跳过
   */
  async checkGroupsAction() {
    let filegroup = this.config('UPLOAD_PATH') + '/groupproduct.json';
    let groups = jsonfile.readFileSync(filegroup);
    let giturls = 'https://119.18.198.5:8443/api/v4/groups';
    let data = await this.getBranchs(giturls);
    console.log(data.length);
    let nomatch = [];
    data.forEach(x => {
      let find = groups.filter(y => {
        return x.full_path == y.full_path;
      });
      if (find && find.length > 0) {

      } else {
        console.log('group有变更：', x.full_path);
        nomatch.push(x);
      }
    });
    if (nomatch.length > 0) {
      let fileexcel = this.config('UPLOAD_PATH') + '/group.xlsx';
      let arr = await this.exportListToExcel(nomatch, fileexcel);
      console.log('group有变更，已经生成group.xlsx，请修改groupupdate.xlsx,并执行updateGroupsAction');
    } else {
      console.log('group无变更，OK！');
    }
    console.log('完成第3-1步[checkGroups]，如果group无变更，请执行第4步[checkStars]，否则请修改好groupupdate.xlsx后执行3-2步[updateGroups]');
  }

  /**
 * 执行checkGroups后，如果group有变化，就需要修改groupupdate.xlsx
 * 第3-2步：线下修改好groupupdate.xlsx后，执行本命令修改groupproduct.json
 */
  async updateGroupsAction() {
    let fileexcel = this.config('UPLOAD_PATH') + '/groupupdate.xlsx';
    let arr = await this.importListFromExcel(fileexcel);
    let file = this.config('UPLOAD_PATH') + '/groupproduct.json';
    jsonfile.writeFileSync(file, arr);
    console.log(arr);
    console.log('完成第3-2步[supdateGroups]：请执行第4步[checkStars]');
  }

  /**
   * doitpackages中有项目归属的产品和省份，groupproduct中有项目归属的产品，projects中有各个项目的产品，省份和statuslevel
   * 1、如果doitpackages有产品和省份且不为空，且和projects中不一样，则提示出来，并修改projects.json中的对应数据
   * 2、如果groupproduct中有项目归属的产品，且和projects中不一样，则提示出来，并修改projects.json中的对应产品名称
   * 3、
   * 2、如果starprojects.json中有项目在projects.json中找不到，就需要提示出来，并手工修改projects.json（）
   * 也可以生成projects.xlsx并执行4-2重新导入
   * 第4-1步：
   */
  async checkStarsAction() {
    let file = this.config('UPLOAD_PATH') + '/starprojects.json';
    let starprojects = jsonfile.readFileSync(file);
    let filedoit = this.config('UPLOAD_PATH') + '/doitpackages.json';
    let doitpackages = jsonfile.readFileSync(filedoit);
    let filegroup = this.config('UPLOAD_PATH') + '/groupproduct.json';
    let groups = jsonfile.readFileSync(filegroup);
    let fileprojects = this.config('UPLOAD_PATH') + '/projects.json';
    let projects = jsonfile.readFileSync(fileprojects);

    let newprojects = [];
    for (let i = 0; i < starprojects.length; i++) {
      const starele = starprojects[i];
      let finddoit = doitpackages.filter(x => {
        return x.path_with_namespace == starele.path_with_namespace;
      });
      let findgroup = groups.filter(x => {
        return x.full_path == starele.namespace.full_path;
      });
      let findproject = projects.filter(x => {
        return x.namespace == starele.path_with_namespace;
      });
      let doitbool = false;
      let findp = {
        product: '',
        province: '',
        description: '',
        doitflag: ''
      };
      if (finddoit && finddoit.length == 1) {
        findp.product = finddoit[0].default_product;
        findp.description = finddoit[0].description;
        if (finddoit[0].pps) {
          finddoit[0].pps.forEach(pelement => {
            findp.province += pelement.project + ' ';
          });
        };
        findp.doitflag = 'doit';
      } else if (findgroup && findgroup.length == 1) {
        findp.product = findgroup[0].default_product;
        findp.doitflag = 'group';
      }

      if (findproject && findproject.length == 1) {
        //说明在projects.json中有该项目，就需要判断是否需要更新
        if (findp.province != findproject[0].province) {
          if (findp.doitflag == 'doit') {
            if (findp.province == '') {
              console.log('doit中和projects不一致：doit中省份为空，', starele.path_with_namespace, findproject[0].province);
            } else {
              console.log('doit中和projects不一致：doit中省份有值，', starele.path_with_namespace, findp.province, findproject[0].province);
              findproject[0].province = findp.province;
            }
          } else if (findp.doitflag == 'group') {
            // console.log('doit没有，group中有，以projects为准，不用修改',starele.path_with_namespace);
          } else {
            // console.log('doit中和group中都没有值（这好像不太可能吧），以projects为准，不用修改',starele.path_with_namespace);
          }
        } else {
          if (findp.doitflag == 'doit' && findp.description) {
            findproject[0].description = findp.description;
          }
        }
        newprojects.push(findproject[0]);
      } else {
        //说明在projects.json中没有该项目，就需要进行新增
        let newp = {
          "namespace": starele.path_with_namespace,
          "giturl": starele.web_url,
          "product": findp.product,
          "description": starele.description,
          "province": findp.province,
          "status": '',
          "level": 100
        };
        console.log('有新出现的starprojects', starele.path_with_namespace);
        newprojects.push(newp);
      }
    }

    console.log('新生成的projects长度', newprojects.length);
    console.log('原有的projects长度', projects.length);

    // let newfileprojects = this.config('UPLOAD_PATH') + '/projects.json';
    jsonfile.writeFileSync(fileprojects, newprojects);
    // let fileexcel = this.config('UPLOAD_PATH') + '/projects.xlsx';
    // let arr = await this.exportListToExcel(newprojects, fileexcel);

    console.log('完成第4-1步[checkStars]：请手工调整json，或者修改excel后执行4-2[supdateStars]');
  }

  /**
   * 将线下修改好的projects.xlsx生成project.json
   * 第4-2步：
   */
  async updateStarsAction() {
    let fileexcel = this.config('UPLOAD_PATH') + '/projects.xlsx';
    let arr = await this.importListFromExcel(fileexcel);
    let file = this.config('UPLOAD_PATH') + '/projects.json';
    jsonfile.writeFileSync(file, arr);
    console.log(arr);
    console.log('完成第4-2步[supdateStars]：projects.json已经更新，再执行4-1[checkStars]');
  }





  /**
   * 根据starprojects.json查询每个项目中各个分支的状况
   */
  async checkGitlabFromStarAction() {

    let giturls2 = 'https://119.18.198.5:8443/api/v4/projects/{}/repository/branches';

    let file = this.config('UPLOAD_PATH') + '/starprojects.json';
    let cts = jsonfile.readFileSync(file);
    let fileprojects = this.config('UPLOAD_PATH') + '/projects.json';
    let projects = jsonfile.readFileSync(fileprojects);

    let brancheinfolist = [];

    //cts中是所有我关注的项目
    for (let index = 0; index < cts.length; index++) {
      const element = cts[index];

      //findpackage中是看projects中是否有这个项目的配置
      let findpackage = projects.filter(x => {
        return x.namespace == element.path_with_namespace;
      });

      // console.log(element);

      let findp = {
        product: '',
        province: '',
        description: '',
        doitflag: '',
        status: '',
        level: 1000
      };

      if (findpackage.length > 0) {
        findp.product = findpackage[0].product;
        findp.province = findpackage[0].province;
        findp.description = findpackage[0].description;
        findp.status = findpackage[0].status;
        findp.level = findpackage[0].level;
        // console.log('本项目通过doit找到产品名称:', element.web_url)
        if (findp.level == 100) {
          continue;
        }
      } else {
        console.log('本项目找不到对应的产品名称：', element.web_url);
        continue;
      }



      let brancheinfo = {
        namespace: element.path_with_namespace,
        giturl: element.web_url,
        product: findp.product,
        description: findp.description,
        province: findp.province,
        developcommitdate: null,
        mastercommitdate: null,
        releaseall: 0,
        releasenomerge: 0,
        releasechangedate: null,
        hotfixall: 0,
        hotfixnomerge: 0,
        hotfixchangedate: null,
        featureall: 0,
        featurelong: 0,
        featurechangedate: null,
        errorall: 0,
        status: findp.status,
        level: findp.level,
        errorstatus: '',
        doitflag: findp.doitflag
      };



      // if (brancheinfo.namespace == 'irms.sf/web.sf.common') {
      console.log(element.id);
      let burl = format(giturls2, element.id);
      // console.log(burl);
      let branchsdata = await this.getBranchs(burl);

      let releasediffday = 2000;
      let featurediffday = 2000;
      let hotfixdiffday = 2000;
      let developdiffday = 2000;
      let masterdiffday = 2000;

      for (let bindex = 0; bindex < branchsdata.length; bindex++) {
        let x = branchsdata[bindex];
        let name = x.name.toLowerCase();
        let diffday = this.getDiffday(x.commit.committed_date);
        // console.log(name);
        if (name.search(/release/i) == 0) {
          // console.log('release');
          brancheinfo.releaseall++;
          if (!x.merged) {
            brancheinfo.releasenomerge++;
          }
          if (diffday < releasediffday) {
            releasediffday = diffday;
            brancheinfo.releasechangedate = x.commit.committed_date;
          }
        } else if (name.search(/feature/i) == 0) {
          // console.log('feature');
          brancheinfo.featureall++;
          if (diffday > 30) {
            brancheinfo.featurelong++;
          }
          if (diffday < featurediffday) {
            featurediffday = diffday;
            brancheinfo.featurechangedate = x.commit.committed_date;
          }
        } else if (name.search(/master/i) == 0) {
          // console.log('master');
          brancheinfo.mastercommitdate = x.commit.committed_date;
          if (diffday < masterdiffday) {
            masterdiffday = diffday;
          }
        } else if (name.search(/develop/i) == 0) {
          // console.log('develop');
          brancheinfo.developcommitdate = x.commit.committed_date
          if (diffday < developdiffday) {
            developdiffday = diffday;
          }
        } else if (name.search(/hotfix/i) == 0) {
          // console.log('hotfix');
          brancheinfo.hotfixall++;
          if (!x.merged) {
            brancheinfo.hotfixnomerge++;
          }
          if (diffday < hotfixdiffday) {
            hotfixdiffday = diffday;
            brancheinfo.hotfixchangedate = x.commit.committed_date;
          }
        } else {
          brancheinfo.errorall++;
        }
      }

      //对该项目进行分析
      let diffdevandmas = Math.abs(developdiffday - masterdiffday);
      let diffrelandmas = Math.abs(releasediffday - masterdiffday);
      let difffeaanddev = Math.abs(developdiffday - featurediffday);

      if (developdiffday == 2000 || masterdiffday == 2000) {
        if (brancheinfo.namespace.search(/rmsconf./) == -1 && brancheinfo.namespace.search(/webrms./) == -1) {
          brancheinfo.errorstatus += '有主干分支未建|';
        }
      }
      switch (findp.level) {
        case 100:
          //稳定版本可以不检查          
          break;
        case 3:
          if (diffdevandmas > 15 && brancheinfo.namespace.search(/webrms./) == -1) {
            brancheinfo.errorstatus += 'develop和master分支未及时同步|';
          };
          if (brancheinfo.releasenomerge > 4 || brancheinfo.featurelong > 0) {
            brancheinfo.errorstatus += '有超长分支未删除或者未合并';
          }
          break;
        case 2:
          if (diffdevandmas > 15) {
            brancheinfo.errorstatus += 'develop和master分支未及时同步|';
          };
          if (brancheinfo.releasenomerge > 4 || brancheinfo.featurelong > 0) {
            brancheinfo.errorstatus += '有分支未及时回归主干|';
          }
          break;
        case 1:
          //
          if (brancheinfo.releaseall == 0 && brancheinfo.featureall == 0 && brancheinfo.hotfixall == 0) {
            if (diffdevandmas > 15) {
              brancheinfo.errorstatus += 'develop和master分支未及时同步|';
            };
          } else {
            // if (brancheinfo.namespace == 'irms.rms/web/webrms.heilongjiang') {
            //   console.log(brancheinfo);
            //   console.log(brancheinfo);
            // }
            if (brancheinfo.releaseall > 0 && diffrelandmas > 15) {
              brancheinfo.errorstatus += 'release分支可能未及时双回|';
            }
            if (brancheinfo.featureall > 0 && difffeaanddev > 15) {
              brancheinfo.errorstatus += 'feature分支未及时回归dev|';
            }
            if (brancheinfo.featurelong > 0) {
              brancheinfo.errorstatus += '有超长feature分支未处理|';
            }
          }
          break;
        default:
          //最活跃的版本，需要重点检查
          if (brancheinfo.releaseall == 0 && brancheinfo.featureall == 0 && brancheinfo.hotfixall == 0) {
            brancheinfo.errorstatus += '活跃项目没有活跃分支|';
            if (diffdevandmas > 15) {
              brancheinfo.errorstatus += 'develop和master分支未及时同步|';
            };
          } else {
            if (brancheinfo.releaseall > 0 && diffrelandmas > 15) {
              brancheinfo.errorstatus += 'release分支未及时双回|';
            }
            if (brancheinfo.featureall > 0 && difffeaanddev > 15 && brancheinfo.namespace.search(/rmsconf./) == -1) {
              brancheinfo.errorstatus += 'feature分支未及时回归dev|';
            }
            if (brancheinfo.featurelong > 2) {
              brancheinfo.errorstatus += '有超过2个超长feature分支未处理|';
            }
            let activehotfixflag = false;
            if (brancheinfo.hotfixall > 0 && hotfixdiffday < 14) {
              activehotfixflag = true
            }
            let activereleaseflag = false;
            if (brancheinfo.releaseall > 0 && releasediffday < 14) {
              activereleaseflag = true
            }
            let activefeatureflag = false;
            if (brancheinfo.featureall > 0 && featurediffday < 14) {
              activefeatureflag = true
            }
            if (activehotfixflag || activereleaseflag || activefeatureflag) {

            } else {
              brancheinfo.errorstatus += '活跃项目有2周未提交代码';
            }
          }
          break;
      }




      brancheinfolist.push(brancheinfo);
    }

    let fileexcel = this.config('UPLOAD_PATH') + '/gitlab分支检查详细情况new.xlsx';
    let arr = await this.exportListToExcel(brancheinfolist, fileexcel);
    console.log(arr);
    // console.log(JSON.stringify(brancheinfo));
  }

  async checkGitlabFromdoitAction() {
    let giturls = 'http://119.18.198.4:6888/gitlab/packages';
    let giturls2 = 'https://119.18.198.5:8443/api/v4/projects/{}/repository/branches';
    console.log(giturls);
    let data = await this.getDataByUrl(giturls);
    let cts = data.data.packages;
    // console.log(cts[0]);
    let filedoit = this.config('UPLOAD_PATH') + '/doitpackages.json';
    jsonfile.writeFileSync(filedoit, cts)

    let brancheinfolist = [];

    for (let index = 0; index < cts.length; index++) {
      const element = cts[index];
      let brancheinfo = {
        namespace: element.path_with_namespace,
        giturl: element.git_web_url,
        product: element.default_product,
        description: element.description,
        province: '',
        developcommitdate: null,
        mastercommitdate: null,
        releaseall: 0,
        releasenomerge: 0,
        hotfixnomerge: 0,
        featureall: 0,
        featurelong: 0,
        errorall: 0
      };
      if (element.pps) {
        element.pps.forEach(pelement => {
          brancheinfo.province += pelement.project + ' ';
        })
      };


      // if (brancheinfo.namespace == 'irms.sf/web.sf.common') {
      console.log(element.git_id);
      let burl = format(giturls2, element.git_id);
      console.log(burl);
      let branchsdata = await this.getBranchs(burl);

      branchsdata.forEach(x => {
        let name = x.name.toLowerCase();
        console.log(name);
        if (name.search(/release/i) == 0) {
          console.log('release');
          brancheinfo.releaseall++;
          if (!x.merged) {
            brancheinfo.releasenomerge++;
          }
        } else if (name.search(/feature/i) == 0) {
          console.log('feature');
          brancheinfo.featureall++;
          let diffday = this.getDiffday(x.commit.committed_date);
          if (diffday > 60) {
            brancheinfo.featurelong++;
          }
        } else if (name.search(/master/i) == 0) {
          console.log('master');
          brancheinfo.mastercommitdate = x.commit.committed_date
        } else if (name.search(/develop/i) == 0) {
          console.log('develop');
          brancheinfo.developcommitdate = x.commit.committed_date
        } else if (name.search(/hotfix/i) == 0) {
          console.log('hotfix');
          if (!x.merged) {
            brancheinfo.hotfixnomerge++;
          }
        } else {
          brancheinfo.errorall++;
        }
      });
      // }
      brancheinfolist.push(brancheinfo);
    }

    let fileexcel = this.config('UPLOAD_PATH') + '/gitlab分支检查详细情况.xlsx';
    let arr = await this.exportListToExcel(brancheinfolist, fileexcel);
    console.log(arr);
    // console.log(JSON.stringify(brancheinfo));
  }


  async getDataByUrl(url) {
    return new Promise(function (resolve, reject) {
      request({
        url: url,
        method: "GET",
        json: true,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({})
      }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          resolve(body);
        }
      });
    });
  }

  async getBranchsByUrl(url) {
    return new Promise(function (resolve, reject) {
      request({
        url: url,
        agentOptions: {
          rejectUnauthorized: false
        },
        headers: {
          'content-type': "application/json",
          'PRIVATE-TOKEN': 'Z5QcGwEqiPThAxrBTak1'
        },
        body: JSON.stringify({})
      }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          let ret = {};
          let nexturl = '';
          if (response.headers['x-next-page']) {
            let link = response.headers.link;
            let nexturls = link.split(',').filter((x) => {
              return x.substr(-6) == '"next"';
            });
            if (nexturls) {
              let begin = nexturls[0].indexOf('<');
              let end = nexturls[0].indexOf('>');
              nexturl = nexturls[0].substring(begin + 1, end);
            }
            // console.log(nexturl);
          }
          ret.data = JSON.parse(body);
          ret.nexturl = nexturl;
          resolve(ret);
          // console.log(response.headers);     
        }
      });
    });
  };

  async getBranchs(url) {
    const fragment = await this.getBranchsByUrl(url);
    if (fragment.nexturl) {
      return fragment.data.concat(await this.getBranchs(fragment.nexturl));
    } else {
      return fragment.data;
    }
  };

  getDiffday(commitdate) {
    let diffday = null;
    if (commitdate) {
      let begindate = new Date(commitdate);
      let enddate = new Date();
      diffday = parseInt(Math.abs(enddate - begindate) / 1000 / 60 / 60 / 24);
    }
    return diffday
  }

};
