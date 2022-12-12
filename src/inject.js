/////////////////////
// local variables //
/////////////////////

/**
 * 기존 border값을 저장하는 변수
 */
var prev_border;
var prev_element;
var prev_transition;
var imgOverlay;

/**
 * 커서 컴포넌트
 */

// const cursorUri =
//   'url("data:image/png;base64,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"), auto';
// let css = document.createElement("style");

/**
 * TTS 영역
 */

/**
 * {@link startSpeech}를 지연하기 위한 음성 발생 Timeout 입니다
 */
let readTimeout;
/**
 * {@link onScroll}을 지연하기 위한 Timeout 입니다
 */
let scrollTimeout;

let doneFirstTouch = false;
const koreaRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
const readTimeParam = 600;
const domObserver = new MutationObserver(onDomMutation);
const domObserverConfig = {
  attributes: false,
  childList: true,
  subtree: true,
};

//////////////////
// TTS function //
//////////////////

/**
 * 입력 텍스트와 설정 값을 기준으로 텍스트를 읽어주는 함수입니다
 * @param {*} text - input text for reading
 * @param {*} prop - speechSynthesis option object
 */
function startSpeech(text, prop) {
  abortSpeech();
  restoreBorder();

  const language = koreaRegex.test(text) ? 'ko-KR' : 'en-US';
  const speechContext = new SpeechSynthesisUtterance();
  speechContext.rate = prop.rate || 1;
  speechContext.pitch = prop.pitch || 1;
  speechContext.lang = language;
  speechContext.text = text;
  window.speechSynthesis.startSpeech(speechContext);
}

/**
 * 요소의 경계를 원래대로 되돌립니다
 */
function restoreBorder() {
  if (prev_element != undefined) {
    prev_element.style.boxShadow = prev_border;
    prev_element.style.transition = prev_transition;
  }
}

/**
 * 진행 중인 음성 발생을 취소합니다
 */
function abortSpeech() {
  if (window.speechSynthesis.startSpeeching) {
    window.speechSynthesis.cancel();
  }
}

/**
 * 주어진 노드 리스트에서 유의미한 텍스트를 추출합니다
 * @param {Array} nodeTree - list of node elements
 * @returns response - text response
 */
const extractTextFromTree = (nodeTree) => {
  let text = '';
  let type = '';
  let element = nodeTree[0];

  /// 요소 내 정보가 없다면 반환합니다
  if (element == undefined) {
    return '읽을 수 있는 요소가 없습니다.';
  }

  //border를 변경해줍니다.
  prev_element = element;
  prev_border = element.style.boxShadow;
  prev_transition = element.style.transition;
  element.style.boxShadow = `0px 0px 10px 5px #5e03fc`;
  element.style.transition = `box-shadow 250ms`;

  /// 노드 타입을 확인한 뒤 type을 결정합니다
  switch (element.nodeName) {
    case 'IMG':
    case 'SVG':
      type += 'image ';
      break;
    case 'INPUT':
      type += 'input ';
      break;
  }

  /// 노드가 클릭 가능하거나 링크가 존재하는지 확인합니다
  if (element.getAttribute('onclick') !== null) {
    type += 'button ';
  }
  if (element.getAttribute('href') !== null) {
    type += 'link ';
  }

  /// 노드에서 문자열 데이터를 추출합니다
  /// 최하위 노드에서 시작해서 1개씩 부모 노드로 이동하며 문자열 데이터를 탐색합니다
  for (let i = 0; i < 2; i++) {
    element = nodeTree[i];

    if (element.textContent != '') {
      if (element.textContent[0] != '.') text += element.textContent;
    }
    if (element.getAttribute('aria-label')) {
      text += element.getAttribute('aria-label');
    }
    if (element.getAttribute('alt')) {
      text += element.getAttribute('alt');
    }
    if (text.length > 0) break;
  }
  // [DEBUG] 텍스트 디버깅용 출력
  // console.log(text);
  return type + ' ' + text;
};

/**
 * 커서의 형태를 변경합니다
 */
function changeCursor() {
  css.innerHTML = `*{cursor: ${cursorUri}!important;}`;
  document.body.appendChild(css);
}

/**
 * 커서의 형태를 복구합니다
 */
function resetCursor() {
  if (css != undefined) document.body.removeChild(css);
}

/**
 * 주어진 인자를 커서 값으로 chrome.storage에 저장힙니다
 * @param {*} cursorX - x좌표
 * @param {*} cursorY - y좌표
 */
async function saveCursorPosition(cursorX, cursorY) {
  await chrome.storage.local.set({
    cursorX: cursorX,
    cursorY: cursorY,
  });
}

/**
 * 커서 이동 발생 시 커서 좌표를 저장하고 1초뒤 텍스트를 음성으로 읽어주는 Timeout을 등록, 삭제합니다
 * @param {Event} e - cursor move event
 */
async function onCursorMove(e) {
  /// 기존에 진행중이던 음성을 중지합니다
  abortSpeech();
  restoreBorder();
  clearImageOverlay();

  /// 커서 위치를 저장합니다
  await saveCursorPosition(e.clientX, e.clientY);

  /// Timeout을 삭제하고 새로운 Timeout을 등록합니다
  clearTimeout(readTimeout);
  readTimeout = setTimeout(() => {
    const text = extractTextFromTree(e.path);
    const bbox = getBoundingBox(e.path[0]);
    onItemHighlight(bbox);
    chrome.runtime.sendMessage({
      key: 'onTextExtract',
      content: text,
    });
  }, readTimeParam);
}

/**
 * 터치 이벤트 발생 시 이벤트 핸들러입니다
 * @param {*} e - Touch event object
 * @return {undefined} undefined - Escape Return
 */
function onTouch(e) {
  /// 멀티 터치 인 경우 escape
  if (e.touches.length > 2) return;

  /// 터치 이벤트 전파를 억제합니다
  e.preventDefault();
  e.stopImmediatePropagation();

  /// 한번 터치, 두번 연이은 터치를 나누어 핸들링합니다
  if (!doneFirstTouch) {
    doneFirstTouch = true;

    /// Timeout을 이용해 300ms가 지나면 false로 변경합니다
    setTimeout(() => {
      doneFirstTouch = false;
    }, 300);

    /// 텍스트 추출 후 음성을 발생시킵니다
    const text = extractTextFromTree(e.path);
    startSpeech(text, { rate: 1.0, pitch: 1.0 });
  } else {
    /// 두번 연달아 터치하는 경우
    /// 발생 중인 음성을 종료합니다
    abortSpeech();
    restoreBorder();
    doneFirstTouch = false;

    /// 하이퍼링크를 탐색하고 존재하는 경우 하이퍼링크를 따라 이동합니다
    for (let i = 0; i < e.path.length; i++) {
      if (e.path[i].href) {
        window.location.href = e.path[i].href;
        startSpeech('이동', { rate: 1.0, pitch: 1.0 });
        break;
      }
    }
  }
}

/**
 * 터치 드래그 이벤트 핸들러
 * @param {*} e - touch drag event
 */
function onTouchMove(e) {
  abortSpeech();
  restoreBorder();
  const cursorX = ~~e.touches[0].clientX;
  const cursorY = ~~e.touches[0].clientY;
  saveCursorPosition(cursorX, cursorY);

  // [DEBUG] 커서 좌표 디버깅 용 출력
  // console.log(cursorX, cursorY);
}

/**
 * DOM 변경이 발생할 시 background.js에 'domChange'라는 메시지를 전달합니다
 * @param {Array} mutationList - List of mutations
 * @param {MutationObserver} observer - Observer Instance
 */
function onDomMutation(mutationList, observer) {
  if (mutationList.length > 1) chrome.runtime.sendMessage({ key: 'domChange' });
}

/**
 * 요소 하이라이트 시 바운딩 박스 정보를 메시지를 통해 전달합니다
 * @param {DOMRect} boundingBox - Bouding box object
 */
async function onItemHighlight(boundingBox) {
  if (boundingBox.width < 1000 && boundingBox.height < 1000)
    await chrome.runtime.sendMessage({
      key: 'onItemHighlight',
      value: boundingBox,
    });
}

/**
 * DOM 변경 옵저버를 html 전체 문서에 배치합니다
 */
function deployDomObserver() {
  domObserver.observe(document, domObserverConfig);
}

/**
 * DOM 변경 옵저버를 회수합니다
 */
function displaceDomObserver() {
  domObserver.disconnect();
}

/**
 * 더블 클릭 이벤트 발생시 호출되는 함수입니다
 * @param {Event} e - Click Event
 * @returns {undefined} undefined - Escape return
 */
function onDoubleClick(e) {
  /// 이벤트 길이가 2 이상(멀티 터치)이면 함수를 종료합니다
  if (e.touches.length > 2) return;

  /// 기본 이벤트 전파를 억제합니다
  e.preventDefault();

  /// 노드 트리에 href가 있는지 확인 후 존재하면 이동합니다
  const nodeTree = e.path;
  for (let i = 0; i < nodeTree.length; i++) {
    if (nodeTree[i].href) {
      window.location.href = nodeTree[i].href;
      break;
    }
  }
}

/**
 * 실행중인 디바이스가 터치 디바이스인지 확인합니다
 * @returns {boolean} isTouchDevice - Boolean whether device supports touch
 */
function isTouchDevice() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * 스크롤 이벤트 발생시 호출되는 함수입니다
 * 800ms {@link scrollTimeout}을 설정하여 해당 시간이 소요되면 domChange 메시지를 background.js에 전달합니다
 */
function onScroll() {
  /// 기존에 존재하는 scrollTimeout을 제거합니다
  if (scrollTimeout) clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    chrome.runtime.sendMessage({ key: 'domChange' });
    clearTimeout(scrollTimeout);
  }, 800);
}

/**
 * Image Highlight 시 이미지 오버레이를 생성하는 함수입니다
 */
function setImageOverlay() {
  imgOverlay = document.createElement('img');
  imgOverlay.style.backgroundColor = 'white';
  imgOverlay.style.zIndex = 9999;
  imgOverlay.style.position = 'fixed';
  imgOverlay.style.bottom = '2.5vh';
  imgOverlay.style.right = '2.5vw';
  imgOverlay.style.width = '95vw';
  imgOverlay.style.height = '30vh';
  imgOverlay.style.display = 'none';
  imgOverlay.style.objectFit = 'contain';
  imgOverlay.style.boxShadow = `0px 0px 5px 10px #5e03fc`;
  document.body.appendChild(imgOverlay);
}

/**
 * 이미지 오버레이를 제거하는 함수입니다
 */
function clearImageOverlay() {
  imgOverlay.style.display = 'none';
}

/**
 * 이미지 오버레이의 데이터 소스를 결정하는 함수입니다
 * @param {*} value - baseURI image data
 */
function setImageOverlaySource(value) {
  imgOverlay.src = value;
  imgOverlay.style.display = 'block';
}

function getBoundingBox(element) {
  const bbox = element.getBoundingClientRect();
  return bbox;
}

///////////////////////////
// window event listners //
///////////////////////////

/**
 * 마우스가 움직였을 때 이벤트 리스너({@link onCursorMove})를 등록합니다
 */
function setMouseEventListener() {
  document.removeEventListener('mousemove', onCursorMove);
  document.addEventListener('mousemove', onCursorMove);
}

/**
 * 마우스가 움직였을 때 이벤트 리스너({@link onCursorMove})를 제거합니다
 */
function removeMouseEventListener() {
  document.removeEventListener('mousemove', onCursorMove);
}

/**
 * 터치가 발생할 때 이벤트 리스너({@link onTouch}, {@link onTouchMove}, {@link onDoubleClick})를 등록합니다
 */
function setTouchEventListener() {
  document.removeEventListener('touchstart', onTouch);
  document.addEventListener('touchstart', onTouch, { passive: false });
  document.removeEventListener('touchmove', onTouchMove);
  document.addEventListener('touchmove', onTouchMove);
  document.removeEventListener('contextmenu', onDoubleClick);
  document.addEventListener('contextmenu', onDoubleClick);
}

/**
 * 터치가 발생할 때 이벤트 리스너({@link onTouch}, {@link onTouchMove}, {@link onDoubleClick})를 제거합니다
 */
function removeTouchEventListener() {
  document.removeEventListener('touchstart', onTouch);
  document.removeEventListener('touchmove', onTouchMove);
  document.removeEventListener('contextmenu', onDoubleClick);
}

/**
 * 스크롤 발생 시 이벤트 리스너({@link onScroll})를 등록합니다
 */
function setScrollEventListener() {
  document.removeEventListener('scroll', onScroll);
  document.addEventListener('scroll', onScroll);
}

/**
 * 스크롤 발생 시 이벤트 리스너({@link onScroll})를 제거합니다
 */
function removeScrollEventListener() {
  document.removeEventListener('scroll', onScroll);
}

////////////////
// core logic //
////////////////

/**
 * inject.js의 launchCycle 함수입니다
 * [1] 이벤트 리스너를 등록합니다
 * [2] DOM Observer를 등록합니다
 */
function launchCycle() {
  // changeCursor();
  setMouseEventListener();
  setScrollEventListener();
  if (isTouchDevice()) setTouchEventListener();
  deployDomObserver();
  setImageOverlay();
}

/**
 * inject.js 의 abortCycle 함수입니다
 * [1] 이벤트 리스너를 제거합니다
 * [2] DOM Observer를 해제합니다
 * [3] {@link readTimeout}을 해제합니다
 */
function abortCycle() {
  // resetCursor();
  removeMouseEventListener();
  removeScrollEventListener();
  if (isTouchDevice()) removeTouchEventListener();
  displaceDomObserver();
  clearTimeout(readTimeout);
  abortSpeech();
  restoreBorder();
  clearImageOverlay();
}

///////////////////////////
// chrome event listners //
///////////////////////////

// 확장 프로그램의 다른 스크립트로부터 이벤트를 메시지를 통해 듣습니다
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.key) {
    // background.js 에게 inject.js 가 삽입되었는지의 여부를 알려줍니다.
    case 'check':
      sendResponse({ key: 'response', received: true });
      break;
    // 토클이 되었을 때 launchCycle 함수를 실행합니다.
    case 'on':
      sendResponse({ key: 'response', active: true });
      console.log('inject-toggle-on');
      launchCycle();
      break;
    // 토클이 되었을 때 abortCycle 함수를 실행합니다.
    case 'off':
      sendResponse({ key: 'response', active: false });
      console.log('inject-toggle-off');
      abortCycle();
      break;
    case 'cropDone':
      setImageOverlaySource(message.value);
    default:
      break;
  }
});

function draw() {
  var canvas = document.getElementById('canvas');
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');

    ctx.fillRect(25, 25, 100, 100);
    ctx.clearRect(45, 45, 60, 60);
    ctx.strokeRect(50, 50, 50, 50);
  }
}
