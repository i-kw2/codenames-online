(function (global) {
  'use strict';
  const CN = global.Codenames = global.Codenames || {};

  function randomInt(max) {
    if (!Number.isInteger(max) || max <= 0) throw new RangeError('max must be a positive integer');
    const cryptoObj = global.crypto;
    if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
      const range = 0x100000000;
      const limit = range - (range % max);
      const array = new Uint32Array(1);
      let value;
      do {
        cryptoObj.getRandomValues(array);
        value = array[0];
      } while (value >= limit);
      return value % max;
    }
    return Math.floor(Math.random() * max);
  }

  function shuffle(array) {
    const output = array.slice();
    for (let i = output.length - 1; i > 0; i -= 1) {
      const j = randomInt(i + 1);
      [output[i], output[j]] = [output[j], output[i]];
    }
    return output;
  }

  function normalizeWhitespace(value) {
    return String(value == null ? '' : value).normalize('NFKC').trim().replace(/\s+/g, ' ');
  }

  function normalizeArabic(value) {
    return normalizeWhitespace(value)
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
      .replace(/[إأآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/ـ/g, '')
      .toLowerCase();
  }

  function normalizeLatin(value) {
    return normalizeWhitespace(value).toLocaleLowerCase('en');
  }

  function simpleHash(value) {
    let hash = 2166136261;
    const text = String(value);
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function deepClone(value) {
    if (typeof global.structuredClone === 'function') return global.structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function oppositeTeam(team) {
    return team === 'red' ? 'blue' : 'red';
  }

  function safeStorageGet(key, fallback) {
    try {
      const raw = global.localStorage && global.localStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function safeStorageSet(key, value) {
    try {
      if (!global.localStorage) return false;
      global.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function downloadText(filename, text, type) {
    const blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  CN.Utils = {
    randomInt,
    shuffle,
    normalizeWhitespace,
    normalizeArabic,
    normalizeLatin,
    simpleHash,
    deepClone,
    oppositeTeam,
    safeStorageGet,
    safeStorageSet,
    downloadText
  };
})(window);
