import { AddRounded, RefreshRounded } from "@mui/icons-material";
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  TextField,
  Select,
  MenuItem,
} from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { useLockFn } from "ahooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";

import { BaseDialog, BaseEmpty, BasePage } from "@/components/base";
import {
  EnhancedDialogTitle,
  EnhancedFormGroup,
  EnhancedFormItem,
} from "@/components/setting/mods/enhanced-dialog-components";
import { UnlockItem as UnlockItemComponent } from "@/components/unlock/unlock-item";
import { showNotice } from "@/services/noticeService";

export interface UnlockItemData {
  name: string;
  status: string;
  region?: string | null;
  check_time?: string | null;
  isCustom?: boolean;
  test_url?: string;
  test_method?: string;
  expected_response?: string;
  description?: string;
}

const UNLOCK_RESULTS_STORAGE_KEY = "clash_verge_unlock_results";
const UNLOCK_RESULTS_TIME_KEY = "clash_verge_unlock_time";
const UNLOCK_CUSTOM_ITEMS_KEY = "clash_verge_unlock_custom_items";

const UnlockPage = () => {
  const { t } = useTranslation();

  const [unlockItems, setUnlockItems] = useState<UnlockItemData[]>([]);
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [loadingItems, setLoadingItems] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    test_url: "",
    test_method: "GET",
    expected_response: "",
  });
  const virtuosoRef = useRef<any>(null);

  const sortItemsByName = useCallback((items: UnlockItemData[]) => {
    return [...items].sort((a, b) => {
      // 将自定义项排在后面
      if (a.isCustom && !b.isCustom) return 1;
      if (!a.isCustom && b.isCustom) return -1;
      return a.name.localeCompare(b.name);
    });
  }, []);

  const mergeUnlockItems = useCallback(
    (
      defaults: UnlockItemData[],
      existing?: UnlockItemData[] | null,
      custom?: UnlockItemData[] | null,
    ) => {
      const merged = [...defaults];

      if (existing && existing.length > 0) {
        const existingMap = new Map(existing.map((item) => [item.name, item]));
        for (let i = 0; i < merged.length; i++) {
          const existingItem = existingMap.get(merged[i].name);
          if (existingItem) {
            merged[i] = { ...merged[i], ...existingItem };
          }
        }

        // 添加不在默认列表中的项
        const mergedNameSet = new Set(merged.map((item) => item.name));
        existing.forEach((item) => {
          if (!mergedNameSet.has(item.name) && item.isCustom) {
            merged.push(item);
          }
        });
      }

      // 添加自定义项
      if (custom && custom.length > 0) {
        const mergedNameSet = new Set(merged.map((item) => item.name));
        custom.forEach((item) => {
          if (!mergedNameSet.has(item.name)) {
            merged.push(item);
          }
        });
      }

      return merged;
    },
    [],
  );

  // 保存自定义项到本地存储
  const saveCustomItemsToStorage = useCallback((items: UnlockItemData[]) => {
    try {
      const customItems = items.filter((item) => item.isCustom);
      localStorage.setItem(
        UNLOCK_CUSTOM_ITEMS_KEY,
        JSON.stringify(customItems),
      );
    } catch (err) {
      console.error("Failed to save custom items to storage:", err);
    }
  }, []);

  // 加载自定义项
  const loadCustomItemsFromStorage = useCallback((): UnlockItemData[] | null => {
    try {
      const itemsJson = localStorage.getItem(UNLOCK_CUSTOM_ITEMS_KEY);
      if (itemsJson) {
        return JSON.parse(itemsJson) as UnlockItemData[];
      }
    } catch (err) {
      console.error("Failed to load custom items from storage:", err);
    }
    return null;
  }, []);

  // 保存测试结果到本地存储
  const saveResultsToStorage = useCallback(
    (items: UnlockItemData[], time: string | null) => {
      try {
        localStorage.setItem(UNLOCK_RESULTS_STORAGE_KEY, JSON.stringify(items));
        if (time) {
          localStorage.setItem(UNLOCK_RESULTS_TIME_KEY, time);
        }
        saveCustomItemsToStorage(items);
      } catch (err) {
        console.error("Failed to save results to storage:", err);
      }
    },
    [saveCustomItemsToStorage],
  );

  const loadResultsFromStorage = useCallback((): {
    items: UnlockItemData[] | null;
    time: string | null;
  } => {
    try {
      const itemsJson = localStorage.getItem(UNLOCK_RESULTS_STORAGE_KEY);
      const time = localStorage.getItem(UNLOCK_RESULTS_TIME_KEY);

      if (itemsJson) {
        return {
          items: JSON.parse(itemsJson) as UnlockItemData[],
          time,
        };
      }
    } catch (err) {
      console.error("Failed to load results from storage:", err);
    }

    return { items: null, time: null };
  }, []);

  const getUnlockItems = useCallback(
    async (
      existingItems: UnlockItemData[] | null = null,
      existingTime: string | null = null,
    ) => {
      try {
        const defaultItems = await invoke<UnlockItemData[]>("get_unlock_items");
        const customItems = loadCustomItemsFromStorage();
        const mergedItems = mergeUnlockItems(
          defaultItems,
          existingItems,
          customItems,
        );
        const sortedItems = sortItemsByName(mergedItems);

        setUnlockItems(sortedItems);
        saveResultsToStorage(
          sortedItems,
          existingItems && existingItems.length > 0 ? existingTime : null,
        );
      } catch (err: any) {
        console.error("Failed to get unlock items:", err);
      }
    },
    [
      mergeUnlockItems,
      saveResultsToStorage,
      sortItemsByName,
      loadCustomItemsFromStorage,
    ],
  );

  useEffect(() => {
    void (async () => {
      const { items: storedItems, time: storedTime } = loadResultsFromStorage();

      if (storedItems && storedItems.length > 0) {
        setUnlockItems(sortItemsByName(storedItems));
        await getUnlockItems(storedItems, storedTime);
      } else {
        await getUnlockItems();
      }
    })();
  }, [getUnlockItems, loadResultsFromStorage, sortItemsByName]);

  const invokeWithTimeout = async <T,>(
    cmd: string,
    args?: any,
    timeout = 15000,
  ): Promise<T> => {
    return Promise.race([
      invoke<T>(cmd, args),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(t("Detection timeout or failed"))),
          timeout,
        ),
      ),
    ]);
  };

  // 执行全部项目检测
  const checkAllMedia = useLockFn(async () => {
    try {
      setIsCheckingAll(true);
      const result =
        await invokeWithTimeout<UnlockItemData[]>("check_media_unlock");
      const sortedItems = sortItemsByName(result);

      setUnlockItems(sortedItems);
      const currentTime = new Date().toLocaleString();

      saveResultsToStorage(sortedItems, currentTime);

      setIsCheckingAll(false);
    } catch (err: any) {
      setIsCheckingAll(false);
      showNotice(
        "error",
        err?.message || err?.toString() || t("Detection timeout or failed"),
      );
      console.error("Failed to check media unlock:", err);
    }
  });

  // 检测单个流媒体服务
  const checkSingleMedia = useLockFn(async (name: string) => {
    try {
      setLoadingItems((prev) => [...prev, name]);
      const result =
        await invokeWithTimeout<UnlockItemData[]>("check_media_unlock");

      const targetItem = result.find((item: UnlockItemData) => item.name === name);

      if (targetItem) {
        const updatedItems = sortItemsByName(
          unlockItems.map((item: UnlockItemData) =>
            item.name === name
              ? { ...targetItem, isCustom: item.isCustom }
              : item,
          ),
        );

        setUnlockItems(updatedItems);
        const currentTime = new Date().toLocaleString();

        saveResultsToStorage(updatedItems, currentTime);
      }

      setLoadingItems((prev) => prev.filter((item) => item !== name));
    } catch (err: any) {
      setLoadingItems((prev) => prev.filter((item) => item !== name));
      showNotice(
        "error",
        err?.message ||
          err?.toString() ||
          t("Detection failed for {name}").replace("{name}", name),
      );
      console.error(`Failed to check ${name}:`, err);
    }
  });

  // 添加自定义测试项
  const handleAddItem = useLockFn(async () => {
    try {
      if (!newItem.name.trim()) {
        showNotice("error", t("Please enter a name"));
        return;
      }

      if (!newItem.test_url.trim()) {
        showNotice("error", t("Please enter a test URL"));
        return;
      }

      // 检查是否已存在
      if (unlockItems.some((item) => item.name === newItem.name.trim())) {
        showNotice("error", t("Item already exists"));
        return;
      }

      const customItem: UnlockItemData = {
        name: newItem.name.trim(),
        status: "Pending",
        isCustom: true,
        test_url: newItem.test_url.trim(),
        test_method: newItem.test_method,
        expected_response: newItem.expected_response.trim(),
        description: newItem.description.trim(),
      };

      const updatedItems = sortItemsByName([...unlockItems, customItem]);
      setUnlockItems(updatedItems);
      saveResultsToStorage(updatedItems, null);

      setDialogOpen(false);
      setNewItem({
        name: "",
        description: "",
        test_url: "",
        test_method: "GET",
        expected_response: "",
      });
      showNotice("success", t("Item added successfully"));
    } catch (err: any) {
      showNotice("error", err?.message || err?.toString());
      console.error("Failed to add item:", err);
    }
  });

  // 删除测试项
  const handleDeleteItem = useLockFn(async (name: string) => {
    try {
      const updatedItems = unlockItems.filter((item) => item.name !== name);
      setUnlockItems(updatedItems);
      saveResultsToStorage(updatedItems, null);
      showNotice("success", t("Item deleted successfully"));
    } catch (err: any) {
      showNotice("error", err?.message || err?.toString());
      console.error("Failed to delete item:", err);
    }
  });

  return (
    <BasePage
      full
      title={t("Unlock Test")}
      contentStyle={{ height: "100%", padding: 0 }}
      header={
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: "text.disabled",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {t("ACTIONS")}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title={t("Test All")} arrow>
              <IconButton
                size="small"
                onClick={checkAllMedia}
                disabled={isCheckingAll}
                sx={{
                  width: 28,
                  height: 28,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <RefreshRounded
                  sx={{
                    fontSize: 18,
                    animation: isCheckingAll
                      ? "spin 1s linear infinite"
                      : "none",
                    "@keyframes spin": {
                      "0%": { transform: "rotate(0deg)" },
                      "100%": { transform: "rotate(360deg)" },
                    },
                  }}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("Add Item")} arrow>
              <IconButton
                size="small"
                onClick={() => setDialogOpen(true)}
                sx={{
                  width: 28,
                  height: 28,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <AddRounded sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      }
    >
      {unlockItems.length === 0 ? (
        <BaseEmpty text={t("No unlock test items")} />
      ) : (
        <Virtuoso
          ref={virtuosoRef}
          data={unlockItems}
          style={{ height: "100%" }}
          itemContent={(_, item) => (
            <UnlockItemComponent
              value={item}
              isLoading={loadingItems.includes(item.name)}
              onTest={checkSingleMedia}
              onDelete={item.isCustom ? handleDeleteItem : undefined}
              disabled={isCheckingAll}
            />
          )}
        />
      )}

      {/* 添加测试项对话框 - 简化版 */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setNewItem({
            name: "",
            description: "",
            test_url: "",
            test_method: "GET",
            expected_response: "",
          });
        }}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            minWidth: 420,
            maxWidth: 480,
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1.5,
            px: 2.5,
            pt: 2.5,
          }}
        >
          <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
            {t("Add Test Item")}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 2.5, py: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* 名称 */}
            <TextField
              autoFocus
              fullWidth
              label={t("Item Name")}
              size="small"
              required
              value={newItem.name}
              onChange={(e) =>
                setNewItem({ ...newItem, name: e.target.value })
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  newItem.name.trim() &&
                  newItem.test_url.trim()
                ) {
                  handleAddItem();
                }
              }}
              placeholder={t("Enter streaming service name")}
              sx={{
                "& .MuiOutlinedInput-root": {
                  fontSize: "13px",
                  borderRadius: "8px",
                },
                "& .MuiInputLabel-root": {
                  fontSize: "13px",
                },
              }}
            />

            {/* 测试 URL */}
            <TextField
              fullWidth
              label={t("Test URL")}
              size="small"
              required
              value={newItem.test_url}
              onChange={(e) =>
                setNewItem({ ...newItem, test_url: e.target.value })
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  newItem.name.trim() &&
                  newItem.test_url.trim()
                ) {
                  handleAddItem();
                }
              }}
              placeholder="https://example.com/api/check"
              sx={{
                "& .MuiOutlinedInput-root": {
                  fontSize: "13px",
                  borderRadius: "8px",
                },
                "& .MuiInputLabel-root": {
                  fontSize: "13px",
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.5,
            py: 2,
            gap: 1,
          }}
        >
          <Button
            onClick={() => {
              setDialogOpen(false);
              setNewItem({
                name: "",
                description: "",
                test_url: "",
                test_method: "GET",
                expected_response: "",
              });
            }}
            sx={{
              textTransform: "none",
              fontSize: "13px",
            }}
          >
            {t("Cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleAddItem}
            disabled={!newItem.name.trim() || !newItem.test_url.trim()}
            sx={{
              textTransform: "none",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {t("Add")}
          </Button>
        </DialogActions>
      </Dialog>
    </BasePage>
  );
};

export default UnlockPage;
