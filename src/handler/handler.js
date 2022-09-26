const player = document.getElementById("player");
const handlerPeer = new Peer({ debug: 2 });

handlerPeer.on("connection", function (conn) {
  conn.on("open", () => {
    conn.send("connected");
    console.log("connected");
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
    player.srcObject = remoteStream;
  });
});

window.addEventListener("load", function () {
  // player.addEventListener("canplay", function () {
  //   this.muted = true;
  //   this.play();
  // });
  // player.srcObject = window.currentStream;
  // player.autoplay = true;
  // player.muted = true;
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.key) {
    case "requestHandlerPeerId":
      console.log(handlerPeer._id);
      sendResponse({ id: handlerPeer._id });
      break;
    default:
      break;
  }
  return true;
});
