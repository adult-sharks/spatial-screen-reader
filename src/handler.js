/////////////////////
// local variables //
/////////////////////

const sandbox = document.getElementById("sandbox");
const captureIntervalParam = 600;

var screenCaptureInterval;
var previousDataUri;
var cursorX = 0;
var cursorY = 0;

////////////////
// core logic //
////////////////

// setActivityStatus: chrome.storage에 activity 값을 저장합니다
// status: true | false
const setActivityStatus = async (status) => {
  if (status === true) {
    await chrome.storage.local.set({ activityStatus: "true" });
  } else if (status === false) {
    await chrome.storage.local.set({ activityStatus: "false" });
  }
};

// setActivityBadge: 확장프로그램 아이콘 값을 수정합니다
// status: true | false
const setActivityBadge = async (status) => {
  if (status === "on") {
    await chrome.action.setBadgeBackgroundColor({ color: "#e34646" });
    await chrome.action.setBadgeText({ text: "on" });
  } else if (status === "off") {
    await chrome.action.setBadgeBackgroundColor({ color: "#e6e6e6" });
    await chrome.action.setBadgeText({ text: "off" });
  }
};

// sendReadyMessage: background.js에 준비되었음을 전달합니다
const sendReadyMessage = async () => {
  chrome.runtime.sendMessage({ key: "handlerReady" });
};

// checkValidUrlbyId: URL이 현재 창에서 접근 가능한지 확인합니다
const checkValidUrlbyId = async (tabId) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url.includes("chrome://")) return false;
    else if (tab.url.includes("chrome-extension://")) return false;
    else return true;
  } catch (err) {
    console.log("check error");
    return false;
  }
};

// queryActiveTabId: chrome.tabs를 이용해 현재 활성화된 탭의 아이디(tabId)를 반환합니다
const queryActiveTabId = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) return tabs[0].id;
  else return new Error("Cannot parse active tab");
};

// captureScreen: 활성화된 tab의 영역을 캡쳐합니다
// 탭을 이동하는 중에는 chrome.tabs가 비활성화 되므로 이를 확인합니다
// captureVisibleTab은 화면의 dataURI를 생성합니다
const captureScreen = async () => {
  const activeTabId = await queryActiveTabId();
  const isValidTab = await checkValidUrlbyId(activeTabId);
  if (isValidTab) {
    const screenDataUri = await chrome.tabs.captureVisibleTab();
    if (previousDataUri !== screenDataUri) postScreen(screenDataUri);
    previousDataUri = screenDataUri;
  }
};

// postScreen: dataURI로 전달받은 화면 이미지를 sandbox로 전달합니다
const postScreen = (screenDataUri) => {
  sandbox.contentWindow.postMessage(screenDataUri, "*");
};

// closeWindow: 현재 창을 닫습니다
const closeWindow = () => {
  window.close();
};

// postCursorCoordinate: chrome.storage에 저장된 커서 좌표를 sandbox에 전달합니다
const postCursorCoordinate = async () => {
  const { cursorX, cursorY } = await chrome.storage.local.get([
    "cursorX",
    "cursorY",
  ]);
  sandbox.contentWindow.postMessage("cursor/" + cursorX + "/" + cursorY, "*");
};

// handler.js의 launchCycle 입니다
const launchCycle = async () => {
  await setActivityStatus(true);
  await setActivityBadge("on");
  sendReadyMessage();
};

// handler.js의 abortCycle 입니다
const abortCycle = async () => {
  await setActivityStatus(false);
  await setActivityBadge("off");
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

// [[이슈]] 변화하는 윈도우 사이즈에 대한 대응이 필요함
// window.addEventListener("resize", () => {
//   postWindowSize();
// });

///////////////////////////
// chrome event listners //
///////////////////////////

// 종료 메시지 발생 시 abortCycle을 호출합니다
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.key) {
    case "abort":
      abortCycle();
      break;
    case "contentChange":
      setTimeout(captureScreen, 200);
      break;
    default:
      break;
  }
});

// storage에 변경이 발생 시 postCursorCoordinate 함수를 호출합니다
chrome.storage.onChanged.addListener(postCursorCoordinate);
