export function onReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

export function getPageName() {
  return document.body?.dataset?.page || "unknown";
}
