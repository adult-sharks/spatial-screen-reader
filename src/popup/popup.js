/////////////////////
// local variables //
/////////////////////

const toggleBtn = document.getElementById("toggle-btn");
const statusMessage = document.getElementById("status-p");
const toggleMessage = document.getElementById("toggle-p");

////////////////
// core logic //
////////////////

const initializeWindow = async () => {
  statusMessage.innerText = "loading";
};

const sendQuery = () => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ key: "query" }, function (response) {
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

///////////////////////////
// window event listners //
///////////////////////////

window.addEventListener("DOMContentLoaded", async (e) => {
  e.preventDefault();
  await initializeWindow();
  await sendQuery();
  addToggleListener();
});
