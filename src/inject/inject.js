/////////////////////
// local variables //
/////////////////////

let screenStream = null;
let handlerTab = null;
const peer = new Peer({ debug: 2 });
peer.on("error", (err) => {
  console.log(err);
});

////////////////
// core logic //
////////////////

const initConnection = async () => {
  const handlerUrl = chrome.runtime.getURL("./src/handler/handler.html");
  if (handlerTab !== null) {
    handlerTab.close();
  }

  window.open(handlerUrl);

  await new Promise((resolve, reject) => {
    setTimeout(resolve, 1000);
  });
  const handlerPeerId = await requestHandlerPeerId();
  console.log(handlerPeerId);
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
  screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
  });
  if (screenStream == null) {
    console.error("Error starting tab capture");
    return;
  }
  const call = peer.call(handlerPeerId, screenStream);
  console.log("called handler");
};

const stopStream = () => {
  if (screenStream !== null) {
    screenStream.getTracks().forEach((track) => track.stop());
    screenStream = null;
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

///////////////////////////
// window event listners //
///////////////////////////

window.addEventListener("beforeunload", () => {
  chrome.storage.local.set({ currentStatus: "false" });
});

///////////////////////////
// chrome event listners //
///////////////////////////

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
