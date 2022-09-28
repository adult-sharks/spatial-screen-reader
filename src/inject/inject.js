// ==== CURSOR COMPONENT ==== //

// Use uri to draw cursor

var cursorUri = 'url("data:image/png;base64,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"), auto';
var css = document.createElement("style");
const getSize = () => {
  const h = window.innerHeight;
  const w = window.innerWidth;
  console.log(h, w);
  return { h, w };
};
// Set custom cursor then prevent from overriding it
// Reset when extension is off

const changeCursor = () => {
  css.innerHTML = `*{cursor: ${cursorUri}!important;}`;
  document.body.appendChild(css);
}

const resetCursor = () => {
  document.body.removeChild(css);
}


const logKey = (e) => {
  let mx = e.clientX;
  let my = e.clientY;

  chrome.storage.local.set({ 'mouseX': mx, 'mouseY': my });
  console.log(mx + ', ' + my)
}
const mouseEventListener = () => {
  console.log("hello");
  document.removeEventListener('mousemove', logKey);
  document.addEventListener('mousemove', logKey);
}

getSize();
changeCursor();
mouseEventListener();


// ==== COMMUNICATION COMPONENT ==== //

//When unloaded(page redirected), 
//send message, so that foreground.js is injected again
window.addEventListener('unload', () => {
  chrome.runtime.sendMessage({ method: 'request' })
});




let capturedStream = null;
let handlerTab = null;

// const startStream = () => {
//   const { h, w } = getSize();
//   const handlerTab = null;

//   chrome.tabCapture.capture(
//     {
//       audio: false,
//       video: true,
//       videoConstraints: {},
//     },
//     (mediaStream) => {
//       sendStreamToHandler(mediaStream, handlerTab);
//     }
//   );
//   handlerTab = window.open("./src/handler/handler.html");
//   chrome.tabs.create({
//     url: chrome.extension.getURL("./src/handler/handler.html"),
//     selected: true,
//   });
// };

const startStream = async () => {
  const url = chrome.runtime.getURL("./src/handler/handler.html");
  capturedStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
  });
  sendStreamToHandler(capturedStream, url);
};

const sendStreamToHandler = (capturedStream, url) => {
  console.log("sadas");
  if (capturedStream == null) {
    console.error("Error starting tab capture");
    return;
  }
  if (handlerTab != null) {
    handlerTab.close();
  }
  handlerTab = window.open(url);
  // handlerTab.currentStream = capturedStream;
};

const stopStream = () => {
  capturedStream = null;
  handlerTab.close();
  handlerTab = null;
};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.key) {
    case "check":
      sendResponse({ received: true });
      break;
    case "on":
      sendResponse({ active: true });
      console.log("toggle-on");
      startStream();
      break;
    case "off":
      sendResponse({ active: false });
      console.log("toggle-off");
      stopStream();
      break;
    default:
      break;
  }
});
