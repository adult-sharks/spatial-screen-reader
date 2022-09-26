const player = document.getElementById("player");
const handlerPeer = new Peer({ debug: 2 });

// handlerPeer.on("call", function (call) {
//   call.on("stream", function (stream) {
//     console.log(stream);
//     player.srcObject = stream;
//   });
// });

handlerPeer.on("connection", function (conn) {
  conn.on("data", (data) => {
    console.log(data);
  });
  conn.on("open", () => {
    conn.send("hello!");
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
