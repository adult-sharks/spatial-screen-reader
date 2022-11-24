/////////////////////
// local variables //
/////////////////////

const sandbox = document.getElementById('sandbox');
const captureIntervalParam = 600;

var screenCaptureInterval;
var previousDataUri;
var cursorX = 0;
var cursorY = 0;

////////////////
// core logic //
////////////////

// setActivityStatus: chrome.storage에 activity 값을 저장합니다
// status: true | false

/**
 * chrome.storage에 activity 값(활성화 상태)를 저장합니다
 * @param {boolean} status - Chrome extension status
 */
const setActivityStatus = async (status) => {
  console.log('toggled');
  if (status === true) {
    await chrome.storage.local.set({ activityStatus: 'true' });
  } else if (status === false) {
    await chrome.storage.local.set({ activityStatus: 'false' });
  }
};

// setActivityBadge: 확장프로그램 아이콘 값을 수정합니다
// status: true | false

/**
 * 확장 프로그램의 아이콘 값을 수정합니다
 * @param {boolean} status - Chrome extension status
 */
const setActivityBadge = async (status) => {
  if (status === true) {
    await chrome.action.setBadgeBackgroundColor({ color: '#e34646' });
    await chrome.action.setBadgeText({ text: 'on' });
  } else if (status === false) {
    await chrome.action.setBadgeBackgroundColor({ color: '#e6e6e6' });
    await chrome.action.setBadgeText({ text: 'off' });
  }
};

/**
 * background.js에 handler가 실행이 준비되었음을 전달합니다
 */
const sendReadyMessage = async () => {
  chrome.runtime.sendMessage({ key: 'handlerReady' });
};

/**
 * 탭 id를 기준으로 탭이 연결하는 URL이 확장 프로그램에서 접근 가능한지 확인합니다
 * @param {*} tabId - Tab id
 * @returns {boolean} result - Accessibility result
 */
const checkValidUrlbyId = async (tabId) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url.includes('chrome://')) return false;
    else if (tab.url.includes('chrome-extension://')) return false;
    else return true;
  } catch (err) {
    console.log('check error');
    return false;
  }
};

/**
 * chrome.tabs를 이용해 현재 활성화된 탭의 아이디(tabId)를 반환합니다
 * @async
 * @returns {Promise<string>} tabId - Active tab id
 * @throws {Error} Tab id parse error
 */
const queryActiveTabId = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) return tabs[0].id;
  else throw new Error('Tab id parse error');
};

// captureScreen: 활성화된 tab의 영역을 캡쳐합니다
// 탭을 이동하는 중에는 chrome.tabs가 비활성화 되므로 이를 확인합니다
// captureVisibleTab은 화면의 dataURI를 생성합니다

/**
 * 활성화된 탭의 tab id를 불러와 사용자 화면을 캡쳐합니다
 * {@link captureVisibleTab}는 화면의 dataURI를 생성합니다
 * {@link resizeDataUri}를 통해 dataURI를 압축합니다
 */
const captureScreen = async () => {
  const activeTabId = await queryActiveTabId();
  const isValidTab = await checkValidUrlbyId(activeTabId);

  // validTab 인지 확인한 뒤 화면은 dataURI로 생성하여 압축 후 전송합니다
  if (isValidTab) {
    const screenDataUri = await chrome.tabs.captureVisibleTab();
    const compressedDataUri = await resizeDataUri(screenDataUri, 500, 500);

    // dataUri가 이전 값과 일치하는 지 확인 후 전송합니다
    if (previousDataUri !== compressedDataUri) postScreen(compressedDataUri);
    previousDataUri = compressedDataUri;
  }
};

/**
 * 입력 크기를 기준으로 이미지 data uri를 압축합니다
 * @param {string} data - input data uri
 * @param {*} width - width of output image
 * @param {*} height - height of output image
 * @returns {Promise<string>} output string - data uri string
 */
const resizeDataUri = (data, width, height) => {
  return new Promise(async function (resolve, reject) {
    const resizeImg = document.createElement('img');

    /// 이미지가 로드되면 호출되는 콜백 함수입니다
    resizeImg.onload = function () {
      const imageHeight = resizeImg.height;
      const imageWidth = resizeImg.width;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(this, 0, 0, width, height);
      const dataURI = canvas.toDataURL();
      resolve('image' + '-' + imageWidth + '-' + imageHeight + '-' + dataURI);
    };

    resizeImg.src = data;
  });
};

/**
 * dataURI로 전달받은 화면 이미지를 sandbox로 전달합니다
 * @param {string} screenDataUri - data string to be passed on
 */
const postScreen = (screenDataUri) => {
  sandbox.contentWindow.postMessage(screenDataUri, '*');
};

/**
 * handler 탭을 종료합니다
 */
const closeWindow = () => {
  window.close();
};

/**
 * chrome.storage에 저장된 커서 좌표를 Web API의 postMessage를 이용해 sandbox에 전달합니다
 */
const postCursorCoordinate = async () => {
  const { cursorX, cursorY } = await chrome.storage.local.get([
    'cursorX',
    'cursorY',
  ]);
  sandbox.contentWindow.postMessage('cursor/' + cursorX + '/' + cursorY, '*');
};

/**
 * handler.js이 실행되면 발생할 launchCycle 입니다
 */
const launchCycle = async () => {
  await setActivityStatus(true);
  await setActivityBadge(true);
  sendReadyMessage();
};

/**
 * handler.js이 종료되면 발생할 abortCycle 입니다
 */
const abortCycle = async () => {
  await setActivityStatus(false);
  await setActivityBadge(false);
  closeWindow();
};

///////////////////////////
// window event listners //
///////////////////////////

/**
 * window에 'load' 발생 후 {@link launchCycle}을 실행
 */
window.addEventListener('load', function () {
  launchCycle();
});

/**
 * window에 'beforeunload' 발생 후 {@link abortCycle}을 실행
 */
window.addEventListener('beforeunload', () => {
  abortCycle();
});

///////////////////////////
// chrome event listners //
///////////////////////////

/**
 * 종료 메시지 발생 시 abortCycle()을 호출합니다
 */
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.key) {
    case 'abort':
      abortCycle();
      break;
    case 'contentChange':
      setTimeout(captureScreen, 200);
      break;
    case 'onTextExtract':
      console.log(message.content);
      sandbox.contentWindow.postMessage('text/' + message.content, '*');
      break;
    default:
      break;
  }
});

/**
 * storage에 변경이 발생 시 postCursorCoordinate 함수를 호출합니다
 */
chrome.storage.onChanged.addListener(postCursorCoordinate);
