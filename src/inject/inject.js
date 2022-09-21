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
