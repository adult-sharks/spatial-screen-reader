const toggleBtn = document.getElementById("toggle-btn");
const statusMessage = document.getElementById("status-p");
const toggleMessage = document.getElementById("toggle-p");

const initializeWindow = async () => {
  statusMessage.innerText = "loading";
  await chrome.storage.local.clear();
};

const sendQuery = () => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ key: "query" }, function (response) {
      console.log("getting message");
      if (response.active === true) {
        console.log("is on");
        statusMessage.innerText = "active";
        toggleMessage.innerText = "off";
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

const toggleStream = async () => {
  await chrome.runtime.sendMessage({ key: "toggle" });
};

const addToggleListener = () => {
  toggleBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    await sendQuery();
    // sendMessage는 콜백함수가 주어지지 않으면 Promise를 반환합니다.
    await toggleStream();
  });
};

window.addEventListener("DOMContentLoaded", async (e) => {
  e.preventDefault();
  await initializeWindow();
  await sendQuery();
  addToggleListener();
});
