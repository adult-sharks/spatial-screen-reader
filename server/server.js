const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const router = express.Router();
var SerialPort = require('serialport').SerialPort;
// Arduino 가 "COM7" 에 연결되었다고 가정한다.

var serialPort = new SerialPort(
  {
    path: '/dev/cu.usbmodem142301',
    baudRate: 9600,
  },
  false,
);
/*
var serialPort = new SerialPort(
  '/dev/cu.usbmodem142301',
  { baudrate: parseInt(9600) },
  false,
);*/
var brightness = '0';
serialPort.open(function () {
  console.log('connected...');
  serialPort.on('data', function (data) {
    // 아두이노에서 오는 데이터를 출력한다.
    console.log('data received: ' + data);
  });
  setInterval(function () {
    //ledStatus = !ledStatus;
    //console.log(ledStatus);
    // LED 가 ON/OFF 된다.
    console.log('밝기', brightness);
    serialPort.write(brightness);
  }, 10);
});

const corsOptions = {
  origin: '*',
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.all('/*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  next();
});

/* localhost:3000/main 접속시 나올 메시지 */
app.get('/', (request, response) => {
  response.send(`
    <h1>Hello World</h1>
    <p>This is save page</p>
    `);
});

/* localhost:3000/ 혹은 localhost:3000/main 외의
get하지 않은 페이지 접속시 나올 메시지. */
// app.use((request, response) => {
//   console.log(request);
//   console.log('');
//   response.send(`<h1>Sorry, page not found :(</h1>`);
// });

app.use('/', router);

router.post('/', (request, response) => {
  console.log(request.body);
  response.json({ key: '빛나는 생명의 환희' });
  //console.log(request.body.data);
  // console.log(typeof request.body.data);
  brightness = request.body.data.toString();
});

/* 3000포트에서 서버 구동 */
app.listen(3000, () => {
  console.log('localhost:3000 에서 서버가 시작됩니다.');
});

// 브라우저에서 오는 응답이 json 일수도 있고, 아닐 수도 있으므로 urlencoded() 도 추가한다.

function intToChar(b) {
  // 👇️ for Uppercase letters, replace `a` with `A`
  const code = 'a'.charCodeAt(0);
  //console.log(code); // 👉️ 97

  return String.fromCharCode(code + b);
}
