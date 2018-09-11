
const commitdate = '2018-07-28T10:35:22.000+08:00';

let begindate = new Date(commitdate);
let enddate = new Date();
let diffday = parseInt(Math.abs(enddate - begindate) / 1000 / 60 / 60 / 24);

console.log(begindate.getDate());
console.log(diffday);