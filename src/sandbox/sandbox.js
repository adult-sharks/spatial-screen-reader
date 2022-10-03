var screenInterval;
var h;
var w;
var timer;

const xc = document.getElementById('xc');
const yc = document.getElementById('yc');
const vol = document.getElementById('vol');

const streamCanvas = document.getElementById("streamCanvas");
const edgeDetectionCanvas = document.getElementById("edgeDetectionCanvas");

const initialFreq = 50;
const initialVol = 1;

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const oscillator = audioCtx.createOscillator();
const gainNode = audioCtx.createGain();

const player = document.getElementById("player");

const setAudio = () => {
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.detune.value = 0; 
  oscillator.start(0);
  
  gainNode.gain.value = initialVol;
  oscillator.frequency.value = initialFreq;
  gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
};

const readLocalStorage = async (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], (result) => {
      if (result[key] == undefined) {
        reject();
      } else {
        resolve(result[key]);
      }
    });
  });
};

const edgeDetection = () => {
  screenInterval = setInterval(() => {
    var ctx = streamCanvas.getContext("2d");
    
    ctx.drawImage(
      player, 
      (streamCanvas.width - player.videoWidth) / 2, 
      (streamCanvas.height - player.videoHeight) / 2
      );
    
    var src = cv.imread("streamCanvas");
    let ksize = new cv.Size(10, 10);
    let anchor = new cv.Point(-1, -1);

    cv.cvtColor(src, src, cv.COLOR_RGB2GRAY, 0);
    cv.Canny(src, src, 30, 100, 5, false);
    cv.blur(src, src, ksize, anchor, cv.BORDER_DEFAULT);
    cv.imshow("edgeDetectionCanvas", src);

    src.delete();
  }, 100);

  player.style.display = "none";
  streamCanvas.style.display = "none";
};

const canvasModule = async () => {
  h = 700 // await readLocalStorage('windowHeight');
  w = 1400 // await readLocalStorage('windowWidth');

  streamCanvas.setAttribute('height', h);
  streamCanvas.setAttribute('width', w);
  edgeDetectionCanvas.setAttribute('height', h);
  edgeDetectionCanvas.setAttribute('width', w);

  edgeDetection();
};

const setVolume = (brightness, my) => {
  oscillator.frequency.value = initialFreq + 50 * (my / h);
  gainNode.gain.exponentialRampToValueAtTime(brightness / 100, audioCtx.currentTime + 0.1);
};

const getCoordinateData = () => {
  chrome.storage.local.get(["mouseX", "mouseY"], (result) => {
    var mx = 50; // result.mouseX
    var my = 50; // result.mouseY

    let c = edgeDetectionCanvas.getContext('2d');
    let p = c.getImageData(mx, my, 1, 1).data;
    let brightness = p[0] ? p[0] : 1;

    vol.innerText = brightness.toString();
    xc.innerText = mx.toString();
    yc.innerText = my.toString();

    clearTimeout(timer);
    timer = setTimeout(() => {
      setVolume(1, my);
    }, 1000);

    setVolume(brightness, my);
  });
};

const setPlayer = async () => {
  await canvasModule();
  chrome.storage.onChanged.addListener(getCoordinateData);
};

window.addEventListener("message", (event) => {
  player.srcObject = window.remoteStream;
  setAudio();
  setPlayer();
});
