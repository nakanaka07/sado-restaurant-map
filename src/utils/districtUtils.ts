/**
 * 佐渡島の地区判定ユーティリティ
 * 住所文字列から佐渡の地区を判定
 */

import type { SadoDistrict } from "../types/restaurant.types";

/**
 * 佐渡の地区キーワードマッピング
 * より具体的な地名から地区を判定
 */
const DISTRICT_KEYWORDS: Record<string, SadoDistrict> = {
  // 両津地区
  両津: "両津",
  夷: "両津",
  加茂歌代: "両津",
  潟上: "両津",
  河崎: "両津",
  秋津: "両津",
  上矢馳: "両津",
  下矢馳: "両津",
  多田: "両津",
  浜河内: "両津",
  旭: "両津",
  湊: "両津",
  原黒: "両津",
  椿尾: "両津",
  梅津: "両津",
  立間: "両津",

  // 相川地区
  相川: "相川",
  下戸炭目: "相川",
  上戸炭目: "相川",
  戸中: "相川",
  戸地: "相川",
  五十里: "相川",
  橘: "相川",
  北立島: "相川",
  南立島: "相川",
  相川下戸村: "相川",
  相川北沢町: "相川",
  相川南沢町: "相川",
  相川材木町: "相川",
  相川四町目: "相川",
  相川一町目: "相川",
  相川二町目: "相川",
  相川三町目: "相川",
  相川五町目: "相川",
  相川六町目: "相川",
  相川下山之神町: "相川",
  相川鹿伏: "相川",
  相川大間: "相川",
  相川諏訪町: "相川",
  相川羽田町: "相川",
  相川海士町: "相川",
  相川米屋町: "相川",
  相川下戸浜町: "相川",
  相川炭屋町: "相川",
  相川左門町: "相川",
  相川濁川町: "相川",
  相川栄町: "相川",
  相川銀山町: "相川",
  相川板町: "相川",
  相川柴町: "相川",
  高瀬: "相川",

  // 佐和田地区
  佐和田: "佐和田",
  沢根: "佐和田",
  河原田: "佐和田",
  山田: "佐和田",
  窪田: "佐和田",
  長木: "佐和田",
  市野沢: "佐和田",
  真光寺: "佐和田",
  中原: "佐和田",
  吾潟: "佐和田",

  // 金井地区
  金井: "金井",
  千種: "金井",
  中興: "金井",
  泉: "金井",
  大和: "金井",
  下新穂: "金井",
  岩首: "金井",
  野浦: "金井",
  宿根木: "金井",

  // 新穂地区
  新穂: "新穂",
  新穂舟下: "新穂",
  新穂大野: "新穂",
  新穂潟上: "新穂",
  新穂青木: "新穂",
  新穂井内: "新穂",
  新穂皆川: "新穂",
  新穂瓜生屋: "新穂",
  新穂正明寺: "新穂",
  新穂武井: "新穂",
  新穂長畝: "新穂",

  // 畑野地区
  畑野: "畑野",
  小倉: "畑野",
  猿八: "畑野",
  宮川: "畑野",
  目黒町: "畑野",
  丸山: "畑野",
  飯持: "畑野",
  栗野江: "畑野",
  三宮: "畑野",

  // 真野地区
  真野: "真野",
  真野新町: "真野",
  背合: "真野",
  四日町: "真野",
  吉岡: "真野",
  豊田: "真野",
  国分寺: "真野",
  竹田: "真野",
  静平: "真野",
  大須: "真野",

  // 小木地区
  小木: "小木",
  小木町: "小木",
  小木大浦: "小木",
  田野浦: "小木",
  琴浦: "小木",
  水津: "小木",
  木野浦: "小木",
  深浦: "小木",
  犬神平: "小木",
  小比叡: "小木",
  見立: "小木",
  大杉: "小木",
  江積: "小木",

  // 羽茂地区
  羽茂: "羽茂",
  羽茂本郷: "羽茂",
  羽茂大崎: "羽茂",
  羽茂上山田: "羽茂",
  羽茂小泊: "羽茂",
  羽茂三瀬: "羽茂",
  羽茂飯岡: "羽茂",
  羽茂亀脇: "羽茂",

  // 赤泊地区
  赤泊: "赤泊",
  柳沢: "赤泊",
  南新保: "赤泊",
  杉野浦: "赤泊",
  莚場: "赤泊",
  徳和: "赤泊",
};

/**
 * 住所文字列から佐渡の地区を判定
 * @param address 住所文字列
 * @returns 判定された地区、判定できない場合は "その他"
 */
export const getDistrictFromAddress = (address: string): SadoDistrict => {
  if (!address || typeof address !== "string") {
    return "その他";
  }

  // 住所を正規化（余分な空白を削除、統一文字に変換）
  const normalizedAddress = address
    .trim()
    .replace(/\s+/g, "")
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0)) // 全角数字を半角に
    .replace(/[Ａ-Ｚａ-ｚ]/g, (s) =>
      String.fromCharCode(s.charCodeAt(0) - 0xfee0)
    ); // 全角英字を半角に

  // 地区キーワードでマッチング（長いキーワードから順にチェック）
  const sortedKeywords = Object.keys(DISTRICT_KEYWORDS).sort(
    (a, b) => b.length - a.length
  );

  for (const keyword of sortedKeywords) {
    if (normalizedAddress.includes(keyword)) {
      return DISTRICT_KEYWORDS[keyword];
    }
  }

  // 佐渡市から始まる場合の特別処理
  if (normalizedAddress.startsWith("佐渡市")) {
    const addressWithoutCity = normalizedAddress.substring(3);
    for (const keyword of sortedKeywords) {
      if (addressWithoutCity.includes(keyword)) {
        return DISTRICT_KEYWORDS[keyword];
      }
    }
  }

  // 新潟県佐渡市から始まる場合の特別処理
  if (normalizedAddress.startsWith("新潟県佐渡市")) {
    const addressWithoutPrefecture = normalizedAddress.substring(5);
    for (const keyword of sortedKeywords) {
      if (addressWithoutPrefecture.includes(keyword)) {
        return DISTRICT_KEYWORDS[keyword];
      }
    }
  }

  // どの地区にも該当しない場合
  console.warn(`地区を判定できませんでした: ${address}`);
  return "その他";
};

/**
 * 地区名の正規化（入力された地区名を正しい地区名に変換）
 * @param district 入力された地区名
 * @returns 正規化された地区名
 */
export const normalizeDistrict = (district: string): SadoDistrict => {
  if (!district || typeof district !== "string") {
    return "その他";
  }

  const normalized = district.trim();

  // 完全一致チェック
  const validDistricts: SadoDistrict[] = [
    "両津",
    "相川",
    "佐和田",
    "金井",
    "新穂",
    "畑野",
    "真野",
    "小木",
    "羽茂",
    "赤泊",
    "その他",
  ];

  if (validDistricts.includes(normalized as SadoDistrict)) {
    return normalized as SadoDistrict;
  }

  // 部分一致による判定
  for (const validDistrict of validDistricts) {
    if (normalized.includes(validDistrict)) {
      return validDistrict;
    }
  }

  return "その他";
};

/**
 * 指定された地区が有効な佐渡の地区かどうかをチェック
 * @param district チェックする地区名
 * @returns 有効な地区の場合 true
 */
export const isValidDistrict = (district: string): district is SadoDistrict => {
  const validDistricts: SadoDistrict[] = [
    "両津",
    "相川",
    "佐和田",
    "金井",
    "新穂",
    "畑野",
    "真野",
    "小木",
    "羽茂",
    "赤泊",
    "その他",
  ];

  return validDistricts.includes(district as SadoDistrict);
};

/**
 * 全ての有効な地区のリストを取得
 * @returns 有効な地区の配列
 */
export const getAllDistricts = (): readonly SadoDistrict[] => {
  return [
    "両津",
    "相川",
    "佐和田",
    "金井",
    "新穂",
    "畑野",
    "真野",
    "小木",
    "羽茂",
    "赤泊",
    "その他",
  ] as const;
};
