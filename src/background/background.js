const setStatus = (status) => {
  if (status === true) {
    chrome.storage.local.set({ currentStatus: "true" });
  } else if (status === false) {
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
