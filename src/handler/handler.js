/////////////////////
// local variables //
/////////////////////

const player = document.getElementById("player");
const sandbox = document.getElementById("sandbox");
const streamCanvas = document.createElement("canvas");
let screenContext;
let screenStream;
let screenInterval;

var mouseX = 0;
var mouseY = 0;

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

const setSandboxStreamInterval = () => {
  streamCanvas.height = screenStream.getVideoTracks()[0].getSettings().height;
  streamCanvas.width = screenStream.getVideoTracks()[0].getSettings().width;

  screenInterval = setInterval(() => {
    screenContext = streamCanvas.getContext("2d");
    screenContext.drawImage(player, 0, 0);
    const base64 = streamCanvas.toDataURL();
    sandbox.contentWindow.postMessage(base64, "*");
  }, 10);
};

const clearSandboxStreamInterval = () => {
  clearInterval(screenInterval);
};

const launchCycle = async () => {
  await setActivityStatus(true);
  setActivityBadge("on");
  await startCapture();
  await sendReadyMessage();
  setSandboxStreamInterval();
};

const abortCycle = async () => {
  await setActivityStatus(false);
  setActivityBadge("off");
  clearSandboxStreamInterval();
  await stopCapture();
  closeWindow();
};

const getCoordinateData = async() => {
  const { mouseX, mouseY } = await chrome.storage.local.get(["mouseX", "mouseY"]);
  sandbox.contentWindow.postMessage(mouseX + "/" + mouseY, "*");
};

///////////////////////////
// window event listners //
///////////////////////////

window.addEventListener("load", function () {
  launchCycle();
  chrome.storage.onChanged.addListener(getCoordinateData);
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