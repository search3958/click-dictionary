const DICT_KEY = "dictionaryWords";
const wordList = document.getElementById("wordList");
const empty = document.getElementById("empty");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");

init();

async function init() {
  await render();

  exportBtn.addEventListener("click", exportJson);
  clearBtn.addEventListener("click", clearAll);
}

async function getWords() {
  const data = await chrome.storage.sync.get(DICT_KEY);
  return Array.isArray(data[DICT_KEY]) ? data[DICT_KEY] : [];
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

      const word = document.createElement("div");
      word.className = "word";
      word.textContent = entry.word;

      const meta = document.createElement("div");
      meta.className = "meta";
      const d = entry.addedAt ? new Date(entry.addedAt).toLocaleString() : "";
      const src = entry.pageUrl || "";
      meta.textContent = `${d} ${src}`.trim();

      const actions = document.createElement("div");
      actions.className = "item-actions";
      const del = document.createElement("button");
      del.textContent = "削除";
      del.addEventListener("click", async () => {
        await removeWord(entry.word);
      });
      actions.appendChild(del);

      li.append(word, meta, actions);
      wordList.appendChild(li);
    });
}

async function removeWord(target) {
  const words = await getWords();
  const filtered = words.filter((w) => w.word !== target);
  await chrome.storage.sync.set({ [DICT_KEY]: filtered });
  await render();
}

async function clearAll() {
  const ok = window.confirm("辞書を全部削除するで。ほんまにええ？");
  if (!ok) return;
  await chrome.storage.sync.set({ [DICT_KEY]: [] });
  await render();
}

async function exportJson() {
  const words = await getWords();
  const blob = new Blob([JSON.stringify(words, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `click-dictionary-${new Date().toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
