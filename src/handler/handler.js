/////////////////////
// local variables //
/////////////////////

const player = document.getElementById("player");
const handlerPeer = new Peer({ debug: 2 });
let screenStream;

handlerPeer.on("connection", function (conn) {
  conn.on("open", () => {
    conn.send("connected");
  });
  conn.on("data", (data) => {
    if (data === "connected") {
      getStream();
    }
  });
});

handlerPeer.on("call", (call) => {
  call.answer();
  call.on("stream", (remoteStream) => {
    screenStream = remoteStream;
    player.srcObject = remoteStream;
  });
});

///////////////////////////
// window event listners //
///////////////////////////

window.addEventListener("load", function () {
  player.addEventListener("canplay", function () {
    this.muted = true;
    this.play();
  });
  player.srcObject = screenStream;
});

window.addEventListener("beforeunload", () => {
  chrome.storage.local.set({ currentStatus: "false" });
});

///////////////////////////
// chrome event listners //
///////////////////////////

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.key) {
    case "requestHandlerPeerId":
      sendResponse({ id: handlerPeer._id });
      break;
    default:
      break;
  }
  return true;
});
