////////////////
// core logic //
////////////////

// getActivityStatus: chrome.storage에서 작동 상태(true|false)를 불러옵니다
// 불러온 값이 undefined 일 경우 false를 리턴합니다

const getActivityStatus = async () => {
  const { activityStatus } = await chrome.storage.local.get(["activityStatus"]);
  if (activityStatus === undefined) return false;
  else if (activityStatus) return JSON.parse(activityStatus);
  else return new Error("Cannot get activity status");
};

// setActivityStatus: chrome.storage에 작동 상태(true|false)를 저장합니다

const setActivityStatus = async (status) => {
  if (status === true) {
    await chrome.storage.local.set({ activityStatus: "true" });
  } else if (status === false) {
    await chrome.storage.local.set({ activityStatus: "false" });
  }
};

// queryActiveTabId: chrome.tabs를 이용해 현재 활성화된 탭의 아이디(tabId)를 반환합니다

const queryActiveTabId = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) return tabs[0].id;
  else return new Error("Cannot parse active tab");
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
    console.error(err);
  }
};

// openHandlerTab: handler.html을 바탕으로 새로운 탭을 생성합니다

const openHandlerTab = async () => {
  const handlerUrl = chrome.runtime.getURL("./src/handler/handler.html");
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
    files: ["./src/inject/inject.js"],
  });
};

// background.js의 launchCycle 입니다

const launchCycle = async () => {
  const targetTabId = await queryActiveTabId();
  await setActiveTabId(targetTabId);

  await openHandlerTab();
  if ((await checkInjection(targetTabId)) === false)
    await injectScript(targetTabId);
  await toggleInjection(targetTabId, "on");

  console.log("sharks🦈-on");
};

// background.js의 abortCycle 입니다

const abortCycle = async () => {
  const targetTabId = await getActiveTabId();
  await closeHandlerTab();
  await toggleInjection(targetTabId, "off");

  console.log("sharks🦈-off");
};

const changeTab = async (tabId) => {
  const activityStatus = await getActivityStatus();
  if (activityStatus == true) {
    const activeTabId = await getActiveTabId();
    const targetTabId = tabId;
    console.log(tabId, activeTabId);
    if (activeTabId != targetTabId) {
      await toggleInjection(activeTabId, "off");
      await setActiveTabId(targetTabId);
      if ((await checkInjection(targetTabId)) === false)
        await injectScript(targetTabId);
      await toggleInjection(targetTabId, "on");
    } else {
      if ((await checkInjection(targetTabId)) === false)
        await injectScript(targetTabId);
      await toggleInjection(targetTabId, "on");
    }
  }
};

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  await changeTab(tabId);
});

chrome.tabs.onActivated.addListener(async function (changeInfo, tab) {
  await changeTab(changeInfo.tabId);
});

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
    default:
      break;
  }
  return true;
});
