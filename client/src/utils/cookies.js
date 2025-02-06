export const getCookie = (name) => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split('=');
    if (cookieName.trim() === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
};

export const getUserFromCookies = () => {
  const userCookie = getCookie('user');
  if (userCookie) {
    try {
      return JSON.parse(userCookie);
    } catch (e) {
      console.error('Error parsing user cookie:', e);
    }
  }
  return null;
};

export const getAuthFromCookies = () => {
  const authCookie = getCookie('auth');
  if (authCookie) {
    try {
      return JSON.parse(decodeURIComponent(authCookie));
    } catch (e) {
      console.error('Error parsing auth cookie:', e);
    }
  }
  return null;
};