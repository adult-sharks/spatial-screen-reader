const startStream = () => {
  const url = chrome.runtime.getURL("./src/handler/handler.html");
  const handlerTab = window.open(url);
  console.log(handlerTab);
};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.key) {
    case "notify":
      console.log("injected");
      sendResponse({ active: true });
      break;
    default:
      break;
  }
});
