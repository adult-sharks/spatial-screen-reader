// const getSize = () => {
//   const h = window.innerHeight;
//   const w = window.innerWidth;
//   return { h, w };
// };

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
