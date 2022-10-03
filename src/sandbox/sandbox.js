const player = document.getElementById("player");

window.addEventListener("message", (event) => {
  player.srcObject = window.remoteStream;
});
