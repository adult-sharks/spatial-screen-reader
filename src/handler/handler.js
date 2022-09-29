/////////////////////
// local variables //
/////////////////////

const player = document.getElementById("player");
let screenStream;

////////////////
// core logic //
////////////////

const getStreamId = async () => {
  return new Promise((resolve, reject) => {
    chrome.desktopCapture.chooseDesktopMedia(["window"], (id) => {
      if (id) {
        console.log("got stream id");
        resolve(id);
      } else {
        console.log("did not get stream stream id");
        abortCycle();
      }
    });
  });
};

const setActivityStatus = (status) => {
  if (status === true) {
    chrome.storage.local.set({ activityStatus: "true" });
  } else if (status === false) {
    chrome.storage.local.set({ activityStatus: "false" });
  }
};

const startCapture = async () => {
  console.log("startCapture init");
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
  player.play();

  // [이슈] handler 통신 부분서 오류
  await chrome.runtime.sendMessage({ key: "handlerReady" });
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

const launchCycle = async () => {
  setActivityStatus(true);
  setActivityBadge("on");
  startCapture();
};

const abortCycle = async () => {
  setActivityStatus(false);
  setActivityBadge("off");
  stopCapture();
  closeWindow();
};

///////////////////////////
// window event listners //
///////////////////////////

window.addEventListener("load", function () {
  launchCycle();
});

window.addEventListener("beforeunload", () => {
  console.log("unloading");
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
  return true;
});
