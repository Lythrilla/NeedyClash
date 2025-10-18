import { ReactNode } from "react";

interface NoticeItem {
  id: number;
  type: "success" | "error" | "info";
  message: ReactNode;
  duration: number;
  timerId?: ReturnType<typeof setTimeout>;
  messageKey?: string; // 用于去重的消息key
}

type Listener = (notices: NoticeItem[]) => void;

let nextId = 0;
let notices: NoticeItem[] = [];
const listeners: Set<Listener> = new Set();

// 记录最近显示的通知，用于去重
const recentNotices = new Map<string, number>(); // messageKey -> timestamp
const DEDUP_WINDOW = 5000; // 5秒内的重复通知会被去重

function notifyListeners() {
  listeners.forEach((listener) => listener([...notices])); // Pass a copy
}

// 生成消息的唯一key用于去重
function getMessageKey(type: string, message: ReactNode): string {
  const msgStr = typeof message === "string" ? message : JSON.stringify(message);
  return `${type}:${msgStr}`;
}

// 检查是否是重复通知
function isDuplicateNotice(messageKey: string): boolean {
  const lastShown = recentNotices.get(messageKey);
  if (lastShown) {
    const timeSinceLastShown = Date.now() - lastShown;
    if (timeSinceLastShown < DEDUP_WINDOW) {
      console.log(`[noticeService] 跳过重复通知 (${timeSinceLastShown}ms 前显示过): ${messageKey}`);
      return true;
    }
  }
  return false;
}

// Shows a notification with deduplication

export function showNotice(
  type: "success" | "error" | "info",
  message: ReactNode,
  duration?: number,
): number {
  const messageKey = getMessageKey(type, message);
  
  // 检查是否是重复通知
  if (isDuplicateNotice(messageKey)) {
    return -1; // 返回-1表示被去重
  }

  const id = nextId++;
  const effectiveDuration =
    duration ?? (type === "error" ? 8000 : type === "info" ? 5000 : 3000); // Longer defaults

  const newNotice: NoticeItem = {
    id,
    type,
    message,
    duration: effectiveDuration,
    messageKey,
  };

  // 记录此次显示的时间
  recentNotices.set(messageKey, Date.now());

  // Auto-hide timer (only if duration is not null/0)
  if (effectiveDuration > 0) {
    newNotice.timerId = setTimeout(() => {
      hideNotice(id);
    }, effectiveDuration);
  }

  notices = [...notices, newNotice];
  notifyListeners();
  return id;
}

// Hides a specific notification by its ID.

export function hideNotice(id: number) {
  const notice = notices.find((n) => n.id === id);
  if (notice?.timerId) {
    clearTimeout(notice.timerId); // Clear timeout if manually closed
  }
  notices = notices.filter((n) => n.id !== id);
  notifyListeners();
}

// Subscribes a listener function to notice state changes.

export function subscribeNotices(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function getSnapshotNotices() {
  return notices;
}

// Function to clear all notices at once
export function clearAllNotices() {
  notices.forEach((n) => {
    if (n.timerId) clearTimeout(n.timerId);
  });
  notices = [];
  notifyListeners();
}

setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  recentNotices.forEach((timestamp, key) => {
    if (now - timestamp > DEDUP_WINDOW) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => recentNotices.delete(key));
  
  if (keysToDelete.length > 0) {
    console.log(`[noticeService] 清理了 ${keysToDelete.length} 条过期的去重记录`);
  }
}, 60000); // 定期清理
