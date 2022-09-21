const setStatus = (status) => {
  if (status === true) {
    chrome.storage.local.set({ currentStatus: "false" });
  } else if (status === false) {
    chrome.storage.local.set({ currentStatus: "true" });
  }
};

const createGetStatus = () => {
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

const getActiveTabId = new Promise((resolve, reject) => {
  chrome.tabs.query({ active: true }, function (tabs) {
    if (tabs) {
      resolve(tabs[0].id);
    } else {
      reject();
    }
  });
});

const runStream = () => {};

// https://stackoverflow.com/questions/44056271/chrome-runtime-onmessage-response-with-async-await

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  const getStatus = createGetStatus();

  switch (message.key) {
    case "query":
      getStatus.then((status) => {
        console.log("sending message");
        sendResponse({ active: status });
      });
      break;
    case "toggle":
      getStatus.then(async (status) => {
        setStatus(status);
        if (status === true) {
          const targetTabId = await getActiveTabId;
          chrome.scripting.executeScript({
            target: { tabId: targetTabId },
            files: ["./src/inject/inject.js"],
          });
        }
      });
      break;
    case "inject":
      break;
  }
  return true;
});
