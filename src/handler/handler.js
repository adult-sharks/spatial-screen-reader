/////////////////////
// local variables //
/////////////////////

const player = document.getElementById("player");
const sandbox = document.getElementById("sandbox");
let screenStream;

////////////////
// core logic //
////////////////

const getStreamId = async () => {
  return new Promise((resolve, reject) => {
    chrome.desktopCapture.chooseDesktopMedia(["window"], (id) => {
      if (id) {
        resolve(id);
      } else {
        abortCycle();
        reject();
      }
    });
  });
};

const setActivityStatus = async (status) => {
  if (status === true) {
    await chrome.storage.local.set({ activityStatus: "true" });
  } else if (status === false) {
    await chrome.storage.local.set({ activityStatus: "false" });
  }
};

const sendReadyMessage = async () => {
  chrome.runtime.sendMessage({ key: "handlerReady" });
};

const startCapture = async () => {
  const streamId = await getStreamId();
  screenStream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: streamId,
      },
    },
  });
  player.srcObject = screenStream;
};

const stopCapture = async () => {
  if (screenStream !== null) {
    screenStream.getTracks().forEach((track) => track.stop());
    screenStream = null;
    player.srcObject = null;
    player.pause();
  }
};

const setActivityBadge = (status) => {
  if (status === "on") {
    chrome.action.setBadgeBackgroundColor({ color: "#e34646" });
    chrome.action.setBadgeText({ text: "on" });
  } else if (status === "off") {
    chrome.action.setBadgeBackgroundColor({ color: "#e6e6e6" });
    chrome.action.setBadgeText({ text: "off" });
  }
};

const closeWindow = () => {
  window.close();
};

const connectSandbox = () => {
  sandbox.contentWindow.remoteStream = screenStream;
  sandbox.contentWindow.postMessage("initiate", "*");
};

const launchCycle = async () => {
  await setActivityStatus(true);
  setActivityBadge("on");
  await startCapture();
  await sendReadyMessage();
  connectSandbox();
};

const abortCycle = async () => {
  await setActivityStatus(false);
  setActivityBadge("off");
  await stopCapture();
  closeWindow();
};

///////////////////////////
// window event listners //
///////////////////////////

window.addEventListener("load", function () {
  launchCycle();
});

window.addEventListener("beforeunload", () => {
  abortCycle();
});

///////////////////////////
// chrome event listners //
///////////////////////////

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.key) {
    case "abort":
      abortCycle();
      break;
    default:
      break;
  }
});
