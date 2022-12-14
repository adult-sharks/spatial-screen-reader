import cv from '@techstark/opencv-js';

/////////////////////
// local variables //
/////////////////////

const sandboxHeight = 500;
const sandboxWidth = 500;
const pixelRatio = window.devicePixelRatio;
const koreaRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
var imageHeight = 0;
var imageWidth = 0;

var cursorSleepTimeout;
var canvasUpdateInterval;

var cursorX;
var cursorY;
var prevCursorX;
var prevCursorY;

const initialFreq = 50;
const initialVol = 0;
const imageContainer = document.getElementById('imageContainer');
// const imageContainer = new Image();

// web audio api context를 생성합니다
// audio context는 오디오 노드의 생성과 프로세싱, 디코딩을 담당합니다 (음성과 관련된 모든 것은 context안에서 일어납니다)
const audioCtx = new AudioContext();

// oscillator와 gainNode를 생성합니다
// oscillator는 소리를 생성하는 periodic waveform, sine wave를 의미합니다
// gainNode는 소리의 크기를 바꾸는 인터페이스를 의미합니다
const oscillator = audioCtx.createOscillator();
const gainNode = audioCtx.createGain();

////////////////
// core logic //
////////////////

function speak(text, opt_prop) {
  // if reading, cancel TTS
  window.speechSynthesis.cancel();
  const speechContext = new SpeechSynthesisUtterance();
  const language = koreaRegex.test(text) ? 'ko-KR' : 'en-US';
  speechContext.rate = 1;
  speechContext.lang = language ? language : 'ko-KR';
  speechContext.pitch = 1;
  speechContext.text = text;
  window.speechSynthesis.speak(speechContext);
}

const initializeAudioNode = () => {
  // oscillator를 gainNode와 연결하고 audioContext로 출력을 조율한 뒤 음량 발생을 시작합니다
  // audioContext.destination은 음성의 출력 타겟을 말합니다
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  // detune 값을 0으로 지정합니다.
  // oscillator를 시작해서 소리 발생을 시작합니다
  oscillator.detune.value = 0;
  oscillator.start(0);

  // 오디오와 관련된 파라미터들 (initial volume, initial frequency)를 설정합니다
  gainNode.gain.value = initialVol;
  oscillator.frequency.value = initialFreq;
};

// setVolume: 소리의 크기를 결정합니다
// 커서의 높이 값에 따라 frequency를 증가시키며 커서의 높이 값을 음성으로 전달합니다.
// exponentialRampToValueAtTime(도달 값, 도달 목표 시간) - 시간에 따라 소리를 지수적(u자형 커브)으로 증가시킵니다
// https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/exponentialRampToValueAtTime
const setVolume = (param, delay) => {
  if (param === 0) {
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + delay);
  } else {
    gainNode.gain.exponentialRampToValueAtTime(
      param / 150,
      audioCtx.currentTime + delay,
    );
  }
};

const sendBrightness = async (brightness) => {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  headers.append('Accept', 'application/json');
  headers.append('Access-Control-Allow-Origin', 'http://localhost:3000');
  headers.append('Access-Control-Allow-Credentials', 'true');
  headers.append('GET', 'POST', 'OPTIONS');

  const res = await fetch('http://localhost:3000', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      key: '우리 함께 환희를 누리고 싶어',
      data: brightness,
    }),
  });

  const value = await res.json();
  console.log(value);
};

// getBrightness: 커서의 위치에 따라 소리 파라미터를 반환합니다
const getBrightness = (mouseX, mouseY) => {
  const detectionCanvas = document.getElementById('detectionCanvas');
  const detectionCanvasContext = detectionCanvas.getContext('2d', {
    willReadFrequently: true,
  });

  // 캔버스 상의 이미지로부터 주어진 좌표 값의 값을 추출합니다
  // getImageData(x좌표, y좌표, 가로 영역 크기(px), 세로 영역 크기(px))
  const brightnessArray = detectionCanvasContext.getImageData(
    mouseX,
    mouseY,
    1,
    1,
  ).data;

  // brightness가 존재하지 않으면 1로 값을 지정
  // 디버깅용 콘솔 출력
  const brightness = brightnessArray[0] ? brightnessArray[0] : 0;
  console.log(mouseX + ', ' + mouseY + ' => ' + brightness);

  return brightness;
};

const sendReadyMessage1 = async (brightness) => {
  chrome.runtime.sendMessage({ key: 'Brightness', brightness: brightness });
};

const canvasCapture = () => {
  /*
  cv.cvtColor = 이미지 흑백화
  cv.Canny = 이미지 경계검출
  cv.blur = 이미지 블러
  cv.imshow = 캔버스 이미지 출력
  */
  const src = cv.imread(imageContainer);
  const ksize = new cv.Size(10, 10);
  const anchor = new cv.Point(-1, -1);
  const countMat = new cv.Mat();
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  const M = cv.Mat.ones(15, 15, cv.CV_8U);

  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
  cv.threshold(src, countMat, 0, 255, cv.THRESH_OTSU + cv.THRESH_BINARY_INV);
  cv.dilate(
    countMat,
    countMat,
    M,
    anchor,
    1,
    cv.BORDER_CONSTANT,
    cv.morphologyDefaultBorderValue(),
  );
  cv.findContours(
    countMat,
    contours,
    hierarchy,
    cv.RETR_CCOMP,
    cv.CHAIN_APPROX_SIMPLE,
  );

  cv.Canny(src, src, 30, 100, 5, false);
  cv.blur(src, src, ksize, anchor, cv.BORDER_DEFAULT);
  cv.imshow('detectionCanvas', src);
  src.delete();
  countMat.delete();
};

/**
 * 진행 중인 음성 발생을 취소합니다
 */
function abortSpeech() {
  if (window.speechSynthesis.speak) {
    window.speechSynthesis.cancel();
  }
}

// registerCursorSleepTimeout: 커서가 1초동안 움직이지 않으면 소리가 멈추는 timeout을 등록합니다
const registerCursorSleepTimeout = () => {
  clearTimeout(cursorSleepTimeout);
  cursorSleepTimeout = setTimeout(() => {
    setVolume(0, 0.5);
  }, 500);
};

const loadImage = (imageNode, data) => {
  return new Promise((resolve, reject) => {
    imageNode.src = data;
    imageNode.onload = () => resolve(true);
  });
};

const onMessageHandler = async (event) => {
  abortSpeech();
  if (event.data[0] == 'i') {
    const dataArray = event.data.split('-');
    // ~: bitwise not(이진연산 not을 두번 = 정수형 반환)
    imageWidth = ~~(dataArray[1] / pixelRatio);
    imageHeight = ~~(dataArray[2] / pixelRatio);
    await loadImage(imageContainer, dataArray[3]);
    canvasCapture();
  } else if (event.data[0] == 't') {
    const dataArray = event.data.split('/');
    const text = dataArray[1];
    //console.log('sandbox ' + text);
    speak(text);
  } else if (imageHeight > 0 && imageWidth > 0) {
    abortSpeech();
    const dataArray = event.data.split('/');
    const mx = ~~dataArray[1];
    const my = ~~dataArray[2];

    // 브라우저 윈도우에 위치한 마우스 좌표값(mx, my)을
    // 샌드박스에 위치한 마우스 좌표값(cursorX, cursorY)으로 변형
    // ex) my : imageHeight = cursorY : sandboxHeight 와 같은 비례식
    cursorX = ~~(mx * (sandboxWidth / imageWidth));
    cursorY = ~~(my * (sandboxHeight / imageHeight));
    if (cursorX != prevCursorX || cursorY != prevCursorY) {
      const brightness = getBrightness(cursorX, cursorY);
      await sendBrightness(brightness);
      setVolume(brightness, 0.1);
      //performSignIn(brightness);
      registerCursorSleepTimeout();
    }
    prevCursorX = cursorX;
    prevCursorY = cursorY;
  }
};

/**
 * message에 대한 이벤트 리스너를 생성합니다.
 * 이벤트가 발생할 때마다 onMessageHandler를 호출합니다.
 */
const registerMessageHandler = () => {
  window.addEventListener('message', onMessageHandler);
};

/**
 * message에 대한 이벤트 리스너를 삭제합니다.
 */
const removeMessageHandler = () => {
  window.removeEventListener('message', onMessageHandler);
};

/**
 * opencv.js가 정상적으로 load되면 실행됩니다.
 * 오디오의 초기값을 설정해주는 함수를 호출합니다.
 * message에 대한 이벤트 리스너를 생성하는 함수를 호출합니다.
 */
const launchCycle = () => {
  initializeAudioNode();
  registerMessageHandler();
};

/**
 * unload 이벤트가 발생하면 호출됩니다.
 * 이벤트 리스너를 삭제하는 함수를 호출합니다.
 */
const abortCycle = () => {
  removeMessageHandler();
};

///////////////////////////
// window event listners //
///////////////////////////

// sandbox.js의 launchCycle 입니다
// opencv.js가 정상적으로 로드 된 뒤 launchCycle을 호출합니다
cv['onRuntimeInitialized'] = () => {
  launchCycle();
};

// sandbox.js의 abortCycle 입니다
window.addEventListener('beforeunload', () => {
  abortCycle();
});
