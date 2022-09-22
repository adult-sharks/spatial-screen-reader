const toggleBtn = document.getElementById("toggle-btn");
const statusMessage = document.getElementById("status-p");
const toggleMessage = document.getElementById("toggle-p");

const initializeWindow = async () => {
  statusMessage.innerText = "loading";
  // chrome.storage.local.clear(); // only for test purpose
};

// const sendStreamToHandler = (mediaStream, handlerTab) => {
//   if (!mediaStream) {
//     console.error(
//       "Error starting tab capture: " +
//         (chrome.runtime.lastError.message || "UNKNOWN")
//     );
//     return;
//   }
//   if (handlerTab != null) {
//     handlerTab.close();
//   }
//   chrome.tabs.create({
//     url: chrome.extension.getURL("./src/handler/handler.html"),
//     selected: true,
//   });
//   // handlerTab = window.open("./src/handler/handler.html");
//   // handlerTab.currentStream = mediaStream;
// };

// const startStream = () => {
//   // const { h, w } = getSize();
//   const handlerTab = null;

//   chrome.tabCapture.capture(
//     {
//       audio: false,
//       video: true,
//     },
//     (mediaStream) => {
//       sendStreamToHandler(mediaStream, handlerTab);
//     }
//   );
//   chrome.tabs.create({
//     url: chrome.extension.getURL("./src/handler/handler.html"),
//     selected: true,
//   });
// };

const sendQuery = () => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ key: "query" }, function (response) {
      if (response.active === true) {
        console.log("is on");
        statusMessage.innerText = "active";
        toggleMessage.innerText = "off";
        // startStream();
        resolve();
      } else if (response.active === false) {
        console.log("is off");
        statusMessage.innerText = "inactive";
        toggleMessage.innerText = "on";
        resolve();
      } else {
        statusMessage.innerText = "error";
        toggleMessage.innerText = "invalid";
        reject();
      }
    });
  });
};

const toggleStream = () => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ key: "toggle" }, function (response) {
      if (response.clear) {
        resolve();
      } else {
        reject();
      }
    });
  });
};

const addToggleListener = () => {
  toggleBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    await toggleStream();
    await sendQuery();
  });
};

window.addEventListener("DOMContentLoaded", async (e) => {
  e.preventDefault();
  await initializeWindow();
  await sendQuery();
  addToggleListener();
});
