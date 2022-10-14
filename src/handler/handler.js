/////////////////////
// local variables //
/////////////////////

const player = document.getElementById("player");
const sandbox = document.getElementById("sandbox");
const streamCanvas = document.createElement("canvas");
// html에서 id를 이용해 특정 노드를 가져오는 법
const ajaxBtn = document.getElementById("btn-post");
let screenContext;
let screenStream;
let screenInterval;

var mouseX = 0;
var mouseY = 0;

////////////////
// core logic //
////////////////

// click 이벤트 핸들러
ajaxBtn.addEventListener("click", do_ajax());

function do_ajax() {
  var req = new XMLHttpRequest();
  var result = document.getElementById("result");
  req.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      result.innerHTML = this.responseText;
    } else {
      result.innerHTML = "abc...";
    }
  };

  req.open("POST", "/", true);
  req.setRequestHeader(
    "content-type",
    "application/x-www-form-urlencoded;charset=UTF-8"
  );
  req.send("name=" + document.getElementById("name").value);
}

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

    mouseX = (mouseX + 23) % 100;
    mouseY = (mouseY + 37) % 100;
    sandbox.contentWindow.postMessage(mouseX + "/" + mouseY, "*");
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

const getCoordinateData = async () => {
  const { mouseX, mouseY } = await chrome.storage.local.get([
    "mouseX",
    "mouseY",
  ]);
  // inject.js 에서 제대로 받아오면 추가하기
  // sandbox.contentWindow.postMessage(mouseX + "," + mouseY, "*");
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
