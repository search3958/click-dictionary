const DICT_KEY = "dictionaryWords";
const wordList = document.getElementById("wordList");
const empty = document.getElementById("empty");
const contextMenu = document.getElementById("contextMenu");
const deleteBtn = document.getElementById("deleteBtn");

let selectedWord = null;

init();

async function init() {
  await render();

  deleteBtn.addEventListener("click", async () => {
    if (!selectedWord) return;
    await removeWord(selectedWord);
    closeContextMenu();
  });

  document.addEventListener("click", () => closeContextMenu());
  document.addEventListener("scroll", () => closeContextMenu());
  document.addEventListener("contextmenu", (e) => {
    if (!e.target.closest(".item")) {
      closeContextMenu();
    }
  });
}

async function getWords() {
  const data = await chrome.storage.sync.get(DICT_KEY);
  return Array.isArray(data[DICT_KEY]) ? data[DICT_KEY] : [];
}

async function setWords(words) {
  await chrome.storage.sync.set({ [DICT_KEY]: words });
}

function getMemo(entry) {
  if (typeof entry.memo === "string") return entry.memo;
  if (Array.isArray(entry.memos) && entry.memos.length > 0) {
    return String(entry.memos[0] || "");
  }
  return "";
}

async function render() {
  const words = await getWords();
  wordList.innerHTML = "";

  if (words.length === 0) {
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  words
    .slice()
    .reverse()
    .forEach((entry) => {
      const li = document.createElement("li");
      li.className = "item";
      li.dataset.word = entry.word;

      const word = document.createElement("div");
      word.className = "word";
      word.textContent = entry.word;

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = entry.pageUrl || "";

      const memoInput = document.createElement("input");
      memoInput.className = "memo-input";
      memoInput.type = "text";

      const memo = getMemo(entry).trim();
      if (memo) {
        memoInput.value = memo;
      } else {
        memoInput.placeholder = "メモを入力...";
      }

      memoInput.addEventListener("keydown", async (e) => {
        if (e.key !== "Enter") return;
        const text = memoInput.value.trim();
        if (!text) return;
        await setMemo(entry.word, text);
      });

      memoInput.addEventListener("blur", async () => {
        const text = memoInput.value.trim();
        if (!text) return;
        await setMemo(entry.word, text);
      });

      li.append(word, meta, memoInput);

      li.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        selectedWord = entry.word;
        openContextMenu(e.clientX, e.clientY);
      });

      wordList.appendChild(li);
    });
}

async function setMemo(targetWord, memoText) {
  const words = await getWords();
  const next = words.map((w) => {
    if (w.word !== targetWord) return w;
    const { memos, ...rest } = w;
    return { ...rest, memo: memoText };
  });
  await setWords(next);
  await render();
}

function openContextMenu(x, y) {
  const maxX = window.innerWidth - 130;
  const maxY = window.innerHeight - 50;
  contextMenu.style.left = `${Math.max(4, Math.min(x, maxX))}px`;
  contextMenu.style.top = `${Math.max(4, Math.min(y, maxY))}px`;
  contextMenu.hidden = false;
}

function closeContextMenu() {
  contextMenu.hidden = true;
  selectedWord = null;
}

async function removeWord(target) {
  const words = await getWords();
  const filtered = words.filter((w) => w.word !== target);
  await setWords(filtered);
  await render();
}
