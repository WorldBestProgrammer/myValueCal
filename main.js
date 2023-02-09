const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser');
const FileStore = require('session-file-store')(session)

var authRouter = require('./lib_login/auth');
var authCheck = require('./lib_login/authCheck.js');
var template = require('./lib_login/template.js');
var fs = require('fs');
const db = require('./lib_login/db');
var array;
var prevtotal;
var newtotal;
var nickname;
var username;

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
function calTot_prev(tot, time, recent) {			
  var now = new Date().getTime();
  let gap = parseInt((now - recent) / (24 * 3600 * 1000)) - 1;
  // 오늘 연달아서 입력한 경우 gap이 -1이 되는데 그것은 우리가 원하는 것이 아니기에 0으로 바꿔준다.
  if (gap < 0){
      gap = 0
  }
  //console.log(tot, time, now, recent, gap);
  var tot = parseInt(tot - gap);
  
  return tot;
    }

// calTot_cur은 가치를 입력한 후 보여주는 진짜 현재 가치를 계산하는 함수
function calTot_cur(tot, time) {			
  //console.log(tot, time, now, recent, gap);
  var tot = parseInt(tot + time);

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

  if(req.method == 'GET'){
    fs.readFile('./index.html' ,'utf8' ,function(error, data) {
        res.writeHead(200, {'Content-Type' : 'text/html'});
        res.end(data);
    });
}
  


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

    var studytime = parseInt(req.body.hour);
      //console.log(prevtotal, studytime, recent);
      console.log("studytime", studytime);
      newtotal = calTot(prevtotal, studytime, recent);
      res.writeHead(200, {'Content-Type' : 'text/html;charset=UTF-8'});
      res.end('당신의 가치는 ' + newtotal + "입니다.");
      
      var today = new Date().getTime();
      
      db.query("update userTable set curVal = ?, recent = ? where username = ?", [newtotal, today, nickname], function(error, results, fields) {
        if (error) throw error;
        console.log("update complete!", newtotal, today);
      })

});
});
    
    

  

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})