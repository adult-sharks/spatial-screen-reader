const imageContainer = document.getElementById("output");
let streamImage;

window.addEventListener("message", (event) => {
  streamImage = event.data;
  if (streamImage) {
    imageContainer.src = streamImage;
  }
});
