////////////////////
// local variable //
////////////////////

/* ongoingCycle: 현재 진행중인 사이클이 있는지 확인합니다 */
let ongoingCycle = false;

////////////////
// core logic //
////////////////

/**
 * chrome.storage에서 작동 상태(true|false)를 불러옵니다
 * @returns {Promise<boolean>} status - Extension activity status
 * @throws {Error} Activity status read error
 */
const getActivityStatus = async () => {
  const { activityStatus } = await chrome.storage.local.get(["activityStatus"]);
  if (activityStatus === undefined) return false;
  else if (activityStatus) return JSON.parse(activityStatus);
  else throw new Error("Activity status read error");
};

/**
 * chrome.storage에 activity status를 저장합니다
 * @async
 * @param {boolean} status - Extension activity status
 */
const setActivityStatus = async (status) => {
  if (status === true) {
    await chrome.storage.local.set({ activityStatus: "true" });
  } else if (status === false) {
    await chrome.storage.local.set({ activityStatus: "false" });
  }
};

/**
 * chrome.tabs를 이용해 현재 활성화된 탭의 아이디(tabId)를 반환합니다
 * @async
 * @returns {Promise<string>} tabId - Active tab id
 * @throws {Error} Tab id parse error
 */
const queryActiveTabId = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) return tabs[0].id;
  else throw new Error("Tab id parse error");
};

// getActiveTabId: chrome.storage에서 acitiveTabId를 불러옵니다
// 값이 undefined일 경우 queryActiveTabId()를 호출합니다
const getActiveTabId = async () => {
  const { activeTabId } = await chrome.storage.local.get(["activeTabId"]);
  if (activeTabId === undefined) {
    return await queryActiveTabId();
  } else if (activeTabId) {
    return JSON.parse(activeTabId);
  }
};

// setActiveTabId: 현재 활성화된 tabId를 chrome.storage에 저장합니다
const setActiveTabId = async (tabId) => {
  await chrome.storage.local.set({ activeTabId: tabId });
};

// checkInjection: 지정 탭(tabId)에 메시지를 보낸 뒤 응답 여부를 통해 스크립트 삽입 여부를 확인합니다
const checkInjection = async (tabId) => {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { key: "check" });
    if (response.received === true) {
      return true;
    }
  } catch (err) {
    return false;
  }
};

// toggleInjection: 스크립트가 삽입된 지정 탭(tabId)에 command를 보냅니다
const toggleInjection = async (tabId, command) => {
  try {
    await chrome.tabs.sendMessage(tabId, { key: command });
  } catch (err) {
    // [이슈] 에러 발생의 원인을 찾을 수 없어 임시로 주석처리
    return false;
    // console.error(err);
  }
};

// openHandlerTab: handler.html을 바탕으로 새로운 탭을 생성합니다
const openHandlerTab = async () => {
  const handlerUrl = chrome.runtime.getURL("handler.html");
  const handlerTab = await chrome.tabs.create({
    url: handlerUrl,
    active: true,
    pinned: true,
  });
  await chrome.storage.local.set({ handlerTabId: handlerTab.id });
};

// closeHandlerTab: handler 탭을 닫으라는 메시지를 전달합니다
const closeHandlerTab = async () => {
  try {
    await chrome.runtime.sendMessage({ key: "abort" });
  } catch (err) {
    await setActivityStatus(false);
    console.error(err);
  }
};

// injectScript: 목표 탭에 tabId를 바탕으로 스크립트를 삽입합니다
const injectScript = async (targetTabId) => {
  await chrome.scripting.executeScript({
    target: { tabId: targetTabId },
    files: ["inject.js"],
  });
};

// checkValidUrlbyId: URL이 현재 창에서 접근 가능한지 확인합니다
const checkValidUrlbyId = async (tabId) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url.includes("chrome://")) return false;
    else if (tab.url.includes("chrome-extension://")) return false;
    else if (!tab.url) return false;
    else return true;
  } catch (err) {
    console.log("check error");
    return false;
  }
};

// notifyHandlerContentChange: contentChange를 handler.js에 알려 이미지를 재생성할 것을 지시합니다
const notifyHandlerContentChange = async () => {
  chrome.runtime.sendMessage({ key: "contentChange" });
};

// setOngoingCycleTrue: ongoingCycle을 true로 바꾼 뒤 600ms 후 false로 바꾸는 timeout을 등록합니다
const setOngoingCycleTrue = () => {
  ongoingCycle = true;
  const changeCycleTimeout = setTimeout(() => {
    ongoingCycle = false;
    clearTimeout(changeCycleTimeout);
  }, 600);
};

/////////////////////
// cycle functions //
/////////////////////

// background.js의 launchCycle 입니다
const launchCycle = async () => {
  if (ongoingCycle === true) return;
  setOngoingCycleTrue();
  const targetTabId = await queryActiveTabId();
  await setActiveTabId(targetTabId);

  if ((await checkValidUrlbyId(targetTabId)) === false) return;
  await openHandlerTab();

  if ((await checkInjection(targetTabId)) === false)
    await injectScript(targetTabId);
  await toggleInjection(targetTabId, "on");
  notifyHandlerContentChange();

  console.log("sharks🦈-on");
};

// background.js의 abortCycle 입니다

const abortCycle = async () => {
  const targetTabId = await getActiveTabId();
  await closeHandlerTab();
  if ((await checkValidUrlbyId(targetTabId)) === false) return;

  await toggleInjection(targetTabId, "off");

  console.log("sharks🦈-off");
};

// background.js의 탭 이동시 발생하는 onChangeCycle 입니다
// 완전히 종료되었는지의 여부를 handler.js 의 activityStatus 변수로 확인합니다

const onChangeCycle = async (tabId) => {
  const activityStatus = await getActivityStatus();
  if (activityStatus === false) return;
  if (ongoingCycle === true) return;
  setOngoingCycleTrue();

  const priorActiveTabId = await getActiveTabId();
  const targetTabId = tabId;

  // 과거 활성화된 탭(priorActiveTabId)와 목표 탭(targetTabId)이 다를 경우 활성화 탭을 바꿉니다
  if (priorActiveTabId != targetTabId) {
    if ((await checkInjection(priorActiveTabId)) === true)
      await toggleInjection(priorActiveTabId, "off");
    await setActiveTabId(targetTabId);
  }

  //
  if ((await checkInjection(targetTabId)) === false) {
    await injectScript(targetTabId);
    // 디버그 목적의 injection 체크
    // console.log("script injected");
  }
  await toggleInjection(targetTabId, "on");
  notifyHandlerContentChange();

  console.log("sharks🦈-move");
};

// DOM이 변경되었을 때 발생하는 onDomChangeCycle입니다
const onDomChangeCycle = () => {
  if (ongoingCycle === true) return;
  setOngoingCycleTrue();
  notifyHandlerContentChange();
};

///////////////////////////
// chrome event listners //
///////////////////////////

// 크롬 확장프로그램이 최초로 켜졌을 때 반응하는 이벤트 리스너입니다
// activityStatus에 따라 false이면 launchCycle() true이면 abortCyle()를 호출합니다
chrome.action.onClicked.addListener(async (tab) => {
  const activityStatus = await getActivityStatus();
  if (activityStatus === false) launchCycle().catch((err) => {});
  if (activityStatus === true) abortCycle();
});

// 크롬 내 탭 변경이 이루어 질때 반응하는 이벤트 리스너입니다
// onUpdated는 페이지 리로드를, onActivated는 탭 변경을 추적합니다

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  if ((await checkValidUrlbyId(tabId)) === true) {
    await onChangeCycle(tabId);
  }
});

chrome.tabs.onActivated.addListener(async function (changeInfo) {
  if ((await checkValidUrlbyId(changeInfo.tabId)) === true) {
    await onChangeCycle(changeInfo.tabId);
  }
});

// 크롬 클라이언트가 최초로 켜졌을 때 반응하는 이벤트 리스너입니다
// chrome.storage를 빈 공간으로 초기화합니다

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.clear();
  console.log("sharks🦈-initialized");
});

// 확장 프로그램의 다른 스크립트로부터 이벤트를 듣습니다

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.key) {
    case "handlerReady":
      // handler 탭으로 부터 handlerReady 메시지를 받을 경우 activeTabId를 불러와 해당 탭을 활성화합니다
      // 이는 처음에 handler 탭이 활성화 되기 때문입니다
      getActiveTabId()
        .then((tabId) => {
          chrome.tabs.update(tabId, { active: true }, () => {});
        })
        .catch((err) => {
          console.error(err);
        });
      break;
    case "domChange":
      onDomChangeCycle();
      break;
    default:
      break;
  }
  return true;
});
