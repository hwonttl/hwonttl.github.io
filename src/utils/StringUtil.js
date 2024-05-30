export const utf8ToBase64 = (str) => {
    return window.btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  };
  
export const base64ToUtf8 = (str) => {
    str = str
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    return decodeURIComponent(escape(window.atob(str)));
  };