// const getSize = () => {
//   const h = window.innerHeight;
//   const w = window.innerWidth;
//   return { h, w };
// };

let capturedStream = null;
let handlerTab = null;
const peer = new Peer({ debug: 2 });
peer.on("error", (err) => {
  console.log(err);
});

const initConnection = async () => {
  const url = chrome.runtime.getURL("./src/handler/handler.html");
  // capturedStream = await navigator.mediaDevices.getDisplayMedia({
  //   video: true,
  //   audio: false,
  // });

  // if (capturedStream == null) {
  //   console.error("Error starting tab capture");
  //   return;
  // }
  if (handlerTab !== null) {
    handlerTab.close();
  }

  handlerTab = window.open(url);

  await new Promise((resolve, reject) => {
    setTimeout(resolve, 1000);
  });
  const handlerPeerId = await requestHandlerPeerId();
  console.log(handlerPeerId);
  // const call = peer.call(handlerPeerId, capturedStream);
  const conn = peer.connect(handlerPeerId);
  conn.on("open", () => {
    conn.send("connected");
  });
  conn.on("data", (data) => {
    if (data === "connected") {
      startStream(handlerPeerId);
    }
  });
};

const startStream = async (handlerPeerId) => {
  capturedStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
  });
  if (capturedStream == null) {
    console.error("Error starting tab capture");
    return;
  }
  const call = peer.call(handlerPeerId, capturedStream);
  console.log("called handler");
};

const stopStream = () => {
  if (capturedStream !== null) {
    capturedStream.getTracks().forEach((track) => track.stop());
    capturedStream = null;
  }
  handlerTab.close();
  handlerTab = null;
};

const requestHandlerPeerId = () => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { key: "triggerRequestHandlerPeerId" },
      (response) => {
        if (response) {
          resolve(response.key);
        } else {
          reject();
        }
      }
    );
  });
};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.key) {
    case "check":
      sendResponse({ received: true });
      break;
    case "on":
      sendResponse({ active: true });
      console.log("toggle-on");
      initConnection();
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
