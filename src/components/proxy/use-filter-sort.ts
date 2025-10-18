import { useEffect, useMemo, useReducer } from "react";

import { useVerge } from "@/hooks/use-verge";
import delayManager from "@/services/delay";

// default | delay | alphabet
export type ProxySortType = 0 | 1 | 2;

export default function useFilterSort(
  proxies: IProxyItem[],
  groupName: string,
  filterText: string,
  sortType: ProxySortType,
) {
  const { verge } = useVerge();
  const favoriteProxies = verge?.favorite_proxies || [];
  const [_, bumpRefresh] = useReducer((count: number) => count + 1, 0);

  useEffect(() => {
    let last = 0;

    delayManager.setGroupListener(groupName, () => {
      // 简单节流
      const now = Date.now();
      if (now - last > 666) {
        last = now;
        bumpRefresh();
      }
    });

    return () => {
      delayManager.removeGroupListener(groupName);
    };
  }, [groupName]);

  return useMemo(() => {
    const fp = filterProxies(proxies, groupName, filterText);
    const sp = sortProxies(fp, groupName, sortType, favoriteProxies);
    return sp;
  }, [proxies, groupName, filterText, sortType, favoriteProxies]);
}

export function filterSort(
  proxies: IProxyItem[],
  groupName: string,
  filterText: string,
  sortType: ProxySortType,
  favoriteProxies: string[] = [],
) {
  const fp = filterProxies(proxies, groupName, filterText);
  const sp = sortProxies(fp, groupName, sortType, favoriteProxies);
  return sp;
}

/**
 * 可以通过延迟数/节点类型 过滤
 */
const regex1 = /delay([=<>])(\d+|timeout|error)/i;
const regex2 = /type=(.*)/i;

/**
 * filter the proxy
 * according to the regular conditions
 */
function filterProxies(
  proxies: IProxyItem[],
  groupName: string,
  filterText: string,
) {
  if (!filterText) return proxies;

  const res1 = regex1.exec(filterText);
  if (res1) {
    const symbol = res1[1];
    const symbol2 = res1[2].toLowerCase();
    const value =
      symbol2 === "error" ? 1e5 : symbol2 === "timeout" ? 3000 : +symbol2;

    return proxies.filter((p) => {
      const delay = delayManager.getDelayFix(p, groupName);

      if (delay < 0) return false;
      if (symbol === "=" && symbol2 === "error") return delay >= 1e5;
      if (symbol === "=" && symbol2 === "timeout")
        return delay < 1e5 && delay >= 3000;
      if (symbol === "=") return delay == value;
      if (symbol === "<") return delay <= value;
      if (symbol === ">") return delay >= value;
      return false;
    });
  }

  const res2 = regex2.exec(filterText);
  if (res2) {
    const type = res2[1].toLowerCase();
    return proxies.filter((p) => p.type.toLowerCase().includes(type));
  }

  return proxies.filter((p) => p.name.includes(filterText.trim()));
}

/**
 * sort the proxy
 */
function sortProxies(
  proxies: IProxyItem[],
  groupName: string,
  sortType: ProxySortType,
  favoriteProxies: string[] = [],
) {
  if (!proxies) return [];

  const list = proxies.slice();

  // 先按收藏状态分组
  const favorites: IProxyItem[] = [];
  const regular: IProxyItem[] = [];

  list.forEach((proxy) => {
    if (favoriteProxies.includes(proxy.name)) {
      favorites.push(proxy);
    } else {
      regular.push(proxy);
    }
  });

  // 对收藏和非收藏分别排序
  const sortFn = (arr: IProxyItem[]) => {
    if (sortType === 0) return arr;

    if (sortType === 1) {
      arr.sort((a, b) => {
        const ad = delayManager.getDelayFix(a, groupName);
        const bd = delayManager.getDelayFix(b, groupName);

        if (ad === -1 || ad === -2) return 1;
        if (bd === -1 || bd === -2) return -1;

        return ad - bd;
      });
    } else {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    }

    return arr;
  };

  // 收藏节点始终在前面
  return [...sortFn(favorites), ...sortFn(regular)];
}
