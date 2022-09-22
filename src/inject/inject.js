const startStream = () => {
  const url = chrome.runtime.getURL("./src/handler/handler.html");
  const handlerTab = window.open(url);
  console.log(handlerTab);
};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.key) {
    case "notify":
      console.log("injected");
    case "check":
      sendResponse({ received: true });
      break;
    case "on":
      sendResponse({ active: true });
      console.log("toggle-on");
      startStream();
      break;
    case "off":
      sendResponse({ active: false });
      console.log("toggle-off");
      stopStream();
      break;
    default:
      break;
  }
});
