/* eslint-disable @typescript-eslint/no-unsafe-call */
import { useCallback } from 'react';
import { useCookies } from 'react-cookie';

export function useUserIdCookie(): [string, (value: string, options?: any) => void, () => void] {
  const key = 'userId';
  const [cookie, setCookie, removeCookie] = useCookies([key]);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const userIdCookieValue = cookie[key] as string;
  const setUserIdCookie = useCallback(
    (value: string, options?: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setCookie(key, value, options);
    },
    [setCookie]
  );
  const removeUserIdCookie = useCallback(() => {
    removeCookie(key);
  }, [removeCookie]);

  return [userIdCookieValue, setUserIdCookie, removeUserIdCookie];
}
