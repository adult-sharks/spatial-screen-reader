//test1
var h;
var w;
var timer;
var screenInterval;

const xc = document.getElementById("xc");
const yc = document.getElementById("yc");
const vol = document.getElementById("vol");

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

const edgeDetection = (player, streamCanvas) => {
  player.style.display = "none";
  streamCanvas.style.display = "none";

  screenInterval = setInterval(() => {
    var canvasContext = streamCanvas.getContext("2d");
    var src = cv.imread("streamCanvas");
    let ksize = new cv.Size(10, 10);
    let anchor = new cv.Point(-1, -1);

    canvasContext.drawImage(
      player,
      (streamCanvas.width - player.videoWidth) / 2,
      (streamCanvas.height - player.videoHeight) / 2
    );

    cv.cvtColor(src, src, cv.COLOR_RGB2GRAY, 0);
    cv.Canny(src, src, 30, 100, 5, false);
    cv.blur(src, src, ksize, anchor, cv.BORDER_DEFAULT);
    cv.imshow("edgeDetectionCanvas", src);
    src.delete();
  }, 100);
};

const canvasModule = async (player) => {
  var streamCanvas = document.getElementById("streamCanvas");
  var edgeDetectionCanvas = document.getElementById("edgeDetectionCanvas");

  h = await readLocalStorage("windowHeight");
  w = await readLocalStorage("windowWidth");

  streamCanvas.setAttribute("height", h);
  streamCanvas.setAttribute("width", w);
  edgeDetectionCanvas.setAttribute("height", h);
  edgeDetectionCanvas.setAttribute("width", w);

  edgeDetection(player, streamCanvas);
};

// ==== AUDIO MODULE ==== //
const initialFreq = 50;
const initialVol = 1;

// create web audio api context
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

// create Oscillator and gain node
const oscillator = audioCtx.createOscillator();
const gainNode = audioCtx.createGain();

// connect oscillator to gain node to speakers
oscillator.connect(gainNode);
gainNode.connect(audioCtx.destination);

oscillator.detune.value = 0; // value in cents
oscillator.start(0);

// Set default parameters related to audio
gainNode.gain.value = initialVol;
oscillator.frequency.value = initialFreq;
gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);

const setVolume = (param, my) => {
  //set freq corresponding to y cordinate
  oscillator.frequency.value = initialFreq + 50 * (my / h);
  //listen to brightness level as param at cursor position (MAX 255, MIN 0)
  gainNode.gain.exponentialRampToValueAtTime(
    param / 100,
    audioCtx.currentTime + 0.1
  );
};

const getCoordinateData = () => {
  chrome.storage.local.get(["mouseX", "mouseY"], function (result) {
    var mx = result.mouseX;
    var my = result.mouseY;
    var output = document.getElementById("edgeDetectionCanvas");

    let c = output.getContext("2d");
    let p = c.getImageData(mx, my, 1, 1).data;
    let brightness = p[0] ? p[0] : 1;

    xc.innerText = mx.toString();
    yc.innerText = my.toString();
    vol.innerText = brightness.toString();

    setVolume(brightness, my);

    clearTimeout(timer);
    timer = setTimeout(() => {
      setVolume(1, my);
    }, 1000);
  });
};

window.addEventListener("load", async (e) => {
  var player = document.getElementById("player");

  player.srcObject = window.currentStream;
  player.addEventListener("canplay", async (e) => {
    e.muted = true;
    e.play();
  });

  await canvasModule(player);
  chrome.storage.onChanged.addListener(getCoordinateData);
});

// ==== SHUTDOWN MODULE ==== //

function shutdownHandler() {
  // Check whether current stream exists
  if (!window.currentStream) {
    return;
  }

  // Empty the source object and cut off the stream track
  var player = document.getElementById("player");
  player.srcObject = null;
  var tracks = window.currentStream.getTracks();
  for (var i = 0; i < tracks.length; ++i) {
    tracks[i].stop();
  }
  window.currentStream = null;

  // Clear screen interval and remove event listener
  clearInterval(screenInterval);
  chrome.storage.onChanged.removeListener(getCoordinateData());

  // Close the window
  window.close();
}
