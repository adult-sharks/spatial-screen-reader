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

const notifyInjection = (id) => {
  console.log(id);
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(id, { key: "notify" }, function (response) {
      if (response.active === true) {
        console.log("received");
        resolve();
      } else {
        reject();
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
        if (status === true) {
          const targetTabId = await getActiveTabId();
          await chrome.scripting.executeScript({
            target: { tabId: targetTabId },
            files: ["./src/inject/inject.js"],
          });
          await notifyInjection(targetTabId);
          console.log("injected");
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
