const PARENT_MENU_ID = "click-dictionary-root";
const ADD_MENU_ID = "click-dictionary-add";
const DICT_KEY = "dictionaryWords";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: PARENT_MENU_ID,
      title: "拡張辞書",
      contexts: ["selection", "page", "action"]
    });

    chrome.contextMenus.create({
      id: ADD_MENU_ID,
      parentId: PARENT_MENU_ID,
      title: "辞書に追加: '%s'",
      contexts: ["selection"]
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== ADD_MENU_ID) return;

  const selected = (info.selectionText || "").trim();
  if (!selected) return;

  const normalized = selected.replace(/\s+/g, " ");
  const data = await chrome.storage.sync.get(DICT_KEY);
  const words = Array.isArray(data[DICT_KEY]) ? data[DICT_KEY] : [];

  const exists = words.some((w) => w.word === normalized);
  if (exists) {
    notify("Click Dictionary", `すでに登録済み: ${normalized}`);
    return;
  }

  words.push({
    word: normalized,
    addedAt: new Date().toISOString(),
    pageTitle: tab?.title || "",
    pageUrl: tab?.url || ""
  });

  await chrome.storage.sync.set({ [DICT_KEY]: words });
  notify("Click Dictionary", `追加したで: ${normalized}`);
});

function notify(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/logo.png",
    title,
    message
  });
}
