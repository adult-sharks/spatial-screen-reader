var h;
var w;

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

const imageContainer = document.getElementById("output");

const canvasModule = async() => {
  const output = document.getElementById("edgeDetectionCanvas");

  h = 700; // windowHeight
  w = 1000; // windowWidth
  
  output.setAttribute("height", h);
  output.setAttribute("width", w);
};

window.addEventListener("message", (event) => { 
  if (event.data) {
    imageContainer.src = event.data;
    
    const src = cv.imread(imageContainer);
    let ksize = new cv.Size(10, 10);
    let anchor = new cv.Point(-1, -1);
  
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    cv.Canny(src, src, 30, 100, 5, false);
    cv.blur(src, src, ksize, anchor, cv.BORDER_DEFAULT);
    cv.imshow("edgeDetectionCanvas", src);
    
    src.delete();

    imageContainer.style.display = "none";
  }
});

const setVolume = (param, my) => {
  oscillator.frequency.value = initialFreq + 50 * (my / h)
  gainNode.gain.exponentialRampToValueAtTime(param/100, audioCtx.currentTime + 0.1);
};

const getCoordinateData = () => {
  var mx, my;
  let output = document.getElementById("edgeDetectionCanvas");

  chrome.storage.local.get(['mouseX', 'mouseY'], (result) => {
    mx = result.mouseX;
    my = result.mouseY;

    let c = output.getContext('2d');
    let p = c.getImageData(mx, my, 1, 1).data;
    let brightness = p[0] ? p[0] : 1;
  
    clearTimeout(timer);
    timer = setTimeout(() => {
      setVolume(1, my)
      console.log(1);
    }, 1000);

    console.log(brightness);
    setVolume(brightness, my);
  });
};

window.addEventListener("load", () => {
  canvasModule();
  chrome.storage.onChanged.addListener(getCoordinateData);
});