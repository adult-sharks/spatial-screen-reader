/////////////////////
// local variables //
/////////////////////

var h;
var w;
var timer;
var remoteStream;

var curMouseX;
var curMouseY;
var prevMouseX;
var prevMouseY;

const initialFreq = 50;
const initialVol = 1;
const imageContainer = document.getElementById("output");

// web audio api context를 생성합니다
// audio context는 오디오 노드의 생성과 프로세싱, 디코딩을 담당합니다 (음성과 관련된 모든 것은 context안에서 일어납니다)
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

// oscillator와 gainNode를 생성합니다
// oscillator는 소리를 생성하는 periodic waveform, sine wave를 의미합니다
// gainNode는 소리의 크기를 바꾸는 인터페이스를 의미합니다
const oscillator = audioCtx.createOscillator();
const gainNode = audioCtx.createGain();

// oscillator를 gainNode와 연결하고 audioContext로 출력을 조율한 뒤 음량 발생을 시작합니다
// audioContext.destination은 음성의 출력 타겟을 말합니다
oscillator.connect(gainNode);
gainNode.connect(audioCtx.destination);

// detune 값을 0으로 지정합니다.
// oscillator를 시작해서 소리 발생을 시작합니다
oscillator.detune.value = 0;
oscillator.start(0);

// 오디오와 관련된 파라미터들 (initial volume, initial frequency)를 설정합니다
// setValueAtTime는 아직 왜 넣었는지 모르겠다...
gainNode.gain.value = initialVol;
oscillator.frequency.value = initialFreq;
gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);

////////////////
// core logic //
////////////////

// setVolume(): 소리의 크기를 결정합니다
// 커서의 높이 값에 따라 frequency를 증가시키며 커서의 높이 값을 음성으로 전달합니다.
// exponentialRampToValueAtTime(도달 값, 도달 목표 시간) - 시간에 따라 소리를 지수적(u자형 커브)으로 증가시킵니다
// https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/exponentialRampToValueAtTime
const setVolume = (param, my) => {
  oscillator.frequency.value = initialFreq + 50 * (my / h);
  gainNode.gain.exponentialRampToValueAtTime(
    param / 100,
    audioCtx.currentTime + 0.1
  );
};

// getCoordinateData(): 커서의 위치에 따라 소리 파라미터를 생성합니다
const getCoordinateData = (mouseX, mouseY) => {
  let output = document.getElementById("edgeDetectionCanvas");
  let c = output.getContext("2d");

  // 캔버스 상의 이미지로부터 주어진 좌표 값의 값을 추출합니다
  // getImageData(x좌표, y좌표, 가로 영역 크기(px), 세로 영역 크기(px))
  let p = c.getImageData(mouseX, mouseY, 1, 1).data;

  // brightness가 존재하지 않으면 1로 값을 지정
  let brightness = p[0] ? p[0] : 1;

  clearTimeout(timer);
  timer = setTimeout(() => {
    setVolume(1, mouseY);
  }, 1000);

  setVolume(brightness, mouseY);
};

const updateCanvas = setInterval(() => {
  const src = cv.imread(imageContainer);
  let ksize = new cv.Size(10, 10);
  let anchor = new cv.Point(-1, -1);
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
  cv.Canny(src, src, 30, 100, 5, false);
  cv.blur(src, src, ksize, anchor, cv.BORDER_DEFAULT);
  cv.imshow("edgeDetectionCanvas", src);
  src.delete();
}, 100);

///////////////////////////
// window event listners //
///////////////////////////

window.addEventListener("message", (event) => {
  if (event.data[0] == "d") {
    imageContainer.src = event.data;
  } else {
    curMouseX = parseInt(event.data.split("/")[0]);
    curMouseY = parseInt(event.data.split("/")[1]);
    if (curMouseX != prevMouseX && curMouseY != prevMouseY) {
      getCoordinateData(curMouseX, curMouseY);
    }
    prevMouseX = curMouseX;
    prevMouseY = curMouseY;
  }
});

window.addEventListener("load", () => {
  const output = document.getElementById("edgeDetectionCanvas");
  imageContainer.style.display = "none";

  h = 700;
  w = 1000;
  output.setAttribute("height", h);
  output.setAttribute("width", w);
});
