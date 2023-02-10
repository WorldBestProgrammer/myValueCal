const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser');
const FileStore = require('session-file-store')(session)

var authRouter = require('./lib_login/auth');
var authCheck = require('./lib_login/authCheck.js');
var template = require('./lib_login/template.js');
var fs = require('fs');
const db = require('./lib_login/db');
var prevtotal;
var newtotal;
var nickname;
var pay;

const app = express()
const port = 3000

function calTot(tot, time, recent) {			
  var now = new Date().getTime();
  let gap = parseInt((now - recent) / (24 * 3600 * 1000)) - 1;
  // 오늘 연달아서 입력한 경우 gap이 -1이 되는데 그것은 우리가 원하는 것이 아니기에 0으로 바꿔준다.
  if (gap < 0){
      gap = 0
  }

  //console.log(tot, time, now, recent, gap);
  var tot = parseInt(tot + time - gap);
  
  return tot;
    }

// calTot_prev는 가치를 입력하기 전 보여주는 현재 가치를 계산하는 함수
function calTot_prev(tot, recent) {			
  var now = new Date().getTime();
  let gap = parseInt((now - recent) / (24 * 3600 * 1000)) - 1;
  // 오늘 연달아서 입력한 경우 gap이 -1이 되는데 그것은 우리가 원하는 것이 아니기에 0으로 바꿔준다.
  if (gap < 0){
      gap = 0
  }
  //console.log(tot, time, now, recent, gap);
  var tot = tot - gap;
  
  return tot;
    }

// calTot_cur은 가치를 입력한 후 보여주는 진짜 현재 가치를 계산하는 함수
function calTot_cur(tot, time) {			
  //console.log(tot, time, now, recent, gap);
  var tot = parseInt(tot + time);

  return tot;
    }

// calTot_cur은 가치를 입력한 후 보여주는 진짜 현재 가치를 계산하는 함수
function calTot_cur_cat(tot, time, recent, cat) {			
  //console.log(tot, time, now, recent, gap);
  
  if (cat == '만화책')
    time /= 2;
  var tot = tot + time;

  return tot;
    }
    

function mkdir( dirPath ) {
  const isExists = fs.existsSync( dirPath );
  if( !isExists ) {
      fs.mkdirSync( dirPath, { recursive: true } );
  }
} 

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: '~~~',	// 원하는 문자 입력
  resave: false,
  saveUninitialized: true,
  store:new FileStore(),
}))

app.get('/', (req, res) => {
  if (!authCheck.isOwner(req, res)) {  // 로그인 안되어있으면 로그인 페이지로 이동시킴
    res.redirect('/auth/login');
    return false;
  } else {                                      // 로그인 되어있으면 메인 페이지로 이동시킴
    res.redirect('/main');
    return false;
  }
})

// 인증 라우터
app.use('/auth', authRouter);

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// 메인 페이지
app.get('/main', (req, res) => {
  if (!authCheck.isOwner(req, res)) {  // 로그인 안되어있으면 로그인 페이지로 이동시킴
    res.redirect('/auth/login');
    return false;
  }
  /*
  var html = template.HTML('Welcome',
    `<hr>
        <h2>메인 페이지에 오신 것을 환영합니다</h2>
        <p>로그인에 성공하셨습니다.</p>`,
    authCheck.statusUI(req, res)
  );
  res.send(html);
  */
  nickname=req.session.nickname
  db.query('SELECT curVal, recent FROM userTable WHERE username = ?', [nickname], function(error, results, fields) { // DB에 같은 이름의 회원아이디가 있는지 확인
    if (error) throw error;
    
    if (results[0].recent == 0){
    console.log("first try!"); 
    var today = new Date();
    recent = new Date(today.setDate(today.getDate() - 1)).getTime();
    db.query("update userTable set recent = ? where username = ?", [recent, nickname], function(error, results, fields) {
      if (error) throw error;
      console.log("update recent", recent);
    })
    }
    else {
      recent = results[0].recent;
    }
    prevtotal = results[0].curVal;

      newtotal = calTot_prev(prevtotal, recent);
      
      /*
      db.query("update userTable set curVal = ? where username = ?", [newtotal, nickname], function(error, results, fields) {
        if (error) throw error;
        console.log("update prev complete!", newtotal);
      })
      */

      res.render('index.ejs', {'curVal' : newtotal}, function(err, html){
        if (err) throw err;
        res.send(html);
      })

});
  
  

  /*
  fs.readFile('./index.html' ,'utf8' ,function(error, data) {
      res.writeHead(200, {'Content-Type' : 'text/html'});
      res.end(data);
  });
  */


})

app.post('/result', (req, res) => {
      
  db.query('SELECT curVal, recent FROM userTable WHERE username = ?', [nickname], function(error, results, fields) { // DB에 같은 이름의 회원아이디가 있는지 확인
    if (error) throw error;
    
    if (results[0].recent == 0){
    console.log("first try!"); 
    var today = new Date();
    recent = new Date(today.setDate(today.getDate() - 1)).getTime();
    db.query("update userTable set recent = ? where username = ?", [recent, nickname], function(error, results, fields) {
      if (error) throw error;
      console.log("update recent", recent);
    })
    }
    else {
      recent = results[0].recent;
    }
    prevtotal = results[0].curVal;

    var hstudytime = parseInt(req.body.human);
    var sstudytime = parseInt(req.body.science);
    var estudytime = parseInt(req.body.engineer);
    var hcat = req.body.hcat;
    var scat = req.body.scat;
    var ecat = req.body.ecat;

    

    
    console.log("hcat",hcat);
    console.log("scat",scat);
    console.log("ecat",ecat);
      //console.log(prevtotal, studytime, recent);
      //console.log("studytime", studytime);
      if (isNaN(hstudytime)){
        hstudytime = 0;
      }
      if (isNaN(sstudytime)){
        sstudytime = 0;
      }
      if (isNaN(estudytime)){
        estudytime = 0;
      }

      db.query('select human, science, engineer from userTable where username = ?', [nickname], function(err, results, fields){
        if (err) throw err;
        hstudytime += results[0].human
        sstudytime += results[0].science
        estudytime += results[0].enginner
      })
      db.query('update userTable set human = ?, science = ?, engineer = ? where username = ?', [hstudytime, sstudytime, estudytime, nickname], function(err, results, fields){
        if (err) throw err;
        console.log("subject update complete!");
      })
      
      prevtotal = calTot_cur_cat(prevtotal, hstudytime, hcat);
      prevtotal = calTot_cur_cat(prevtotal, sstudytime, scat);
      prevtotal = calTot_cur_cat(prevtotal, estudytime, ecat);
      newtotal = calTot_prev(prevtotal, recent);

      var recent;
      var recent2;
      var curVal;
      var curVal2;
      db.query("select recent, recent2, curVal, curVal2 from userTable where username = ?", [nickname], function(err, results, fields){
        recent = results[0].recent;
        recent2 = results[0].recent2;
        curVal = results[0].curVal;
        curVal2 = results[0].curVal2;
        var old = parseInt(req.body.old/10);
        
        if (old == 0 || old == 1){
          pay = 212;
        }
        else if (old == 2){
        pay = 262;
      }
        else if (old == 3){
        pay =381;
      }
        else if (old == 4){
        pay = 461;
      }
        else if (old == 5){
        pay = 452;
      }
        else{
        pay = 353;
      }

      
        
        var date = new Date(recent).toLocaleDateString();
        db.query("update userTable set recent2 = ?, recent3 = ?, curVal2 = ?, curVal3 = ? where username = ?", 
        [recent, recent2, curVal, curVal2, nickname], function(err, results, fields){
          console.log("update recent2, recent3, curVal2, curVal3", curVal, curVal2);
          console.log(date);
        })

        //res.writeHead(200, {'Content-Type' : 'text/html;charset=UTF-8'});
      //res.end('<div id="wrap"> <div class="center"> <h1 style="font-size=50px">당신의 가치는 ' + '<span style="color:red">' + newtotal + '</span>' + "입니다.</h1></div></div>");
      var today = new Date().getTime();
      
      db.query("update userTable set curVal = ?, recent = ? where username = ?", [newtotal, today, nickname], function(error, results, fields) {
        if (error) throw error;
        console.log("update all complete!", newtotal, today);
      })
      console.log("pay", pay);
      res.render('result.ejs', {'curVal' : newtotal, 'curVal2' : curVal, 'curVal3' : curVal2, 'recent3' :recent2, 'recent2' : recent, 'recent' : today, 'old' : old * 10, 'pay': pay}, function(err, html){
        if (err) throw err;
        res.send(html);
      })
      })
      
      

      

});
});
    
    
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})