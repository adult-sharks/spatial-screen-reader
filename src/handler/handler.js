var h;
var w;
var timer;
var screenInterval;

const xc = document.getElementById("xc");
const yc = document.getElementById("yc");
const vol = document.getElementById("vol");

const readLocalStorage = async (key) => {
  return new Promise((resolve, reject) => {
  	chrome.storage.local.get([key], function(result) {
    	if (result[key] == undefined){
      	reject();
      } else {
        resolve(result[key]);
      }
    });
  });
};

const edgeDetection = (player, streamCanvas) => {
  player.style.display = "none";
  streamCanvas.style.display = "none";

  screenInterval = setInterval(() => {
		var canvasContext = streamCanvas.getContext("2d");
		var src = cv.imread("streamCanvas");
		let ksize = new cv.Size(10, 10);
		let anchor = new cv.Point(-1, -1);

		canvasContext.drawImage(
			player, 
			(streamCanvas.width - player.videoWidth) / 2, 
			(streamCanvas.height - player.videoHeight) / 2
		);

		cv.cvtColor(src, src, cv.COLOR_RGB2GRAY, 0);
		cv.Canny(src, src, 30, 100, 5, false);
		cv.blur(src, src, ksize, anchor, cv.BORDER_DEFAULT);
		cv.imshow("edgeDetectionCanvas", src);
		src.delete();
  }, 100);
};

const canvasModule = async (player) => {
	var streamCanvas = document.getElementById("streamCanvas");
	var edgeDetectionCanvas = document.getElementById("edgeDetectionCanvas");

	h = await readLocalStorage("windowHeight");
	w = await readLocalStorage("windowWidth");

	streamCanvas.setAttribute("height", h);
	streamCanvas.setAttribute("width", w);
	edgeDetectionCanvas.setAttribute("height", h);
	edgeDetectionCanvas.setAttribute("width", w);

	edgeDetection(player, streamCanvas)
};

const getCoordinateData = () => {  
  chrome.storage.local.get(["mouseX", "mouseY"], function(result) {
		var mx = result.mouseX;
		var my = result.mouseY;
		var output = document.getElementById("edgeDetectionCanvas");

		let c = output.getContext("2d");
		let p = c.getImageData(mx, my, 1, 1).data;
		let brightness = p[0] ? p[0] : 1;

		xc.innerText = mx.toString();
		yc.innerText = my.toString();
		vol.innerText = brightness.toString();

		setVolume(brightness, my);
		
		clearTimeout(timer);
		timer = setTimeout(() => {
			setVolume(1, my)
		}, 1000);
  });
};

window.addEventListener("load", async (e) => {
    var player = document.getElementById("player");

    player.srcObject = window.currentStream;
    player.addEventListener("canplay", async (e) => {
        e.muted = true;
        e.play();
    });

    await canvasModule(player);
    chrome.storage.onChanged.addListener(getCoordinateData);
});
  