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
      getStatus.then((status) => {
        setStatus(status);
        if (status === true) {
        }
      });
      break;
    case "inject":
      break;
  }
  return true;
});
