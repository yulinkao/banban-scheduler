"use client";

import {
  Archive,
  Calculator,
  CalendarClock,
  Clock3,
  Eraser,
  FileDown,
  HelpCircle,
  ImageDown,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Table2,
  Trash2,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

type Person = {
  id: string;
  name: string;
  color: string;
};

type Shift = {
  id: string;
  personId: string;
  startAbs: number;
  duration: number;
};

type CoverageWindow = {
  enabled: boolean;
  start: number;
  end: number;
};

type Plan = {
  weekCount: number;
  weekTarget: number;
  coverageTarget: number;
  coverageWindows: CoverageWindow[];
  people: Person[];
  shifts: Shift[];
  selectedShiftId: string | null;
};

type Slice = {
  shift: Shift;
  start: number;
  end: number;
  lane: number;
  laneCount: number;
};

type DragState = {
  id: string;
  mode: "move" | "top" | "bottom";
  offset: number;
  x: number;
  y: number;
  moved: boolean;
};

type Locale = "zh-TW" | "zh-CN" | "en";
type SaveStatus = "auto" | "saved" | "appliedDefault" | "blankReset" | "defaultSaved" | "defaultCleared" | "imported" | "importFailed";

type Copy = {
  htmlLang: string;
  appTitle: string;
  language: string;
  dayNames: string[];
  saveStatus: Record<SaveStatus, string>;
  week: (week: number) => string;
  weekOption: (week: number) => string;
  dayLabel: (week: number, day: string) => string;
  peopleCount: (count: number) => string;
  shiftCount: (count: number) => string;
  personOption: (count: number) => string;
  weekCountBadge: (count: number) => string;
  coveragePoint: (total: number, target: number) => string;
  coverageStartAria: (day: string) => string;
  coverageEndAria: (day: string) => string;
  csvWeek: (week: number) => string;
  csvHeaders: string[];
  hoursCsvHeaders: (weeks: number[]) => string[];
  weekSummary: (total: string, gap: string) => string;
  dayStatsMet: (hours: string) => string;
  dayStatsGap: (short: string, empty: string) => string;
  weekPng: (week: number) => string;
  appControls: string;
  resetDefault: string;
  setDefault: string;
  exportAllPng: string;
  peopleSetup: string;
  name: string;
  namePlaceholder: string;
  color: string;
  addPerson: string;
  currentPeople: string;
  noPeople: string;
  removePerson: (name: string) => string;
  targetSetup: string;
  weekCount: string;
  weeklyTarget: string;
  coverageTarget: string;
  addPeopleFirst: string;
  shift: string;
  person: string;
  date: string;
  start: string;
  end: string;
  addShift: string;
  selectedShift: string;
  deleteShift: string;
  selectedHint: string;
  totalStats: string;
  totalHours: string;
  target: string;
  averagePerWeek: string;
  coverageMet: string;
  needed: string;
  coverageGap: string;
  empty: string;
  hours: string;
  total: string;
  noPeopleTable: string;
  people: string;
  noPeopleAbove: string;
  coverageWindows: string;
  weekdaysPreset: string;
  dailyPreset: string;
  fullDayPreset: string;
  clearPreset: string;
  export: string;
  scheduleCsv: string;
  hoursCsv: string;
  allWeeksPng: string;
  backupJson: string;
  importJson: string;
  printPdf: string;
  preset: string;
  clearCustomDefault: string;
  customDefaultHint: string;
  blankDefaultHint: string;
  time: string;
  dragHint: string;
  dragLineTop: string;
  dragLineBottom: string;
  metShort: string;
  gapShort: string;
  emptyShort: string;
  coverageStatus: string;
  notRequired: string;
  helpButton: string;
  helpTitle: string;
  helpIntro: string;
  helpSteps: string[];
  helpStorageTitle: string;
  helpStorageBody: string;
  helpLicenseTitle: string;
  helpLicenseBody: string;
  helpClose: string;
  creditLine: string;
};

const translations: Record<Locale, Copy> = {
  "zh-TW": {
    htmlLang: "zh-Hant",
    appTitle: "班班難排搬搬排",
    language: "語言",
    dayNames: ["週一", "週二", "週三", "週四", "週五", "週六", "週日"],
    saveStatus: {
      auto: "本機自動保存",
      saved: "已保存",
      appliedDefault: "已套用預設",
      blankReset: "已回到空白",
      defaultSaved: "已設成預設值",
      defaultCleared: "已清除預設",
      imported: "已匯入",
      importFailed: "匯入失敗",
    },
    week: (week) => `第 ${week} 週`,
    weekOption: (week) => `${week} 週`,
    dayLabel: (week, day) => `第 ${week} 週 ${day}`,
    peopleCount: (count) => `${count} 人`,
    shiftCount: (count) => `${count} 段`,
    personOption: (count) => `${count} 人`,
    weekCountBadge: (count) => `共 ${count} 週`,
    coveragePoint: (total, target) => `${total}/${target} 人`,
    coverageStartAria: (day) => `${day}開始`,
    coverageEndAria: (day) => `${day}結束`,
    csvWeek: (week) => `第 ${week} 週`,
    csvHeaders: ["週次", "日期", "人員", "開始", "結束日期", "結束", "時數"],
    hoursCsvHeaders: (weeks) => ["人員", ...weeks.map((week) => `第 ${week + 1} 週`), "總計"],
    weekSummary: (total, gap) => `總工時 ${total} · 覆蓋缺口 ${gap}`,
    dayStatsMet: (hours) => `達 ${hours}`,
    dayStatsGap: (short, empty) => `缺 ${short} / 空 ${empty}`,
    weekPng: (week) => `第 ${week} 週 PNG`,
    appControls: "排班控制",
    resetDefault: "套用預設",
    setDefault: "設成預設值",
    exportAllPng: "匯出全部 PNG",
    peopleSetup: "角色 / 人員",
    name: "名稱",
    namePlaceholder: "姓名",
    color: "顏色",
    addPerson: "新增人員",
    currentPeople: "目前人員",
    noPeople: "尚未新增人員",
    removePerson: (name) => `移除 ${name}`,
    targetSetup: "排班目標",
    weekCount: "週數",
    weeklyTarget: "每週總工時",
    coverageTarget: "覆蓋目標",
    addPeopleFirst: "先新增人員",
    shift: "時段",
    person: "人員",
    date: "日期",
    start: "開始",
    end: "結束",
    addShift: "新增班段",
    selectedShift: "已選班段",
    deleteShift: "刪除班段",
    selectedHint: "新增或點選一個班段後可以在這裡調整。",
    totalStats: "總統計",
    totalHours: "總工時",
    target: "目標",
    averagePerWeek: "平均 / 週",
    coverageMet: "覆蓋達標",
    needed: "需求",
    coverageGap: "覆蓋缺口",
    empty: "空班",
    hours: "工時",
    total: "總計",
    noPeopleTable: "尚未新增人員",
    people: "人員",
    noPeopleAbove: "先在上方新增人員。",
    coverageWindows: "需求時段",
    weekdaysPreset: "平日 09-18",
    dailyPreset: "每天 09-18",
    fullDayPreset: "全天",
    clearPreset: "全關",
    export: "匯出",
    scheduleCsv: "班表 CSV",
    hoursCsv: "工時 CSV",
    allWeeksPng: "全部週數 PNG",
    backupJson: "備份 JSON",
    importJson: "匯入 JSON",
    printPdf: "列印 / PDF",
    preset: "預設",
    clearCustomDefault: "清除自訂預設",
    customDefaultHint: "目前會優先套用你保存的預設。",
    blankDefaultHint: "目前使用空白預設。",
    time: "時間",
    dragHint: "上下拖拉",
    dragLineTop: "上下",
    dragLineBottom: "拖拉",
    metShort: "達",
    gapShort: "缺",
    emptyShort: "空",
    coverageStatus: "覆蓋狀態",
    notRequired: "非需求",
    helpButton: "使用說明",
    helpTitle: "使用說明",
    helpIntro: "用積木方式把班段排進日曆；資料只存在目前瀏覽器，不需要登入，也不會和其他人共用。",
    helpSteps: [
      "先在「角色 / 人員」新增姓名並選顏色；刪除人員時，他的班段會一起移除。",
      "到「排班目標」設定週數、每週總工時與覆蓋目標；覆蓋目標會依目前人數調整。",
      "用右側「時段」選人員、日期、開始與結束時間，新增後就會出現在日曆上。",
      "直接拖動日曆上的班段可以改時間；拖上下邊緣可以拉長或縮短。",
      "在「需求時段」設定每天需要人手的時間；上方色條和右側統計會即時顯示達標、缺口與空班。",
      "完成後可匯出 PNG、班表 CSV、工時 CSV；JSON 可用來備份，換瀏覽器或電腦時再匯入。",
    ],
    helpStorageTitle: "資料保存提醒",
    helpStorageBody:
      "排班會自動存在目前瀏覽器。若使用無痕模式、清除瀏覽器資料、換瀏覽器或電腦，或瀏覽器自動回收網站儲存空間，資料可能會消失；重要版本記得先匯出「備份 JSON」，之後可用「匯入 JSON」還原。",
    helpLicenseTitle: "授權提醒",
    helpLicenseBody:
      "網站與原始碼 © 2026 Yu-Lin Kao。歡迎個人使用；商業使用、轉售、再發布、公開託管副本，或基於本工具改作產品，需事先取得 Yu-Lin Kao 書面授權。",
    helpClose: "關閉使用說明",
    creditLine: "designed by yulin, generated with chatgpt :)",
  },
  "zh-CN": {
    htmlLang: "zh-Hans",
    appTitle: "班班难排搬搬排",
    language: "语言",
    dayNames: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
    saveStatus: {
      auto: "本机自动保存",
      saved: "已保存",
      appliedDefault: "已套用预设",
      blankReset: "已回到空白",
      defaultSaved: "已设成预设值",
      defaultCleared: "已清除预设",
      imported: "已导入",
      importFailed: "导入失败",
    },
    week: (week) => `第 ${week} 周`,
    weekOption: (week) => `${week} 周`,
    dayLabel: (week, day) => `第 ${week} 周 ${day}`,
    peopleCount: (count) => `${count} 人`,
    shiftCount: (count) => `${count} 段`,
    personOption: (count) => `${count} 人`,
    weekCountBadge: (count) => `共 ${count} 周`,
    coveragePoint: (total, target) => `${total}/${target} 人`,
    coverageStartAria: (day) => `${day}开始`,
    coverageEndAria: (day) => `${day}结束`,
    csvWeek: (week) => `第 ${week} 周`,
    csvHeaders: ["周次", "日期", "人员", "开始", "结束日期", "结束", "时数"],
    hoursCsvHeaders: (weeks) => ["人员", ...weeks.map((week) => `第 ${week + 1} 周`), "总计"],
    weekSummary: (total, gap) => `总工时 ${total} · 覆盖缺口 ${gap}`,
    dayStatsMet: (hours) => `达 ${hours}`,
    dayStatsGap: (short, empty) => `缺 ${short} / 空 ${empty}`,
    weekPng: (week) => `第 ${week} 周 PNG`,
    appControls: "排班控制",
    resetDefault: "套用预设",
    setDefault: "设成预设值",
    exportAllPng: "导出全部 PNG",
    peopleSetup: "角色 / 人员",
    name: "名称",
    namePlaceholder: "姓名",
    color: "颜色",
    addPerson: "新增人员",
    currentPeople: "当前人员",
    noPeople: "尚未新增人员",
    removePerson: (name) => `移除 ${name}`,
    targetSetup: "排班目标",
    weekCount: "周数",
    weeklyTarget: "每周总工时",
    coverageTarget: "覆盖目标",
    addPeopleFirst: "先新增人员",
    shift: "时段",
    person: "人员",
    date: "日期",
    start: "开始",
    end: "结束",
    addShift: "新增班段",
    selectedShift: "已选班段",
    deleteShift: "删除班段",
    selectedHint: "新增或点选一个班段后可以在这里调整。",
    totalStats: "总统计",
    totalHours: "总工时",
    target: "目标",
    averagePerWeek: "平均 / 周",
    coverageMet: "覆盖达标",
    needed: "需求",
    coverageGap: "覆盖缺口",
    empty: "空班",
    hours: "工时",
    total: "总计",
    noPeopleTable: "尚未新增人员",
    people: "人员",
    noPeopleAbove: "先在上方新增人员。",
    coverageWindows: "需求时段",
    weekdaysPreset: "工作日 09-18",
    dailyPreset: "每天 09-18",
    fullDayPreset: "全天",
    clearPreset: "全关",
    export: "导出",
    scheduleCsv: "班表 CSV",
    hoursCsv: "工时 CSV",
    allWeeksPng: "全部周数 PNG",
    backupJson: "备份 JSON",
    importJson: "导入 JSON",
    printPdf: "打印 / PDF",
    preset: "预设",
    clearCustomDefault: "清除自定义预设",
    customDefaultHint: "目前会优先套用你保存的预设。",
    blankDefaultHint: "目前使用空白预设。",
    time: "时间",
    dragHint: "上下拖拉",
    dragLineTop: "上下",
    dragLineBottom: "拖拉",
    metShort: "达",
    gapShort: "缺",
    emptyShort: "空",
    coverageStatus: "覆盖状态",
    notRequired: "非需求",
    helpButton: "使用说明",
    helpTitle: "使用说明",
    helpIntro: "用积木方式把班段排进日历；数据只存在当前浏览器，不需要登录，也不会和其他人共享。",
    helpSteps: [
      "先在「角色 / 人员」新增姓名并选颜色；删除人员时，他的班段会一起移除。",
      "到「排班目标」设置周数、每周总工时与覆盖目标；覆盖目标会依当前人数调整。",
      "用右侧「时段」选人员、日期、开始与结束时间，新增后就会出现在日历上。",
      "直接拖动日历上的班段可以改时间；拖上下边缘可以拉长或缩短。",
      "在「需求时段」设置每天需要人手的时间；上方色条和右侧统计会即时显示达标、缺口与空班。",
      "完成后可导出 PNG、班表 CSV、工时 CSV；JSON 可用来备份，换浏览器或电脑时再导入。",
    ],
    helpStorageTitle: "数据保存提醒",
    helpStorageBody:
      "排班会自动存在当前浏览器。若使用无痕模式、清除浏览器数据、换浏览器或电脑，或浏览器自动回收网站存储空间，数据可能会消失；重要版本记得先导出“备份 JSON”，之后可用“导入 JSON”还原。",
    helpLicenseTitle: "授权提醒",
    helpLicenseBody:
      "网站与源代码 © 2026 Yu-Lin Kao。欢迎个人使用；商业使用、转售、再发布、公开托管副本，或基于本工具改作产品，需事先取得 Yu-Lin Kao 书面授权。",
    helpClose: "关闭使用说明",
    creditLine: "designed by yulin, generated with chatgpt :)",
  },
  en: {
    htmlLang: "en",
    appTitle: "Banban Scheduler",
    language: "Language",
    dayNames: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    saveStatus: {
      auto: "Autosaved locally",
      saved: "Saved",
      appliedDefault: "Default applied",
      blankReset: "Blank plan restored",
      defaultSaved: "Default saved",
      defaultCleared: "Default cleared",
      imported: "Imported",
      importFailed: "Import failed",
    },
    week: (week) => `Week ${week}`,
    weekOption: (week) => `${week} week${week === 1 ? "" : "s"}`,
    dayLabel: (week, day) => `Week ${week} ${day}`,
    peopleCount: (count) => `${count} ${count === 1 ? "person" : "people"}`,
    shiftCount: (count) => `${count} shift${count === 1 ? "" : "s"}`,
    personOption: (count) => `${count} ${count === 1 ? "person" : "people"}`,
    weekCountBadge: (count) => `${count} week${count === 1 ? "" : "s"}`,
    coveragePoint: (total, target) => `${total}/${target} people`,
    coverageStartAria: (day) => `${day} start`,
    coverageEndAria: (day) => `${day} end`,
    csvWeek: (week) => `Week ${week}`,
    csvHeaders: ["Week", "Date", "Person", "Start", "End date", "End", "Hours"],
    hoursCsvHeaders: (weeks) => ["Person", ...weeks.map((week) => `Week ${week + 1}`), "Total"],
    weekSummary: (total, gap) => `Total ${total} · Coverage gap ${gap}`,
    dayStatsMet: (hours) => `Met ${hours}`,
    dayStatsGap: (short, empty) => `Short ${short} / Empty ${empty}`,
    weekPng: (week) => `Week ${week} PNG`,
    appControls: "Schedule controls",
    resetDefault: "Apply default",
    setDefault: "Set as default",
    exportAllPng: "Export all PNG",
    peopleSetup: "Roles / People",
    name: "Name",
    namePlaceholder: "Name",
    color: "Color",
    addPerson: "Add person",
    currentPeople: "Current people",
    noPeople: "No people yet",
    removePerson: (name) => `Remove ${name}`,
    targetSetup: "Schedule target",
    weekCount: "Weeks",
    weeklyTarget: "Weekly hours",
    coverageTarget: "Coverage target",
    addPeopleFirst: "Add people first",
    shift: "Shift",
    person: "Person",
    date: "Date",
    start: "Start",
    end: "End",
    addShift: "Add shift",
    selectedShift: "Selected shift",
    deleteShift: "Delete shift",
    selectedHint: "Add or select a shift to adjust it here.",
    totalStats: "Totals",
    totalHours: "Total hours",
    target: "Target",
    averagePerWeek: "Average / week",
    coverageMet: "Coverage met",
    needed: "Needed",
    coverageGap: "Coverage gap",
    empty: "Empty",
    hours: "Hours",
    total: "Total",
    noPeopleTable: "No people yet",
    people: "People",
    noPeopleAbove: "Add people above first.",
    coverageWindows: "Coverage windows",
    weekdaysPreset: "Weekdays 09-18",
    dailyPreset: "Daily 09-18",
    fullDayPreset: "Full day",
    clearPreset: "Clear",
    export: "Export",
    scheduleCsv: "Schedule CSV",
    hoursCsv: "Hours CSV",
    allWeeksPng: "All weeks PNG",
    backupJson: "Backup JSON",
    importJson: "Import JSON",
    printPdf: "Print / PDF",
    preset: "Default",
    clearCustomDefault: "Clear custom default",
    customDefaultHint: "Your saved default is applied first.",
    blankDefaultHint: "Using the blank default.",
    time: "Time",
    dragHint: "Drag vertically",
    dragLineTop: "Drag",
    dragLineBottom: "up/down",
    metShort: "Met",
    gapShort: "Short",
    emptyShort: "Empty",
    coverageStatus: "coverage status",
    notRequired: "Not required",
    helpButton: "How to use",
    helpTitle: "How to use",
    helpIntro: "Build schedules by moving shift blocks on the calendar. Data stays in this browser only, with no sign-in and no shared database.",
    helpSteps: [
      "Add people under Roles / People, choose a color, and remove anyone you no longer need. Their shifts are removed with them.",
      "Set weeks, weekly hours, and coverage target under Schedule target. The coverage target adjusts to the current team size.",
      "Use the Shift panel to choose a person, date, start time, and end time. New shifts appear on the calendar.",
      "Drag a shift to move it, or drag its top or bottom edge to lengthen or shorten it.",
      "Use Coverage windows to set when each day needs staffing. The day bars and side stats show met time, gaps, and empty time as you edit.",
      "Export PNG, schedule CSV, or hours CSV when done. Use JSON as a backup when switching browsers or computers.",
    ],
    helpStorageTitle: "Data safety note",
    helpStorageBody:
      "Schedules are autosaved in this browser. Data may disappear if you use a private window, clear browser data, switch browsers or computers, or if the browser clears site storage. Export a Backup JSON for important versions, then restore it later with Import JSON.",
    helpLicenseTitle: "License note",
    helpLicenseBody:
      "Website and source code © 2026 Yu-Lin Kao. Personal use is welcome. Commercial use, resale, redistribution, public hosted copies, or derivative products require prior written permission from Yu-Lin Kao.",
    helpClose: "Close instructions",
    creditLine: "designed by yulin, generated with chatgpt :)",
  },
};

const defaultLocale: Locale = "zh-TW";
const languageOptions: Array<{ value: Locale; label: string }> = [
  { value: "zh-TW", label: "繁中" },
  { value: "zh-CN", label: "简中" },
  { value: "en", label: "EN" },
];
const fallbackColors = ["#7d8996", "#ab8a7e", "#928da6", "#7f9a94", "#8f9b8d", "#a58a99", "#aaa083", "#8d8f84"];
const minDuration = 0.5;
const defaultWeekCount = 2;
const minWeekCount = 1;
const maxWeekCount = 6;
const storageKey = "yulin-scheduler-plan-v1";
const defaultStorageKey = "yulin-scheduler-default-plan-v1";
const languageStorageKey = "yulin-scheduler-language-v1";
const exportWeekWidth = 2048;
const exportWeekHeight = 1600;
const timeOptions = Array.from({ length: 49 }, (_, index) => index / 2);
const weekCountOptions = Array.from({ length: maxWeekCount - minWeekCount + 1 }, (_, index) => minWeekCount + index);
const defaultCoverageWindows: CoverageWindow[] = Array.from({ length: 7 }, (_, index) => ({
  enabled: index < 5,
  start: 9,
  end: 18,
}));

const defaultPlan: Plan = {
  weekCount: defaultWeekCount,
  weekTarget: 180,
  coverageTarget: 2,
  coverageWindows: defaultCoverageWindows,
  selectedShiftId: null,
  people: [],
  shifts: [],
};

const exportTheme = {
  bg: "#ffffff",
  panel: "#ffffff",
  panelSoft: "#f8f8f6",
  text: "#1f211f",
  muted: "#70726d",
  line: "#deddd8",
  lineSoft: "#ecebe7",
  lineStrong: "#c9c8c1",
  closed: "#f1f1ee",
  covered: "#b7c3b4",
  single: "#d6cfb8",
  empty: "#c5a39f",
  shadow: "rgba(31, 33, 31, .13)",
};

function cloneDefaultPlan(): Plan {
  return clonePlan(defaultPlan);
}

function clonePlan(plan: Plan): Plan {
  const weekCount = normalizeWeekCount(plan.weekCount);
  return {
    ...plan,
    weekCount,
    coverageWindows: normalizeCoverageWindows(plan.coverageWindows),
    people: plan.people.map((person) => ({ ...person })),
    shifts: constrainShiftsToWeeks(plan.shifts, weekCount),
  };
}

function normalizeCoverageWindows(windows: unknown): CoverageWindow[] {
  const source = Array.isArray(windows) ? windows : [];
  return defaultCoverageWindows.map((fallback, index) => {
    const value = source[index] as Partial<CoverageWindow> | undefined;
    return {
      enabled: typeof value?.enabled === "boolean" ? value.enabled : fallback.enabled,
      start: clamp(typeof value?.start === "number" ? value.start : fallback.start, 0, 24),
      end: clamp(typeof value?.end === "number" ? value.end : fallback.end, 0, 24),
    };
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeWeekCount(value: unknown) {
  const raw = Number(value);
  return clamp(Math.round(Number.isFinite(raw) && raw > 0 ? raw : defaultWeekCount), minWeekCount, maxWeekCount);
}

function horizonForWeeks(weekCount: number) {
  return normalizeWeekCount(weekCount) * 7 * 24;
}

function dayCountForWeeks(weekCount: number) {
  return normalizeWeekCount(weekCount) * 7;
}

function snap(value: number) {
  return Math.round(value * 2) / 2;
}

function shiftEnd(shift: Shift) {
  return shift.startAbs + shift.duration;
}

function constrainShiftsToWeeks(shifts: Shift[], weekCount: number) {
  const horizon = horizonForWeeks(weekCount);
  return shifts
    .filter((shift) => shift.startAbs < horizon)
    .map((shift) => {
      const startAbs = clamp(shift.startAbs, 0, horizon - minDuration);
      return {
        ...shift,
        startAbs,
        duration: clamp(shift.duration, minDuration, Math.min(24, horizon - startAbs)),
      };
    });
}

function constrainPlanToWeeks(plan: Plan, weekCount: number): Plan {
  const normalizedWeekCount = normalizeWeekCount(weekCount);
  const shifts = constrainShiftsToWeeks(plan.shifts, normalizedWeekCount);
  return {
    ...plan,
    weekCount: normalizedWeekCount,
    shifts,
    selectedShiftId: shifts.some((shift) => shift.id === plan.selectedShiftId) ? plan.selectedShiftId : shifts[0]?.id || null,
  };
}

function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(translations, value);
}

function dayLabel(day: number, text: Copy = translations[defaultLocale]) {
  return text.dayLabel(Math.floor(day / 7) + 1, text.dayNames[day % 7]);
}

function fmtHour(hour: number) {
  const normalized = ((hour % 24) + 24) % 24;
  const whole = Math.floor(normalized);
  const minutes = Math.round((normalized - whole) * 60);
  return `${String(whole).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function fmtDuration(hours: number) {
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

function timeToHour(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return (hour || 0) + (minute || 0) / 60;
}

function personById(people: Person[], id: string) {
  return people.find((person) => person.id === id);
}

function openAt(plan: Plan, absHour: number) {
  const day = Math.floor(absHour / 24);
  if (day < 0 || day >= dayCountForWeeks(plan.weekCount)) return false;
  const hour = absHour - day * 24;
  const dow = day % 7;
  const window = plan.coverageWindows[dow] || defaultCoverageWindows[dow];
  if (!window.enabled) return false;
  if (window.start === window.end) return true;
  if (window.start < window.end) return hour >= window.start && hour < window.end;
  return hour >= window.start || hour < window.end;
}

function closedBands(plan: Plan, day: number) {
  const dow = day % 7;
  const window = plan.coverageWindows[dow] || defaultCoverageWindows[dow];
  if (!window.enabled) return [[0, 24]];
  if (window.start === window.end) return [];
  if (window.start < window.end) {
    return [[0, window.start], [window.end, 24]].filter(([start, end]) => end > start);
  }
  return [[window.end, window.start]].filter(([start, end]) => end > start);
}

function activePeopleAt(shifts: Shift[], absHour: number) {
  const active = new Set<string>();
  shifts.forEach((shift) => {
    if (shift.startAbs <= absHour && shiftEnd(shift) > absHour) active.add(shift.personId);
  });
  return active.size;
}

function coveragePoint(plan: Plan, absHour: number) {
  const open = openAt(plan, absHour);
  const total = activePeopleAt(plan.shifts, absHour);
  const target = plan.coverageTarget;
  const gap = Math.max(0, target - total);
  return {
    open,
    target,
    total,
    gap,
    empty: open && target > 0 && total === 0,
    short: open && total > 0 && gap > 0,
    met: open && gap === 0,
  };
}

function weekHoursForShift(shift: Shift, week: number) {
  const weekStart = week * 7 * 24;
  const weekEnd = weekStart + 7 * 24;
  return Math.max(0, Math.min(shiftEnd(shift), weekEnd) - Math.max(shift.startAbs, weekStart));
}

function personTotals(plan: Plan) {
  const totals: Record<string, number[]> = Object.fromEntries(
    plan.people.map((person) => [person.id, Array.from({ length: plan.weekCount }, () => 0)]),
  );
  plan.shifts.forEach((shift) => {
    if (!totals[shift.personId]) return;
    for (let week = 0; week < plan.weekCount; week += 1) {
      totals[shift.personId][week] += weekHoursForShift(shift, week);
    }
  });
  return totals;
}

function coverageSummary(plan: Plan, week: number) {
  const summary = { open: 0, empty: 0, short: 0, met: 0, gap: 0 };
  const start = week * 7 * 24;
  const end = start + 7 * 24;
  for (let abs = start; abs < end; abs += 0.5) {
    if (!openAt(plan, abs)) continue;
    const point = coveragePoint(plan, abs);
    summary.open += 0.5;
    if (point.empty) summary.empty += 0.5;
    if (point.short) summary.short += 0.5;
    if (point.met) summary.met += 0.5;
    summary.gap += point.gap * 0.5;
  }
  return summary;
}

function dayCoverage(plan: Plan, day: number) {
  const summary = { empty: 0, short: 0, met: 0 };
  for (let hour = 0; hour < 24; hour += 0.5) {
    const abs = day * 24 + hour;
    if (!openAt(plan, abs)) continue;
    const point = coveragePoint(plan, abs);
    if (point.empty) summary.empty += 0.5;
    if (point.short) summary.short += 0.5;
    if (point.met) summary.met += 0.5;
  }
  return summary;
}

function coverageClass(point: ReturnType<typeof coveragePoint>) {
  if (!point.open) return "closed";
  if (point.empty) return "empty";
  if (point.short) return "single";
  return "covered";
}

function shiftSlicesForDay(shifts: Shift[], day: number) {
  const dayStart = day * 24;
  const dayEnd = dayStart + 24;
  return shifts.flatMap((shift) => {
    const start = Math.max(shift.startAbs, dayStart);
    const end = Math.min(shiftEnd(shift), dayEnd);
    if (end <= start) return [];
    return [{ shift, start: start - dayStart, end: end - dayStart }];
  });
}

function layoutSlices(slices: Array<{ shift: Shift; start: number; end: number }>) {
  const sorted = slices.slice().sort((a, b) => a.start - b.start || a.end - b.end);
  const result: Slice[] = [];
  let cluster: Array<{ shift: Shift; start: number; end: number }> = [];
  let clusterEnd = -1;

  function flushCluster() {
    if (!cluster.length) return;
    const lanes: number[] = [];
    cluster.forEach((slice) => {
      let lane = lanes.findIndex((end) => end <= slice.start);
      if (lane === -1) {
        lane = lanes.length;
        lanes.push(slice.end);
      } else {
        lanes[lane] = slice.end;
      }
      result.push({ ...slice, lane, laneCount: 0 });
    });
    const laneCount = Math.max(1, lanes.length);
    result.slice(-cluster.length).forEach((item) => {
      item.laneCount = laneCount;
    });
    cluster = [];
    clusterEnd = -1;
  }

  sorted.forEach((slice) => {
    if (!cluster.length || slice.start < clusterEnd) {
      cluster.push(slice);
      clusterEnd = Math.max(clusterEnd, slice.end);
    } else {
      flushCluster();
      cluster.push(slice);
      clusterEnd = slice.end;
    }
  });
  flushCluster();
  return result;
}

function nextNumberFromIds(items: Array<{ id: string }>, prefix: string) {
  return Math.max(0, ...items.map((item) => {
    const value = Number(String(item.id || "").replace(prefix, ""));
    return Number.isFinite(value) ? value : 0;
  })) + 1;
}

function validatePlan(value: unknown): Plan | null {
  if (!value || typeof value !== "object") return null;
  const plan = value as Partial<Plan>;
  if (!Array.isArray(plan.people) || !Array.isArray(plan.shifts)) return null;
  const weekCount = normalizeWeekCount(plan.weekCount);
  const horizon = horizonForWeeks(weekCount);
  const people = plan.people
    .filter((person): person is Person => Boolean(person && typeof person.id === "string" && typeof person.name === "string"))
    .map((person, index) => ({
      id: person.id,
      name: person.name,
      color: typeof person.color === "string" ? person.color : fallbackColors[index % fallbackColors.length],
    }));
  const ids = new Set(people.map((person) => person.id));
  const shifts = plan.shifts
    .filter((shift): shift is Shift => Boolean(
      shift
      && typeof shift.id === "string"
      && typeof shift.personId === "string"
      && ids.has(shift.personId)
      && typeof shift.startAbs === "number"
      && typeof shift.duration === "number",
    ))
    .filter((shift) => shift.startAbs < horizon)
    .map((shift) => ({
      id: shift.id,
      personId: shift.personId,
      startAbs: clamp(shift.startAbs, 0, horizon - minDuration),
      duration: clamp(shift.duration, minDuration, Math.min(24, horizon - clamp(shift.startAbs, 0, horizon - minDuration))),
    }));
  const selectedShiftId = typeof plan.selectedShiftId === "string" && shifts.some((shift) => shift.id === plan.selectedShiftId)
    ? plan.selectedShiftId
    : shifts[0]?.id || null;
  return {
    weekCount,
    weekTarget: Number(plan.weekTarget) || 180,
    coverageTarget: normalizeCoverageTarget(plan.coverageTarget, people.length),
    coverageWindows: normalizeCoverageWindows(plan.coverageWindows),
    people,
    shifts,
    selectedShiftId,
  };
}

function loadStoredPlan(key: string) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? validatePlan(JSON.parse(saved)) : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csv(rows: unknown[][]) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function absParts(abs: number, weekCount: number) {
  const dayCount = dayCountForWeeks(weekCount);
  const horizon = horizonForWeeks(weekCount);
  if (abs >= horizon) return { day: dayCount - 1, hour: 24 };
  const day = clamp(Math.floor(abs / 24), 0, dayCount - 1);
  return { day, hour: abs - day * 24 };
}

function fmtExportHour(hour: number) {
  if (hour === 24) return "24:00";
  return fmtHour(hour);
}

function selectHourValue(hour: number) {
  return String(clamp(hour, 0, 24));
}

function normalizeCoverageTarget(value: unknown, peopleCount: number) {
  const raw = Number(value);
  const fallback = defaultPlan.coverageTarget;
  const max = Math.max(1, peopleCount || fallback);
  return clamp(Math.round(Number.isFinite(raw) && raw > 0 ? raw : fallback), 1, max);
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadFile(filename: string, mimeType: string, content: string) {
  downloadBlob(filename, new Blob([content], { type: mimeType }));
}

function exportFont(size: number, weight = 400) {
  return `${weight} ${size}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
}

function roundedPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fillRound(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, color: string) {
  roundedPath(ctx, x, y, width, height, radius);
  ctx.fillStyle = color;
  ctx.fill();
}

function strokeRound(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, color: string, lineWidth = 1) {
  roundedPath(ctx, x, y, width, height, radius);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function hexToRgb(hex: string) {
  const value = String(hex || "").replace("#", "");
  const normalized = value.length === 3 ? value.split("").map((char) => char + char).join("") : value;
  const number = Number.parseInt(normalized, 16);
  if (!Number.isFinite(number)) return { r: 112, g: 114, b: 109 };
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  };
}

function alphaColor(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, lineWidth = 1) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawTextEllipsis(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }
  let clipped = text;
  while (clipped.length > 1 && ctx.measureText(`${clipped}...`).width > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  ctx.fillText(`${clipped}...`, x, y);
}

function exportCoverageColor(plan: Plan, day: number, hour: number) {
  const abs = day * 24 + hour;
  const cls = coverageClass(coveragePoint(plan, abs));
  if (cls === "covered") return exportTheme.covered;
  if (cls === "single") return exportTheme.single;
  if (cls === "empty") return exportTheme.empty;
  return exportTheme.closed;
}

function drawExportCoverageBar(ctx: CanvasRenderingContext2D, plan: Plan, day: number, x: number, y: number, width: number, height: number) {
  fillRound(ctx, x, y, width, height, height / 2, exportTheme.closed);
  const segmentWidth = width / 48;
  ctx.save();
  roundedPath(ctx, x, y, width, height, height / 2);
  ctx.clip();
  for (let index = 0; index < 48; index += 1) {
    ctx.fillStyle = exportCoverageColor(plan, day, index / 2);
    ctx.fillRect(x + index * segmentWidth, y, Math.ceil(segmentWidth) + 0.5, height);
  }
  ctx.restore();
}

function drawExportShift(ctx: CanvasRenderingContext2D, plan: Plan, slice: Slice, geometry: { dayX: number; bodyY: number; bodyH: number; dayW: number }) {
  const person = personById(plan.people, slice.shift.personId);
  if (!person) return;
  const { dayX, bodyY, bodyH, dayW } = geometry;
  const gap = 8;
  const laneGap = 6;
  const usableWidth = dayW - gap * 2;
  const laneWidth = usableWidth / slice.laneCount;
  const x = dayX + gap + slice.lane * laneWidth + laneGap / 2;
  const width = Math.max(22, laneWidth - laneGap);
  const y = bodyY + (slice.start / 24) * bodyH + 2;
  const height = Math.max(24, ((slice.end - slice.start) / 24) * bodyH - 4);

  ctx.save();
  ctx.shadowColor = exportTheme.shadow;
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  fillRound(ctx, x, y, width, height, 9, exportTheme.panel);
  ctx.restore();
  fillRound(ctx, x, y, width, height, 9, exportTheme.panel);
  strokeRound(ctx, x + 0.5, y + 0.5, width - 1, height - 1, 9, alphaColor(person.color, 0.22));

  ctx.save();
  roundedPath(ctx, x, y, width, height, 9);
  ctx.clip();
  ctx.fillStyle = person.color;
  ctx.fillRect(x, y, 4, height);
  const labelX = x + 14;
  const maxTextWidth = width - 20;
  const labelY = clamp(y + height / 2 - 20, y + 12, y + Math.max(12, height - 38));
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = exportTheme.text;
  ctx.font = exportFont(17, 700);
  drawTextEllipsis(ctx, person.name, labelX, labelY, maxTextWidth);
  ctx.fillStyle = exportTheme.muted;
  ctx.font = exportFont(15, 500);
  drawTextEllipsis(ctx, `${fmtHour(slice.start)}-${fmtHour(slice.end)}`, labelX, labelY + 24, maxTextWidth);
  ctx.restore();
}

function drawExportWeek(ctx: CanvasRenderingContext2D, plan: Plan, week: number, yOffset: number, width: number, height: number, text: Copy = translations[defaultLocale]) {
  const totals = personTotals(plan);
  const coverage = coverageSummary(plan, week);
  const weekTotal = plan.people.reduce((sum, person) => sum + (totals[person.id]?.[week] || 0), 0);
  const pad = 28;
  const cardX = pad;
  const cardY = yOffset + 70;
  const cardW = width - pad * 2;
  const cardH = height - 94;
  const headH = 108;
  const timeW = 72;
  const bodyY = cardY + headH;
  const bodyH = cardH - headH;
  const dayW = (cardW - timeW) / 7;
  const days = Array.from({ length: 7 }, (_, index) => week * 7 + index);
  const bodyBottom = bodyY + bodyH;

  ctx.fillStyle = exportTheme.bg;
  ctx.fillRect(0, yOffset, width, height);
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = exportTheme.text;
  ctx.font = exportFont(28, 750);
  ctx.fillText(text.week(week + 1), pad, yOffset + 16);
  ctx.textAlign = "right";
  ctx.fillStyle = exportTheme.muted;
  ctx.font = exportFont(19, 650);
  ctx.fillText(text.weekSummary(fmtDuration(weekTotal), fmtDuration(coverage.gap)), width - pad, yOffset + 20);

  fillRound(ctx, cardX, cardY, cardW, cardH, 10, exportTheme.panel);
  strokeRound(ctx, cardX + 0.5, cardY + 0.5, cardW - 1, cardH - 1, 10, exportTheme.line);
  ctx.save();
  roundedPath(ctx, cardX, cardY, cardW, cardH, 10);
  ctx.clip();
  ctx.fillStyle = exportTheme.panelSoft;
  ctx.fillRect(cardX, cardY, cardW, headH);
  ctx.fillStyle = exportTheme.panel;
  ctx.fillRect(cardX, bodyY, cardW, bodyH);

  days.forEach((day, index) => {
    const dayX = cardX + timeW + index * dayW;
    closedBands(plan, day).forEach(([start, end]) => {
      ctx.fillStyle = exportTheme.closed;
      ctx.fillRect(dayX, bodyY + (start / 24) * bodyH, dayW, ((end - start) / 24) * bodyH);
    });
  });

  for (let hour = 0; hour <= 24; hour += 1) {
    const y = bodyY + (hour / 24) * bodyH;
    const major = hour % 6 === 0;
    drawLine(ctx, cardX, y, cardX + cardW, y, major ? exportTheme.lineStrong : exportTheme.lineSoft, major ? 1.2 : 1);
  }
  for (let index = 0; index <= 8; index += 1) {
    const x = index === 0 ? cardX : cardX + timeW + (index - 1) * dayW;
    drawLine(ctx, x, cardY, x, cardY + cardH, exportTheme.line, 1);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = exportTheme.text;
  ctx.font = exportFont(21, 750);
  ctx.fillText(text.time, cardX + 10, cardY + 16);
  ctx.fillStyle = exportTheme.muted;
  ctx.font = exportFont(18, 600);
  ctx.fillText(text.dragLineTop, cardX + 10, cardY + 52);
  ctx.fillText(text.dragLineBottom, cardX + 10, cardY + 78);

  [0, 6, 12, 18, 24].forEach((hour) => {
    const labelY = hour === 24 ? bodyBottom - 22 : bodyY + (hour / 24) * bodyH - 10;
    ctx.fillStyle = exportTheme.muted;
    ctx.font = exportFont(17, 500);
    ctx.fillText(`${String(hour).padStart(2, "0")}:00`, cardX + 10, labelY);
  });

  days.forEach((day, index) => {
    const dayX = cardX + timeW + index * dayW;
    const headX = dayX + 10;
    const stats = dayCoverage(plan, day);
    ctx.fillStyle = exportTheme.text;
    ctx.font = exportFont(21, 750);
    drawTextEllipsis(ctx, text.dayNames[day % 7], headX, cardY + 16, dayW - 20);
    drawExportCoverageBar(ctx, plan, day, headX, cardY + 52, dayW - 20, 10);
    ctx.fillStyle = exportTheme.muted;
    ctx.font = exportFont(17, 600);
    ctx.textAlign = "left";
    ctx.fillText(text.dayStatsMet(fmtDuration(stats.met)), headX, cardY + 76);
    ctx.textAlign = "right";
    ctx.fillText(text.dayStatsGap(fmtDuration(stats.short), fmtDuration(stats.empty)), dayX + dayW - 10, cardY + 76);
  });

  days.forEach((day, index) => {
    const dayX = cardX + timeW + index * dayW;
    layoutSlices(shiftSlicesForDay(plan.shifts, day)).forEach((slice) => {
      drawExportShift(ctx, plan, slice, { dayX, bodyY, bodyH, dayW });
    });
  });
  ctx.restore();
}

function TimeRail() {
  return (
    <div className="timeRail" aria-hidden="true">
      {[0, 6, 12, 18, 24].map((hour) => (
        <span key={hour} className={`timeLabel ${hour === 24 ? "end" : ""}`} style={{ top: `${(hour / 24) * 100}%` }}>
          {String(hour).padStart(2, "0")}:00
        </span>
      ))}
    </div>
  );
}

function CoverageBar({ plan, day, text }: { plan: Plan; day: number; text: Copy }) {
  return (
    <div className="coverageBar" aria-label={`${dayLabel(day, text)} ${text.coverageStatus}`}>
      {Array.from({ length: 48 }, (_, index) => {
        const hour = index / 2;
        const abs = day * 24 + hour;
        const isOpen = openAt(plan, abs);
        const point = coveragePoint(plan, abs);
        const cls = coverageClass(point);
        return <span key={index} className={cls} title={`${fmtHour(hour)} ${isOpen ? text.coveragePoint(point.total, point.target) : text.notRequired}`} />;
      })}
    </div>
  );
}

function WeekCard({
  plan,
  week,
  totals,
  onPointerDown,
  text,
}: {
  plan: Plan;
  week: number;
  totals: Record<string, number[]>;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>, shift: Shift) => void;
  text: Copy;
}) {
  const days = Array.from({ length: 7 }, (_, index) => week * 7 + index);
  const coverage = coverageSummary(plan, week);
  const weekTotal = plan.people.reduce((sum, person) => sum + (totals[person.id]?.[week] || 0), 0);

  return (
    <article className="weekCard">
      <div className="weekHead">
        <div className="weekTitle">{text.week(week + 1)}</div>
        <div className="weekSub">{text.weekSummary(fmtDuration(weekTotal), fmtDuration(coverage.gap))}</div>
      </div>
      <div className="weekScroll">
        <div className="calendar">
          <div className="timeCorner">
            <strong>{text.time}</strong>
            <span>{text.dragHint}</span>
          </div>
          {days.map((day) => {
            const stats = dayCoverage(plan, day);
            return (
              <div className="dayHead" key={day}>
                <strong>{text.dayNames[day % 7]}</strong>
                <CoverageBar plan={plan} day={day} text={text} />
                <div className="dayStats">
                  <span>{text.dayStatsMet(fmtDuration(stats.met))}</span>
                  <span>{text.dayStatsGap(fmtDuration(stats.short), fmtDuration(stats.empty))}</span>
                </div>
              </div>
            );
          })}
          <TimeRail />
          {days.map((day) => (
            <div className="dayColumn" data-day-column data-day={day} key={day}>
              {closedBands(plan, day).map(([start, end]) => (
                <span
                  className="closedBand"
                  key={`${start}-${end}`}
                  style={{ top: `${(start / 24) * 100}%`, height: `${((end - start) / 24) * 100}%` }}
                />
              ))}
              {layoutSlices(shiftSlicesForDay(plan.shifts, day)).map((slice) => {
                const person = personById(plan.people, slice.shift.personId);
                if (!person) return null;
                const gap = 1.2;
                const width = 100 / slice.laneCount - gap;
                const left = slice.lane * (100 / slice.laneCount) + gap / 2;
                const firstSlice = slice.shift.startAbs >= day * 24;
                const lastSlice = shiftEnd(slice.shift) <= (day + 1) * 24;
                const time = `${fmtHour(slice.start)}-${fmtHour(slice.end)}`;
                const style = {
                  "--person-color": person.color,
                  top: `${(slice.start / 24) * 100}%`,
                  height: `${((slice.end - slice.start) / 24) * 100}%`,
                  left: `${left}%`,
                  width: `${width}%`,
                } as CSSProperties;
                return (
                  <button
                    className={`shiftBlock ${plan.selectedShiftId === slice.shift.id ? "selected" : ""}`}
                    key={`${slice.shift.id}-${day}`}
                  style={style}
                  type="button"
                  title={`${person.name} ${dayLabel(day, text)} ${time}`}
                  onPointerDown={(event) => onPointerDown(event, slice.shift)}
                  >
                    <span className="handle top" data-handle="top" style={firstSlice ? undefined : { visibility: "hidden" }} />
                    <span className="blockLabel">
                      <strong>{person.name}</strong>
                      <span>{time}</span>
                    </span>
                    <span className="handle bottom" data-handle="bottom" style={lastSlice ? undefined : { visibility: "hidden" }} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function targetFromPoint(clientX: number, clientY: number) {
  const element = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
  const column = element?.closest<HTMLElement>("[data-day-column]");
  if (!column) return null;
  const rect = column.getBoundingClientRect();
  const day = Number(column.dataset.day);
  if (!Number.isFinite(day)) return null;
  const hour = clamp(((clientY - rect.top) / rect.height) * 24, 0, 24);
  return { day, hour };
}

export default function Home() {
  const [plan, setPlan] = useState<Plan>(() => cloneDefaultPlan());
  const [hydrated, setHydrated] = useState(false);
  const [newPerson, setNewPerson] = useState("");
  const [newPersonColor, setNewPersonColor] = useState(fallbackColors[4]);
  const [draftShift, setDraftShift] = useState({ personId: "", day: 0, start: "08:00", end: "18:00" });
  const [hasCustomDefault, setHasCustomDefault] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("auto");
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [helpOpen, setHelpOpen] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const text = translations[locale];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const customDefault = loadStoredPlan(defaultStorageKey);
      const saved = loadStoredPlan(storageKey);
      const savedLocale = localStorage.getItem(languageStorageKey);
      if (isLocale(savedLocale)) setLocale(savedLocale);
      setHasCustomDefault(Boolean(customDefault));
      setPlan(saved ? clonePlan(saved) : customDefault ? clonePlan(customDefault) : cloneDefaultPlan());
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.lang = text.htmlLang;
    document.title = text.appTitle;
    if (hydrated) localStorage.setItem(languageStorageKey, locale);
  }, [hydrated, locale, text.appTitle, text.htmlLang]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey, JSON.stringify(plan));
  }, [hydrated, plan]);

  useEffect(() => {
    if (saveStatus === "auto") return;
    const timer = window.setTimeout(() => setSaveStatus("auto"), 1200);
    return () => window.clearTimeout(timer);
  }, [saveStatus]);

  useEffect(() => {
    if (!helpOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setHelpOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [helpOpen]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDraftShift((current) => {
        if (plan.people.some((person) => person.id === current.personId)) return current;
        return { ...current, personId: plan.people[0]?.id || "" };
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [plan.people]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDraftShift((current) => {
        const day = clamp(current.day, 0, dayCountForWeeks(plan.weekCount) - 1);
        return day === current.day ? current : { ...current, day };
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [plan.weekCount]);

  useEffect(() => {
    if (!hydrated || !plan.people.length) return;
    const timer = window.setTimeout(() => {
      setPlan((current) => {
        const coverageTarget = normalizeCoverageTarget(current.coverageTarget, current.people.length);
        return coverageTarget === current.coverageTarget ? current : { ...current, coverageTarget };
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hydrated, plan.people.length]);

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      if (!dragRef.current) return;
      event.preventDefault();
      const target = targetFromPoint(event.clientX, event.clientY);
      if (!target) return;
      const drag = dragRef.current;
      drag.moved = drag.moved || Math.abs(event.clientX - drag.x) + Math.abs(event.clientY - drag.y) > 3;
      setPlan((current) => ({
        ...current,
        shifts: current.shifts.map((shift) => {
          if (shift.id !== drag.id) return shift;
          const horizon = horizonForWeeks(current.weekCount);
          if (drag.mode === "move") {
            const startAbs = snap(target.day * 24 + target.hour - drag.offset);
            return { ...shift, startAbs: clamp(startAbs, 0, horizon - shift.duration) };
          }
          if (drag.mode === "top") {
            const end = shiftEnd(shift);
            const nextStart = clamp(snap(target.day * 24 + target.hour), Math.max(0, end - 24), end - minDuration);
            return { ...shift, startAbs: nextStart, duration: end - nextStart };
          }
          const maxEnd = Math.min(horizon, shift.startAbs + 24);
          const nextEnd = clamp(snap(target.day * 24 + target.hour), shift.startAbs + minDuration, maxEnd);
          return { ...shift, duration: nextEnd - shift.startAbs };
        }),
      }));
    }

    function onPointerUp() {
      dragRef.current = null;
    }

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  const totals = useMemo(() => personTotals(plan), [plan]);
  const weekIndexes = useMemo(() => Array.from({ length: plan.weekCount }, (_, week) => week), [plan.weekCount]);
  const dayIndexes = useMemo(() => Array.from({ length: dayCountForWeeks(plan.weekCount) }, (_, day) => day), [plan.weekCount]);
  const weekTotals = useMemo(
    () => weekIndexes.map((week) => plan.people.reduce((sum, person) => sum + (totals[person.id]?.[week] || 0), 0)),
    [plan.people, totals, weekIndexes],
  );
  const coverage = useMemo(() => weekIndexes.map((week) => coverageSummary(plan, week)), [plan, weekIndexes]);
  const totalScheduledHours = weekTotals.reduce((sum, hours) => sum + hours, 0);
  const totalTargetHours = plan.weekTarget * plan.weekCount;
  const totalCoverage = coverage.reduce(
    (sum, item) => ({
      open: sum.open + item.open,
      empty: sum.empty + item.empty,
      short: sum.short + item.short,
      met: sum.met + item.met,
      gap: sum.gap + item.gap,
    }),
    { open: 0, empty: 0, short: 0, met: 0, gap: 0 },
  );
  const selectedShift = plan.shifts.find((shift) => shift.id === plan.selectedShiftId) || null;
  const coverageTargetOptions = useMemo(() => {
    const maxTarget = Math.max(1, plan.people.length, plan.coverageTarget);
    return Array.from({ length: maxTarget }, (_, index) => index + 1);
  }, [plan.coverageTarget, plan.people.length]);

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>, shift: Shift) {
    if (event.button !== 0) return;
    event.preventDefault();
    const target = targetFromPoint(event.clientX, event.clientY);
    const pointerAbs = target ? target.day * 24 + target.hour : shift.startAbs;
    const handle = (event.target as HTMLElement).dataset.handle;
    dragRef.current = {
      id: shift.id,
      mode: handle === "top" || handle === "bottom" ? handle : "move",
      offset: pointerAbs - shift.startAbs,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };
    setPlan((current) => ({ ...current, selectedShiftId: shift.id }));
  }

  function addPerson() {
    const name = newPerson.trim();
    if (!name) return;
    setPlan((current) => {
      const id = `p${nextNumberFromIds(current.people, "p")}`;
      return { ...current, people: [...current.people, { id, name, color: newPersonColor }] };
    });
    setDraftShift((current) => ({ ...current, personId: `p${nextNumberFromIds(plan.people, "p")}` }));
    setNewPerson("");
    setNewPersonColor(fallbackColors[(plan.people.length + 1) % fallbackColors.length]);
  }

  function updateWeekCount(value: unknown) {
    const weekCount = normalizeWeekCount(value);
    setPlan((current) => constrainPlanToWeeks(current, weekCount));
    setDraftShift((current) => ({ ...current, day: clamp(current.day, 0, dayCountForWeeks(weekCount) - 1) }));
  }

  function removePerson(id: string) {
    setPlan((current) => {
      const nextShifts = current.shifts.filter((shift) => shift.personId !== id);
      return {
        ...current,
        people: current.people.filter((person) => person.id !== id),
        shifts: nextShifts,
        selectedShiftId: nextShifts.some((shift) => shift.id === current.selectedShiftId) ? current.selectedShiftId : nextShifts[0]?.id || null,
      };
    });
  }

  function addShift() {
    if (!plan.people.length || !draftShift.personId) return;
    setPlan((current) => {
      if (!current.people.some((person) => person.id === draftShift.personId)) return current;
      const horizon = horizonForWeeks(current.weekCount);
      const start = timeToHour(draftShift.start);
      const end = timeToHour(draftShift.end);
      let duration = end - start;
      if (duration <= 0) duration += 24;
      const startAbs = clamp(draftShift.day * 24 + start, 0, horizon - minDuration);
      duration = clamp(duration, minDuration, Math.min(24, horizon - startAbs));
      const id = `s${nextNumberFromIds(current.shifts, "s")}`;
      return {
        ...current,
        shifts: [...current.shifts, { id, personId: draftShift.personId, startAbs, duration }],
        selectedShiftId: id,
      };
    });
  }

  function updateSelectedShift(updater: (shift: Shift) => Shift) {
    if (!selectedShift) return;
    setPlan((current) => ({
      ...current,
      shifts: current.shifts.map((shift) => (shift.id === selectedShift.id ? updater(shift) : shift)),
    }));
  }

  function removeSelectedShift() {
    if (!selectedShift) return;
    setPlan((current) => {
      const nextShifts = current.shifts.filter((shift) => shift.id !== selectedShift.id);
      return { ...current, shifts: nextShifts, selectedShiftId: nextShifts[0]?.id || null };
    });
  }

  function resetPlan() {
    const customDefault = loadStoredPlan(defaultStorageKey);
    setPlan(customDefault ? clonePlan(customDefault) : cloneDefaultPlan());
    setSaveStatus(customDefault ? "appliedDefault" : "blankReset");
  }

  function setCurrentAsDefault() {
    localStorage.setItem(defaultStorageKey, JSON.stringify(plan));
    setHasCustomDefault(true);
    setSaveStatus("defaultSaved");
  }

  function clearCustomDefault() {
    localStorage.removeItem(defaultStorageKey);
    setHasCustomDefault(false);
    setSaveStatus("defaultCleared");
  }

  function updateCoverageWindow(index: number, patch: Partial<CoverageWindow>) {
    setPlan((current) => {
      const coverageWindows = normalizeCoverageWindows(current.coverageWindows);
      coverageWindows[index] = { ...coverageWindows[index], ...patch };
      return { ...current, coverageWindows };
    });
  }

  function applyCoveragePreset(kind: "weekdays" | "daily" | "full" | "clear") {
    const coverageWindows = defaultCoverageWindows.map((window, index) => {
      if (kind === "weekdays") return { enabled: index < 5, start: 9, end: 18 };
      if (kind === "daily") return { enabled: true, start: 9, end: 18 };
      if (kind === "full") return { enabled: true, start: 0, end: 24 };
      return { ...window, enabled: false };
    });
    setPlan((current) => ({ ...current, coverageWindows }));
  }

  function currentPayload() {
    return {
      exportedAt: new Date().toISOString(),
      weekCount: plan.weekCount,
      weekTarget: plan.weekTarget,
      coverageTarget: plan.coverageTarget,
      coverageWindows: normalizeCoverageWindows(plan.coverageWindows),
      selectedShiftId: plan.selectedShiftId,
      people: plan.people.map((person) => ({ ...person })),
      shifts: plan.shifts
        .slice()
        .sort((a, b) => a.startAbs - b.startAbs || a.personId.localeCompare(b.personId))
        .map((shift) => ({ id: shift.id, personId: shift.personId, startAbs: shift.startAbs, duration: shift.duration })),
    };
  }

  function downloadScheduleCsv() {
    const rows: unknown[][] = [text.csvHeaders];
    plan.shifts
      .slice()
      .sort((a, b) => a.startAbs - b.startAbs || a.personId.localeCompare(b.personId))
      .forEach((shift) => {
        const person = personById(plan.people, shift.personId);
        const start = absParts(shift.startAbs, plan.weekCount);
        const end = absParts(shiftEnd(shift), plan.weekCount);
        rows.push([
          text.csvWeek(Math.floor(start.day / 7) + 1),
          text.dayNames[start.day % 7],
          person?.name || shift.personId,
          fmtExportHour(start.hour),
          dayLabel(end.day, text),
          fmtExportHour(end.hour),
          fmtDuration(shift.duration),
        ]);
      });
    downloadFile("schedule.csv", "text/csv;charset=utf-8", "\ufeff" + csv(rows));
  }

  function downloadHoursCsv() {
    const rows: unknown[][] = [text.hoursCsvHeaders(weekIndexes)];
    plan.people.forEach((person) => {
      const weeks = weekIndexes.map((week) => totals[person.id]?.[week] || 0);
      rows.push([person.name, ...weeks, weeks.reduce((sum, hours) => sum + hours, 0)]);
    });
    downloadFile("hours.csv", "text/csv;charset=utf-8", "\ufeff" + csv(rows));
  }

  function downloadBackupJson() {
    downloadFile("schedule-plan.json", "application/json;charset=utf-8", JSON.stringify(currentPayload(), null, 2));
  }

  function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(filename, blob);
    }, "image/png");
  }

  function downloadWeekPng(week: number) {
    const canvas = document.createElement("canvas");
    canvas.width = exportWeekWidth;
    canvas.height = exportWeekHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawExportWeek(ctx, plan, week, 0, canvas.width, canvas.height, text);
    downloadCanvas(canvas, `schedule-week-${week + 1}.png`);
  }

  function downloadAllWeeksPng() {
    const weekHeight = exportWeekHeight;
    const canvas = document.createElement("canvas");
    canvas.width = exportWeekWidth;
    canvas.height = weekHeight * plan.weekCount;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    weekIndexes.forEach((week) => drawExportWeek(ctx, plan, week, week * weekHeight, canvas.width, weekHeight, text));
    downloadCanvas(canvas, `schedule-${plan.weekCount}-weeks.png`);
  }

  function importJson(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = validatePlan(JSON.parse(String(reader.result || "")));
        if (parsed) {
          setPlan(parsed);
          setSaveStatus("imported");
        }
      } catch {
        setSaveStatus("importFailed");
      }
    };
    reader.readAsText(file);
  }

  const selectedDay = selectedShift ? clamp(Math.floor(selectedShift.startAbs / 24), 0, dayCountForWeeks(plan.weekCount) - 1) : 0;
  const selectedStart = selectedShift ? fmtHour(selectedShift.startAbs - selectedDay * 24) : "08:00";
  const selectedEnd = selectedShift ? fmtHour(selectedShift.startAbs + selectedShift.duration - selectedDay * 24) : "18:00";

  return (
    <main className="schedulerShell">
      <header className="topbar">
        <div className="brandLockup">
          <span className="brandMark"><CalendarClock size={20} /></span>
          <h1>{text.appTitle}</h1>
        </div>
        <div className="topActions">
          <label className="languagePicker">
            <span>{text.language}</span>
            <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} aria-label={text.language}>
              {languageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <span className="savePill"><Save size={15} />{text.saveStatus[saveStatus]}</span>
          <button type="button" onClick={resetPlan}><RotateCcw size={16} />{text.resetDefault}</button>
          <button type="button" onClick={setCurrentAsDefault}><Save size={16} />{text.setDefault}</button>
          <button className="primary" type="button" onClick={downloadAllWeeksPng}><ImageDown size={16} />{text.exportAllPng}</button>
          <button className="topIconButton" type="button" onClick={() => setHelpOpen(true)} aria-label={text.helpButton} title={text.helpButton}>
            <HelpCircle size={17} />
          </button>
        </div>
      </header>

      <section className="setupDeck" aria-label={text.appControls}>
        <section className="setupPanel peopleSetupPanel" aria-labelledby="people-setup-title">
          <div className="setupPanelHeader">
            <div className="setupTitle">
              <UserPlus size={17} />
              <h2 id="people-setup-title">{text.peopleSetup}</h2>
            </div>
            <span className="countBadge">{text.peopleCount(plan.people.length)}</span>
          </div>
          <div className="rosterControlGrid">
            <label>
              <span>{text.name}</span>
              <input value={newPerson} onChange={(event) => setNewPerson(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addPerson()} placeholder={text.namePlaceholder} />
            </label>
            <label>
              <span>{text.color}</span>
              <input type="color" value={newPersonColor} onChange={(event) => setNewPersonColor(event.target.value)} />
            </label>
            <button className="primary addPersonButton" type="button" onClick={addPerson}><UserPlus size={16} />{text.addPerson}</button>
          </div>
          <div className="personChips" aria-label={text.currentPeople}>
            {!plan.people.length && <span className="mutedText">{text.noPeople}</span>}
            {plan.people.map((person) => (
              <span className="personChip" key={person.id} style={{ "--person-color": person.color } as CSSProperties}>
                <span className="dot" />
                <span className="personChipName">{person.name}</span>
                <button className="chipDeleteButton" type="button" aria-label={text.removePerson(person.name)} onClick={() => removePerson(person.id)}>
                  <Trash2 size={13} />
                </button>
              </span>
            ))}
          </div>
        </section>

        <section className="setupPanel targetSetupPanel" aria-labelledby="target-setup-title">
          <div className="setupPanelHeader">
            <div className="setupTitle">
              <Calculator size={17} />
              <h2 id="target-setup-title">{text.targetSetup}</h2>
            </div>
            <span className="countBadge">{text.weekCountBadge(plan.weekCount)}</span>
          </div>
          <div className="targetControlGrid">
            <label>
              <span>{text.weekCount}</span>
              <select value={plan.weekCount} onChange={(event) => updateWeekCount(event.target.value)}>
                {weekCountOptions.map((count) => <option key={count} value={count}>{text.weekOption(count)}</option>)}
              </select>
            </label>
            <label>
              <span>{text.weeklyTarget}</span>
              <input type="number" min={0} step={1} value={plan.weekTarget} onChange={(event) => setPlan((current) => ({ ...current, weekTarget: Number(event.target.value) || 0 }))} />
            </label>
            <label>
              <span>{text.coverageTarget}</span>
              <select
                value={plan.coverageTarget}
                onChange={(event) => setPlan((current) => ({ ...current, coverageTarget: normalizeCoverageTarget(event.target.value, current.people.length) }))}
                disabled={!plan.people.length}
              >
                {!plan.people.length && <option value={plan.coverageTarget}>{text.addPeopleFirst}</option>}
                {plan.people.length > 0 && coverageTargetOptions.map((count) => <option key={count} value={count}>{text.personOption(count)}</option>)}
              </select>
            </label>
          </div>
        </section>

      </section>

      <section className={`workspace ${plan.weekCount === 1 ? "singleWeekWorkspace" : ""}`}>
        <div className="weeks">
          {weekIndexes.map((week) => (
            <WeekCard key={week} plan={plan} week={week} totals={totals} onPointerDown={handlePointerDown} text={text} />
          ))}
        </div>

        <aside className="sidePanel">
          <section className="sideSection shiftBuilderSection" aria-labelledby="shift-setup-title">
            <div className="sectionTitle">
              <span id="shift-setup-title">{text.shift}</span>
              <span className="countBadge">{text.shiftCount(plan.shifts.length)}</span>
            </div>
            <div className="shiftControlGrid">
              <label>
                <span>{text.person}</span>
                <select value={draftShift.personId} onChange={(event) => setDraftShift((current) => ({ ...current, personId: event.target.value }))} disabled={!plan.people.length}>
                  {!plan.people.length && <option value="">{text.addPeopleFirst}</option>}
                  {plan.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                </select>
              </label>
              <label>
                <span>{text.date}</span>
                <select value={draftShift.day} onChange={(event) => setDraftShift((current) => ({ ...current, day: Number(event.target.value) }))}>
                  {dayIndexes.map((day) => <option key={day} value={day}>{dayLabel(day, text)}</option>)}
                </select>
              </label>
              <label>
                <span>{text.start}</span>
                <input type="time" step={1800} value={draftShift.start} onChange={(event) => setDraftShift((current) => ({ ...current, start: event.target.value }))} />
              </label>
              <label>
                <span>{text.end}</span>
                <input type="time" step={1800} value={draftShift.end} onChange={(event) => setDraftShift((current) => ({ ...current, end: event.target.value }))} />
              </label>
              <button className="primary addShiftButton" type="button" onClick={addShift} disabled={!plan.people.length}><Plus size={16} />{text.addShift}</button>
            </div>
          </section>

          <section className="sideSection">
            <div className="sectionTitle">{text.selectedShift}</div>
            {selectedShift ? (
              <div className="editGrid">
                <label>
                  <span>{text.person}</span>
                  <select value={selectedShift.personId} onChange={(event) => updateSelectedShift((shift) => ({ ...shift, personId: event.target.value }))}>
                    {plan.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                  </select>
                </label>
                <label>
                  <span>{text.date}</span>
                  <select value={selectedDay} onChange={(event) => updateSelectedShift((shift) => {
                    const day = Number(event.target.value);
                    const startHour = shift.startAbs - Math.floor(shift.startAbs / 24) * 24;
                    const horizon = horizonForWeeks(plan.weekCount);
                    const startAbs = clamp(day * 24 + startHour, 0, horizon - shift.duration);
                    return { ...shift, startAbs };
                  })}>
                    {dayIndexes.map((day) => <option key={day} value={day}>{dayLabel(day, text)}</option>)}
                  </select>
                </label>
                <label>
                  <span>{text.start}</span>
                  <input type="time" step={1800} value={selectedStart} onChange={(event) => updateSelectedShift((shift) => {
                    const day = Math.floor(shift.startAbs / 24);
                    const horizon = horizonForWeeks(plan.weekCount);
                    const startAbs = clamp(day * 24 + timeToHour(event.target.value), 0, horizon - shift.duration);
                    return { ...shift, startAbs };
                  })} />
                </label>
                <label>
                  <span>{text.end}</span>
                  <input type="time" step={1800} value={selectedEnd} onChange={(event) => updateSelectedShift((shift) => {
                    const day = Math.floor(shift.startAbs / 24);
                    const startHour = shift.startAbs - day * 24;
                    let duration = timeToHour(event.target.value) - startHour;
                    if (duration <= 0) duration += 24;
                    const horizon = horizonForWeeks(plan.weekCount);
                    return { ...shift, duration: clamp(duration, minDuration, Math.min(24, horizon - shift.startAbs)) };
                  })} />
                </label>
                <button className="danger full" type="button" onClick={removeSelectedShift}><Trash2 size={16} />{text.deleteShift}</button>
              </div>
            ) : (
              <p className="mutedText">{text.selectedHint}</p>
            )}
          </section>

          <section className="sideSection">
            <div className="sectionTitle">{text.totalStats}</div>
            <div className="metricGrid">
              <article><span>{text.totalHours}</span><strong>{fmtDuration(totalScheduledHours)}</strong><small>{text.target} {fmtDuration(totalTargetHours)}</small></article>
              <article><span>{text.averagePerWeek}</span><strong>{fmtDuration(totalScheduledHours / plan.weekCount)}</strong><small>{text.target} {fmtDuration(plan.weekTarget)}</small></article>
              <article><span>{text.coverageMet}</span><strong>{fmtDuration(totalCoverage.met)}</strong><small>{text.needed} {fmtDuration(totalCoverage.open)}</small></article>
              <article><span>{text.coverageGap}</span><strong>{fmtDuration(totalCoverage.gap)}</strong><small>{text.empty} {fmtDuration(totalCoverage.empty)}</small></article>
            </div>
          </section>

          <section className="sideSection">
            <div className="sectionTitle">{text.hours}</div>
            <div className="tableScroll">
              <table>
                <thead>
                  <tr>
                    <th>{text.person}</th>
                    {weekIndexes.map((week) => <th key={week}>{text.week(week + 1)}</th>)}
                    <th>{text.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {!plan.people.length && (
                    <tr>
                      <td colSpan={weekIndexes.length + 2}>{text.noPeopleTable}</td>
                    </tr>
                  )}
                  {plan.people.map((person) => {
                    const weeks = weekIndexes.map((week) => totals[person.id]?.[week] || 0);
                    return (
                      <tr key={person.id}>
                        <td><span className="personName" style={{ "--person-color": person.color } as CSSProperties}><span className="dot" />{person.name}</span></td>
                        {weeks.map((hours, index) => <td key={index}>{fmtDuration(hours)}</td>)}
                        <td>{fmtDuration(weeks.reduce((sum, hours) => sum + hours, 0))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="sideSection">
            <div className="sectionTitle">{text.people}</div>
            <div className="peopleList">
              {!plan.people.length && <p className="mutedText">{text.noPeopleAbove}</p>}
              {plan.people.map((person) => (
                <div className="personRow" key={person.id} style={{ "--person-color": person.color } as CSSProperties}>
                  <span className="personName"><span className="dot" />{person.name}</span>
                  <button className="iconButton" type="button" aria-label={text.removePerson(person.name)} onClick={() => removePerson(person.id)}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          </section>

          <section className="sideSection">
            <div className="sectionTitle">{text.coverageWindows}</div>
            <div className="presetGrid">
              <button type="button" onClick={() => applyCoveragePreset("weekdays")}><CalendarClock size={16} />{text.weekdaysPreset}</button>
              <button type="button" onClick={() => applyCoveragePreset("daily")}><CalendarClock size={16} />{text.dailyPreset}</button>
              <button type="button" onClick={() => applyCoveragePreset("full")}><Clock3 size={16} />{text.fullDayPreset}</button>
              <button type="button" onClick={() => applyCoveragePreset("clear")}><Eraser size={16} />{text.clearPreset}</button>
            </div>
            <div className="coverageSettings">
              {normalizeCoverageWindows(plan.coverageWindows).map((window, index) => (
                <div className="coverageRow" key={text.dayNames[index]}>
                  <label className="checkLabel">
                    <input
                      type="checkbox"
                      checked={window.enabled}
                      onChange={(event) => updateCoverageWindow(index, { enabled: event.target.checked })}
                    />
                    <span>{text.dayNames[index]}</span>
                  </label>
                  <select
                    value={selectHourValue(window.start)}
                    disabled={!window.enabled}
                    onChange={(event) => updateCoverageWindow(index, { start: Number(event.target.value) })}
                    aria-label={text.coverageStartAria(text.dayNames[index])}
                  >
                    {timeOptions.map((hour) => <option key={hour} value={selectHourValue(hour)}>{fmtExportHour(hour)}</option>)}
                  </select>
                  <select
                    value={selectHourValue(window.end)}
                    disabled={!window.enabled}
                    onChange={(event) => updateCoverageWindow(index, { end: Number(event.target.value) })}
                    aria-label={text.coverageEndAria(text.dayNames[index])}
                  >
                    {timeOptions.map((hour) => <option key={hour} value={selectHourValue(hour)}>{fmtExportHour(hour)}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </section>

          <section className="sideSection">
            <div className="sectionTitle">{text.export}</div>
            <div className="exportGrid">
              <button type="button" onClick={downloadScheduleCsv}><Table2 size={16} />{text.scheduleCsv}</button>
              <button type="button" onClick={downloadHoursCsv}><Calculator size={16} />{text.hoursCsv}</button>
              {weekIndexes.map((week) => (
                <button type="button" key={week} onClick={() => downloadWeekPng(week)}><ImageDown size={16} />{text.weekPng(week + 1)}</button>
              ))}
              <button type="button" onClick={downloadAllWeeksPng}><FileDown size={16} />{text.allWeeksPng}</button>
              <button type="button" onClick={downloadBackupJson}><Archive size={16} />{text.backupJson}</button>
              <button type="button" onClick={() => fileInputRef.current?.click()}><Upload size={16} />{text.importJson}</button>
              <button type="button" onClick={() => window.print()}><Printer size={16} />{text.printPdf}</button>
              <input ref={fileInputRef} className="hiddenInput" type="file" accept="application/json,.json" onChange={(event) => importJson(event.target.files?.[0] || null)} />
            </div>
          </section>

          <section className="sideSection">
            <div className="sectionTitle">{text.preset}</div>
            <div className="exportGrid">
              <button type="button" onClick={setCurrentAsDefault}><Save size={16} />{text.setDefault}</button>
              <button type="button" onClick={resetPlan}><RotateCcw size={16} />{text.resetDefault}</button>
              <button type="button" onClick={clearCustomDefault} disabled={!hasCustomDefault}><Eraser size={16} />{text.clearCustomDefault}</button>
            </div>
            <p className="mutedText">{hasCustomDefault ? text.customDefaultHint : text.blankDefaultHint}</p>
          </section>
        </aside>
      </section>
      {helpOpen && (
        <div className="helpDialogBackdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setHelpOpen(false);
        }}>
          <section className="helpDialog" role="dialog" aria-modal="true" aria-labelledby="help-dialog-title">
            <div className="helpDialogHeader">
              <h2 id="help-dialog-title">{text.helpTitle}</h2>
              <button className="iconButton" type="button" onClick={() => setHelpOpen(false)} aria-label={text.helpClose} title={text.helpClose}>
                <X size={16} />
              </button>
            </div>
            <p>{text.helpIntro}</p>
            <ol className="helpSteps">
              {text.helpSteps.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <aside className="helpNote" aria-label={text.helpStorageTitle}>
              <h3>{text.helpStorageTitle}</h3>
              <p>{text.helpStorageBody}</p>
            </aside>
            <aside className="helpNote helpLicenseNote" aria-label={text.helpLicenseTitle}>
              <h3>{text.helpLicenseTitle}</h3>
              <p>{text.helpLicenseBody}</p>
            </aside>
            <div className="helpCredit">{text.creditLine}</div>
          </section>
        </div>
      )}
    </main>
  );
}
