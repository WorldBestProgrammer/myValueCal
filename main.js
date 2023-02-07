const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser');
const FileStore = require('session-file-store')(session)

var authRouter = require('./lib_login/auth');
var authCheck = require('./lib_login/authCheck.js');
var template = require('./lib_login/template.js');
var fs = require('fs');
var array;
var prevtotal;
var newtotal;
var nickname;

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
  console.log("HI");
      mkdir(nickname);
      let exist = fs.existsSync("./" + nickname + "/data.txt");

      if (!exist){
          console.log(exist);
          fs.writeFileSync("./" + nickname + "/data.txt", '\n', 'utf8');
      }

      array = fs.readFileSync("./" + nickname + "/data.txt").toString().split("\n")
      console.log("input");
      for(i in array){
        console.log(array[i])
      }

      if (array[0] == ""){
          
          console.log("NULL");
          prevtotal = 0;
          var today = new Date();
          recent = new Date(today.setDate(today.getDate() - 1)).getTime();
      }
      else{
          prevtotal = parseInt(array[0]);
          var recent = array[1];
      }

      
      var studytime = parseInt(req.body.hour);
      //console.log(prevtotal, studytime, recent);
      console.log("studytime", studytime);
      newtotal = calTot(prevtotal, studytime, recent);
      res.writeHead(200, {'Content-Type' : 'text/html;charset=UTF-8'});
      res.end('당신의 가치는 ' + newtotal + "입니다.");
      
      var today = new Date().getTime();
      var wdata = newtotal + '\n' + today;

      fs.writeFile("./" + nickname + "/data.txt", wdata, 'utf8', function(err) {
          console.log("output");
          console.log(wdata);
  });
  });
    
    

  

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})