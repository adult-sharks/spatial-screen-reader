////////////////
// core logic //
////////////////

const getActivityStatus = async () => {
  const { activityStatus } = await chrome.storage.local.get(["activityStatus"]);
  if (activityStatus === undefined) return false;
  else if (activityStatus) return JSON.parse(activityStatus);
  else return new Error("Cannot get activity status");
};

const setActivityStatus = async (status) => {
  if (status === true) {
    await chrome.storage.local.set({ activityStatus: "true" });
  } else if (status === false) {
    await chrome.storage.local.set({ activityStatus: "false" });
  }
};

const queryActiveTabId = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    console.log(tabs)
    return tabs[0].id;
  }
  else return new Error("Cannot parse active tab");
};


const getActiveTabId = async () => {
  const { activeTabId } = await chrome.storage.local.get(["activeTabId"]);
  if (activeTabId === undefined) {
    return await queryActiveTabId();
  } else if (activeTabId) {
    return JSON.parse(activeTabId);
  }
};

const setActiveTabId = async (tabId) => {
  await chrome.storage.local.set({ activeTabId: tabId });
};

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

const toggleInjection = async (id, command) => {
  try {
    await chrome.tabs.sendMessage(id, { key: command });
  } catch (err) {
    console.error(err);
  }
};

const openHandlerTab = async () => {
  const handlerUrl = chrome.runtime.getURL("./src/handler/handler.html");
  const handlerTab = await chrome.tabs.create({
    url: handlerUrl,
    active: true,
    pinned: true,
  });
  await chrome.storage.local.set({ handlerTabId: handlerTab.id });
};

const closeHandlerTab = async () => {
  try {
    await chrome.runtime.sendMessage({ key: "abort" });
  } catch (err) {
    await setActivityStatus(false);
    console.error(err);
  }
};

const injectScript = async (targetTabId) => {
  await chrome.scripting.executeScript({
    target: { tabId: targetTabId },
    files: ["./src/inject/inject.js"],
  });
};

const launchCycle = async () => {
  const targetTabId = await queryActiveTabId();
  await setActiveTabId(targetTabId);
  await openHandlerTab();
  if ((await checkInjection(targetTabId)) === false)
    await injectScript(targetTabId);
  await toggleInjection(targetTabId, "on");
  console.log("sharks🦈-on");
};

const abortCycle = async () => {
  const targetTabId = await getActiveTabId();
  await closeHandlerTab();
  await toggleInjection(targetTabId, "off");
  console.log("sharks🦈-off");
};

/*
const changeTab = async () => {
  try {
    const targetTabId = await queryActiveTabId();
    console.log(targetTabId)
    await setActiveTabId(targetTabId);
    if (await chrome.storage.local.get(["activityStatus"]) == true)
      await injectScript(targetTabId);
  }
  catch (err) {
    console.error(err)
  }
}*/


const changeTab = async (tabId) => {
  const activityStatus = await getActivityStatus();
  if (activityStatus == true) {
    const activeTabId = await getActiveTabId();
    const targetTabId = tabId;
    console.log(tabId, activeTabId)
    if (activeTabId != targetTabId) {
      await toggleInjection(activeTabId, "off");
      await setActiveTabId(targetTabId);
      await injectScript(targetTabId);
      await toggleInjection(targetTabId, "on");
    }
    else {
      if ((await checkInjection(targetTabId)) === false)
        await injectScript(targetTabId);
      await toggleInjection(targetTabId, "on");
    }
  }
}


chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  await changeTab(tabId);
})


chrome.tabs.onActivated.addListener(async function (changeInfo, tab) {
  await changeTab(changeInfo.tabId);
})
///////////////////////////
// chrome event listners //
///////////////////////////

chrome.action.onClicked.addListener(async (tab) => {
  const activityStatus = await getActivityStatus();
  if (activityStatus === false) launchCycle().catch((err) => { });
  if (activityStatus === true) abortCycle();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.clear();
  console.log("sharks🦈-initialized");
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.key) {
    case "handlerReady":
      getActiveTabId()
        .then((tabId) => {
          chrome.tabs.update(tabId, { active: true }, () => { });
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