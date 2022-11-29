////////////////////
// local variable //
////////////////////

/* ongoingCycle: 현재 진행중인 사이클이 있는지 확인합니다 */
let ongoingCycle = false;

////////////////
// core logic //
////////////////

/**
 * chrome.storage에서 작동 상태(true|false)를 불러옵니다
 * @returns {Promise<boolean>} status - Extension activity status
 * @throws {Error} Activity status read error
 */
const getActivityStatus = async () => {
  const { activityStatus } = await chrome.storage.local.get(['activityStatus']);
  if (activityStatus === undefined) return false;
  else if (activityStatus) return JSON.parse(activityStatus);
  else throw new Error('Activity status read error');
};

/**
 * chrome.storage에 activity status를 저장합니다
 * @async
 * @param {boolean} status - Extension activity status
 */
const setActivityStatus = async (status) => {
  if (status === true) {
    await chrome.storage.local.set({ activityStatus: 'true' });
  } else if (status === false) {
    await chrome.storage.local.set({ activityStatus: 'false' });
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

/**
 * chrome.storage에서 현재 활성화된 탭의 아이디를 반환하고, 값이 없는 경우 {@link queryActiveTabId}를 호출합니다
 * @returns {Promise<string>} tabId - Active tab id
 * @returns {string} tabId - Active tab id
 */
const getActiveTabId = async () => {
  const { activeTabId } = await chrome.storage.local.get(['activeTabId']);
  if (activeTabId === undefined) {
    return await queryActiveTabId();
  } else if (activeTabId) {
    return JSON.parse(activeTabId);
  }
};

/**
 * 인자로 받은 탭을 활성화 탭으로 지정하여 chrome.storage에 저장합니다
 * @param {string} tabId - Tab id
 */
const setActiveTabId = async (tabId) => {
  await chrome.storage.local.set({ activeTabId: tabId });
};

/**
 * 지정 탭(tabId)에 메시지를 보낸 뒤 응답 여부를 통해 스크립트 삽입 여부를 확인합니다
 * @param {string} tabId - Tab id
 * @returns {boolean} - Injection status
 */
const checkInjection = async (tabId) => {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { key: 'check' });
    if (response.received === true) {
      return true;
    }
  } catch (err) {
    /// 응답이 없는 경우 에러가 발생합니다 [에러 발생 시 목표 탭의 응답 없음]
    // console.error(err);
    return false;
  }
};

// toggleInjection: 스크립트가 삽입된 지정 탭(tabId)에 command를 보냅니다

/**
 * 스크립트가 삽입된 지정 탭(tabId)에 활성화/비활성화 command를 보냅니다
 * @param {string} tabId - Tab id
 * @param {string} command - Command
 * @returns
 */
const toggleInjection = async (tabId, command) => {
  try {
    const res = await chrome.tabs.sendMessage(tabId, { key: command });
    return res.active;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * handler.html을 기초로 탭을 생성한 뒤 탭 id를 chrome.storage에 저장합니다
 */
const openHandlerTab = async () => {
  try {
    const handlerUrl = chrome.runtime.getURL('handler.html');
    const handlerTab = await chrome.tabs.create({
      url: handlerUrl,
      active: true,
      pinned: true,
    });
    await chrome.storage.local.set({ handlerTabId: handlerTab.id });
  } catch (err) {
    console.error(err);
  }
};

/**
 * chrome.storage의 탭 id를 불러와 탭을 종료한 뒤 {@link setActivityStatus}를 호출해 false로 저장합니다
 */
const closeHandlerTab = async () => {
  try {
    await chrome.runtime.sendMessage({ key: 'abort' });
  } catch (err) {
    await setActivityStatus(false);
    console.error(err);
  }
};

/**
 * 탭 id를 받아 inject.js를 삽입합니다
 * @param {*} targetTabId - Target tab id
 */
const injectScript = async (targetTabId) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: targetTabId },
      files: ['inject.js'],
    });
  } catch (err) {
    console.error(err);
  }
};

/**
 * 탭 id를 기준으로 탭이 연결하는 URL이 확장 프로그램에서 접근 가능한지 확인합니다
 * @param {*} tabId - Tab id
 * @returns {boolean} result - Accessibility result
 */
const checkValidUrlbyId = async (tabId) => {
  try {
    const tab = await chrome.tabs.get(tabId);

    /// 크롬 내장 url(chrome://, chrome-extesion://)은 접근할 수 없습니다
    if (tab.url.includes('chrome://')) return false;
    else if (tab.url.includes('chrome-extension://')) return false;
    else if (!tab.url) return false;
    else return true;
  } catch (err) {
    console.error('Error: Check Valid Url');
    return false;
  }
};

/**
 * 현재 탭의 요소 변경(contentChange)을 handler.js에 알려 이미지를 재생성할 것을 지시합니다
 */
const notifyHandlerContentChange = async () => {
  try {
    const res = await chrome.runtime.sendMessage({ key: 'contentChange' });
  } catch (err) {
    console.error(err);
  }
};

/**
 * ongoingCycle을 true로 바꾼 뒤 600ms 후 false로 바꾸는 timeout을 등록합니다
 */
const setOngoingCycleTrue = () => {
  ongoingCycle = true;
  const changeCycleTimeout = setTimeout(() => {
    ongoingCycle = false;
    clearTimeout(changeCycleTimeout);
  }, 600);
};

/////////////////////
// cycle functions //
/////////////////////

/**
 * 사용자가 프로그램을 토글할 시 발생하는 launchCycle 입니다
 * @returns {undefined} undefined - Escape return
 */
const launchCycle = async () => {
  /// 진행중인 600ms timeout이 존재하면 실행을 멈춥니다
  if (ongoingCycle === true) return;
  setOngoingCycleTrue();

  /// Active tab id를 설정하고 이를 저장합니다
  const targetTabId = await queryActiveTabId();
  await setActiveTabId(targetTabId);

  if ((await checkValidUrlbyId(targetTabId)) === false) return;
  await openHandlerTab();

  /// Active tab의 inject.js 삽입 여부를 확인하고 삽입 시 활성화 메시지를 전달합니다
  if ((await checkInjection(targetTabId)) === false)
    await injectScript(targetTabId);
  await toggleInjection(targetTabId, 'on');

  /// handler.js에 페이지 이미지를 재생성 할 것을 지시합니다
  await notifyHandlerContentChange();

  console.log('sharks🦈-on');
  setTimeout(() => {
    onChangeCycle();
  }, 1000);
};

/**
 * background.js가 종료될 때 호출되는 사이클입니다
 * [1] 활성화 탭 id를 불러옵니다
 * [2] 핸들러 탭을 종료합니다
 * [3] 활성화 탭에 종료 메시지를 전달합니다
 * @returns {undefined} undefined - Escape return
 */
const abortCycle = async () => {
  /// 활성화 탭 아이디를 불러옵니다
  const targetTabId = await getActiveTabId();
  await closeHandlerTab();
  if ((await checkValidUrlbyId(targetTabId)) === false) return;

  /// 활성화 탭에 inject.js 종료를 명령합니다
  await toggleInjection(targetTabId, 'off');

  console.log('sharks🦈-off');
};

/**
 * 사용자 화면 변경(탭 변경, 페이지 리프레시)이 발생할 때 호출되는 사이클 함수입니다
 * @param {string} tabId - Active tab id
 * @returns {undefined} undefined - Escape return
 */
const onChangeCycle = async (tabId) => {
  /// 현재 활성화 상태를 조회합니다
  const activityStatus = await getActivityStatus();
  if (activityStatus === false) return;

  /// 진행중인 DomChangeCycle이 있는 지 확인합니다
  if (ongoingCycle === true) return;
  setOngoingCycleTrue();

  const priorActiveTabId = await getActiveTabId();
  const targetTabId = tabId;

  // 과거 활성화된 탭(priorActiveTabId)와 목표 탭(targetTabId)이 다를 경우 활성화 탭을 바꿉니다
  if (priorActiveTabId != targetTabId) {
    if ((await checkInjection(priorActiveTabId)) === true)
      await toggleInjection(priorActiveTabId, 'off');
    await setActiveTabId(targetTabId);
  }

  // 현재 활성화된 탭의 inject.js 삽입 여부를 체크하고 없다면 삽입합니다
  if ((await checkInjection(targetTabId)) === false) {
    await injectScript(targetTabId);
  }

  // 현재 활성화된 탭의 inject.js에 활성화 메시지를 보냅니다
  await toggleInjection(targetTabId, 'on');
  await notifyHandlerContentChange();

  console.log('sharks🦈-move');
};

/**
 * 사용자 화면의 DOM이 변경되었을 때 발생하는 onDomChangeCycle입니다
 * @returns {undefined} undefined - Escape return
 */
const onDomChangeCycle = async () => {
  if (ongoingCycle === true) return;
  setOngoingCycleTrue();
  await notifyHandlerContentChange();
};

///////////////////////////
// chrome event listners //
///////////////////////////

/**
 * 크롬 확장프로그램이 최초로 켜졌을 때 반응하는 이벤트 리스너입니다
 * activityStatus에 따라 false이면 launchCycle() true이면 abortCyle()를 호출합니다
 */
chrome.action.onClicked.addListener(async (tab) => {
  const activityStatus = await getActivityStatus();
  if (activityStatus === false) launchCycle().catch((err) => {});
  if (activityStatus === true) abortCycle();
});

/**
 * 크롬 내 탭 변경이 이루어 질때 반응하는 이벤트 리스너입니다
 * onUpdated는 페이지 리로드를, onActivated는 탭 변경을 추적합니다
 */
chrome.tabs.onUpdated.addListener(async function (tabId) {
  if ((await checkValidUrlbyId(tabId)) === true) {
    await onChangeCycle(tabId);
  }
});

/**
 * 크롬 내 탭 페이지 리프레시가 발생할 때 반응하는 이벤트 리스너입니다
 */
chrome.tabs.onActivated.addListener(async function (changeInfo) {
  if ((await checkValidUrlbyId(changeInfo.tabId)) === true) {
    await onChangeCycle(changeInfo.tabId);
  }
});

/**
 * 크롬 클라이언트가 최초로 켜졌을 때 반응하는 이벤트 리스너입니다
 * chrome.storage를 빈 공간으로 초기화합니다
 */
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.clear();
  console.log('sharks🦈-initialized');
});

/**
 * 확장 프로그램의 다른 스크립트로부터 메시지를 전달 받습니다
 */
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.key) {
    case 'handlerReady':
      /// handler 탭으로 부터 handlerReady 메시지를 받을 경우 activeTabId를 불러와 해당 탭을 활성화 합니다
      getActiveTabId()
        .then((tabId) => {
          chrome.tabs.update(tabId, { active: true }, () => {});
        })
        .catch((err) => {
          console.error(err);
        });
      break;
    case 'domChange':
      /// DOM 변경이 발생할 때 활성화되는 사이클입니다
      onDomChangeCycle();
      break;
    default:
      break;
  }
  return true;
});
