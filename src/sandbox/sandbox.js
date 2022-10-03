var h;
var w;

const imageContainer = document.getElementById("output");

const canvasModule = async() => {
  const output = document.getElementById("edgeDetectionCanvas");

  h = 700; // windowHeight
  w = 1000; // windowWidth
  
  output.setAttribute("height", h);
  output.setAttribute("width", w);
};

window.addEventListener("message", (event) => { 
  if (event.data) {
    imageContainer.src = event.data;
  
    const src = cv.imread(imageContainer);
    let ksize = new cv.Size(10, 10);
    let anchor = new cv.Point(-1, -1);

    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    cv.Canny(src, src, 30, 100, 5, false);
    cv.blur(src, src, ksize, anchor, cv.BORDER_DEFAULT);
    cv.imshow("edgeDetectionCanvas", src);

    src.delete();
    console.log("hello");
  }
  imageContainer.style.display = "none";
});

window.addEventListener("load", () => {
  canvasModule();
  //chrome.storage.onChanged.addListener(getCoordinateData);
});