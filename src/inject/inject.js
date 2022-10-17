/////////////////////
// local variables //
/////////////////////

// 커서 컴포넌트  
var cursorUri =
  'url("data:image/png;base64,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"), auto';
var css = document.createElement("style");

// TTS 컴포넌트 
// Korean REGEX to check whether Korean
var korean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
// TTS 지연을 위해 설정한 타이머입니다.
var timer;


////////////////////////////
// ==== TTS function ==== //
////////////////////////////
// TTS 기능을 지원합니다.
function speak(text, opt_prop) {
  // if reading, cancel TTS
  window.speechSynthesis.cancel();
  const prop = opt_prop || {};
  const speechMsg = new SpeechSynthesisUtterance();
  speechMsg.rate = prop.rate || 1;
  speechMsg.pitch = prop.pitch || 1;
  speechMsg.lang = prop.lang || "ko-KR";
  speechMsg.text = text;
  window.speechSynthesis.speak(speechMsg);
}

// hover 했을 때 last element 의 text 내용을 불러옵니다.
var elementToSpeech = function () {
  let elems = document.querySelectorAll(":hover");
  if (elems[elems.length - 1] != undefined) {
    var text = null;

    if (elems[elems.length - 1].textContent != "") {
      var text = elems[elems.length - 1].textContent;
    } else if (elems[elems.length - 1].nodeName == "IMG") {
      if (elems[elems.length - 1].attributes.getNamedItem("alt")) {
        var text =
          "image: " +
          elems[elems.length - 1].attributes.getNamedItem("alt").value;
      } else {
        var text = "image";
      }
    }
  }
  // Check KR/EN and content existence
  if (text) {
    if (korean.test(text)) {
      speak(text, { rate: 0.8, pitch: 0.8, lang: "ko-KR" });
    } else {
      speak(text, { rate: 0.8, pitch: 0.8, lang: "en-US" });
    }
  } else {
    // speak("There is no text", { rate: 1, pitch: 1.2, lang: "en-US" })
  }
};



// ==== Cursor function ==== //
// 커서를 세팅해줍니다.
const changeCursor = () => {
  // add CSS of Cursor
  css.innerHTML = `*{cursor: ${cursorUri}!important;}`;
  document.body.appendChild(css);
};
// 커서 CSS 를 리셋합니다.
const resetCursor = () => {
  if (css != undefined) document.body.removeChild(css);
};


// 마우스가 움직였을 때 리스너에서 호출되는 call back 함수로 마우스 좌표를 세팅하고 TTS 를 실행합니다.
const logKey = async (e) => {
  // Set timer 1000ms
  // When 'logKey()' is not overwritten, elementToSpeech is called after 1s
  // Clear timer when function is called
  clearTimeout(timer);
  timer = setTimeout(elementToSpeech, 1000);
  // Get client window size
  // Pass it to chrome local storage
  let mx = e.screenX;
  let my = e.screenY;
  await chrome.storage.local.set({ mouseX: mx, mouseY: my });
  //  Cancel if there is running TTS
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
};


// ==== COMMUNICATION 컴포넌트 ==== //
///////////////////////////
// window event listners //
///////////////////////////
// 마우스가 움직였을 때 반응하는 이벤트 리스터로 logkey 함수를 실행합니다. 
const mouseEventListener = () => {
  document.removeEventListener("mousemove", logKey);
  document.addEventListener("mousemove", logKey);
};



////////////////
// core logic //
////////////////
// inject.js 의 StartCycle 함수입니다.
const startCycle = () => {
  console.log("mouse on");
  changeCursor();
  mouseEventListener();
};

// inject.js 의 soptCycle 함수입니다.
const stopCycle = () => {
  console.log("mouse off");
  document.removeEventListener("mousemove", logKey);
  clearTimeout(timer);
  resetCursor();
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
};



///////////////////////////
// chrome event listners //
///////////////////////////
// 확장 프로그램의 다른 스크립트로부터 이벤트를 듣습니다
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.key) {
    // background.js 에게 inject.js 가 삽입되었는지의 여부를 알려줍니다.
    case "check":
      sendResponse({ received: true });
      break;
    // 토클이 되었을 때 startCycle 함수를 실행합니다.
    case "on":
      sendResponse({ active: true });
      console.log("inject-toggle-on");
      startCycle();
      break;
    case "off":
      // 토클이 되었을 때 stopCycle 함수를 실행합니다.
      sendResponse({ active: false });
      console.log("inject-toggle-off");
      stopCycle();
      break;
    default:
      break;
  }
});
