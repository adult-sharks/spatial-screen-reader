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
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

// oscillator와 gainNode를 생성합니다
const oscillator = audioCtx.createOscillator();
const gainNode = audioCtx.createGain();

// oscillator를 gainNode와 연결하고 audioContext로 출력을 조율한 뒤 음량 발생을 시작합니다
oscillator.connect(gainNode);
gainNode.connect(audioCtx.destination);

oscillator.detune.value = 0;
oscillator.start(0);

// 오디오와 관련된 파라미터들 (volumne, frequency)를 설정합니다
gainNode.gain.value = initialVol;
oscillator.frequency.value = initialFreq;
gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);

////////////////
// core logic //
////////////////

const setVolume = (param, my) => {
  oscillator.frequency.value = initialFreq + 50 * (my / h);
  gainNode.gain.exponentialRampToValueAtTime(
    param / 100,
    audioCtx.currentTime + 0.1
  );
};

const getCoordinateData = (mouseX, mouseY) => {
  let output = document.getElementById("edgeDetectionCanvas");
  let c = output.getContext("2d");
  let p = c.getImageData(mouseX, mouseY, 1, 1).data;
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
