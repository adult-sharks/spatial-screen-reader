<<<<<<< Updated upstream
const setStatus = (status) => {
=======
////////////////
// core logic //
////////////////

const getActivityStatus = async () => {
  console.log("sharks🦈-1");
  const { activityStatus } = await chrome.storage.local.get(["activityStatus"]);
  if (activityStatus === undefined) return false;
  else if (activityStatus) return JSON.parse(activityStatus);
  else return new Error("Cannot get activity status");
};

const setActivityStatus = async (status) => {
  console.log("sharks🦈-2");
>>>>>>> Stashed changes
  if (status === true) {
    chrome.storage.local.set({ currentStatus: "true" });
  } else if (status === false) {
<<<<<<< Updated upstream
    chrome.storage.local.set({ currentStatus: "false" });
  }
};

const getStatus = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["currentStatus"], ({ currentStatus }) => {
      if (currentStatus === undefined) {
        currentStatus = false;
        resolve(currentStatus);
      } else if (currentStatus) {
        currentStatus = JSON.parse(currentStatus);
        resolve(currentStatus);
      } else {
        reject();
      }
    });
  });
};

const getActiveTabId = () => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length > 0) {
        console.log(tabs);
        resolve(tabs[0].id);
      } else {
        reject();
      }
    });
  });
};

const checkInjection = (id) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(id, { key: "check" }, function (response) {
      if (!response) {
        reject();
      } else if (response.received === true) {
        resolve();
      }
    });
  });
};

const toggleInjection = (id, command) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(id, { key: command }, function (response) {
      if (!response) {
        reject();
      } else if (response.active === true) {
        resolve(true);
      } else if (response.active === false) {
        resolve(false);
      }
    });
  });
=======
    await chrome.storage.local.set({ activityStatus: "false" });
  }
};

const queryActiveTabId = async () => {
  console.log("sharks🦈-3");
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) return tabs[0].id;
  else return new Error("Cannot parse active tab");
};

const getActiveTabId = async () => {
  console.log("sharks🦈-4");
  const { activeTabId } = await chrome.storage.local.get(["activeTabId"]);
  if (activeTabId === undefined) {
    return await queryActiveTabId();
  } else if (activeTabId) {
    return JSON.parse(activeTabId);
  }
};

const setActiveTabId = async (tabId) => {
  console.log("sharks🦈-5");
  await chrome.storage.local.set({ activeTabId: tabId });
};

const checkInjection = async (tabId) => {
  console.log("sharks🦈-6");
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
  console.log("sharks🦈-7");
  try {
    await chrome.tabs.sendMessage(id, { key: command });
  } catch (err) {
    console.error(err);
  }
};

const openHandlerTab = async () => {
  console.log("sharks🦈-8");
  const handlerUrl = chrome.runtime.getURL("./src/handler/handler.html");
  const handlerTab = await chrome.tabs.create({
    url: handlerUrl,
    active: true,
    pinned: true,
  });
  await chrome.storage.local.set({ handlerTabId: handlerTab.id });
};

const closeHandlerTab = async () => {
  console.log("sharks🦈-9");
  try {
    await chrome.runtime.sendMessage({ key: "abort" });
  } catch (err) {
    await setActivityStatus(false);
    console.error(err);
  }
};

const injectScript = async (targetTabId) => {
  console.log("sharks🦈-10");
  await chrome.scripting.executeScript({
    target: { tabId: targetTabId },
    files: ["./src/inject/inject.js"],
  });
};

const launchCycle = async () => {
  console.log("sharks🦈-11");
  const targetTabId = await queryActiveTabId();
  await setActiveTabId(targetTabId);

  await openHandlerTab();
  if ((await checkInjection(targetTabId)) === false)
    await injectScript(targetTabId);
  await toggleInjection(targetTabId, "on");

  console.log("sharks🦈-on");
};

const abortCycle = async () => {
  console.log("sharks🦈-12");
  const targetTabId = await getActiveTabId();
  await closeHandlerTab();
  await toggleInjection(targetTabId, "off");

  console.log("sharks🦈-off");
>>>>>>> Stashed changes
};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.key) {
    case "query":
      getStatus().then((status) => {
        sendResponse({ active: status });
      });
      break;
    case "toggle":
      getStatus().then(async (status) => {
        status = !status;
        setStatus(status);
        const targetTabId = await getActiveTabId();
        if (status === true) {
          try {
            await checkInjection(targetTabId);
          } catch (err) {
            await chrome.scripting.executeScript({
              target: { tabId: targetTabId },
              files: ["./src/inject/inject.js"],
            });
          } finally {
            await toggleInjection(targetTabId, "on");
          }
        } else if (status === false) {
          try {
            await checkInjection(targetTabId);
          } catch {
            await chrome.scripting.executeScript({
              target: { tabId: targetTabId },
              files: ["./src/inject/inject.js"],
            });
          } finally {
            await toggleInjection(targetTabId, "off");
          }
        }
        sendResponse({ clear: true });
      });
      break;
    case "inject":
      break;
  }
  return true;
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.clear();
});
