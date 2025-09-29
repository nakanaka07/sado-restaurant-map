/**
 * 佐渡島地区分類ユーティリティ
 *
 * @fileoverview 住所文字列から佐渡市の地区を判定するためのユーティリティ関数群
 * @version 2.0.0 - 佐渡市公式データ準拠版
 * @since 1.0.0
 * @author GitHub Copilot AI Assistant
 *
 * @description
 * 佐渡市の11地区（両津、相川、佐和田、金井、新穂、畑野、真野、小木、羽茂、赤泊、その他）への
 * 住所文字列からの自動分類機能を提供します。
 *
 * 主な機能:
 * - 住所文字列からの地区自動判定
 * - 地区名の正規化
 * - 佐渡市公式の地区分類に準拠（2025年8月20日 佐渡市公式サイト準拠）
 * - 未判定住所の記録・報告機能
 *
 * @see https://www.city.sado.niigata.jp/soshiki/2002/2359.html
 */

import postalDistrictMap from "@/data/postalDistrictMap.json" assert { type: "json" };
import type { SadoDistrict } from "@/types";

// =============================
// 正規化/エイリアス補助定義
// =============================
/** 異体字 / 表記ゆれ文字の置換マップ */
const VARIANT_CHAR_MAP: Record<string, string> = {
  佛: "仏", // 阿佛坊 → 阿仏坊
  // 追加候補: '﨑': '崎' など必要になったら拡張
};

/** 住所内のノイズ要素除去用 (逆ジオコード由来の冗長語/郵便番号など) */
const NOISE_PATTERNS: RegExp[] = [
  /日本/g,
  /新潟県/g, // 県名は判定に不要
  /\d{3}-?\d{4}/g, // 郵便番号
];

/** キーワード辞書に存在しない短縮・略記表現のエイリアス */
const DISTRICT_ALIASES: Record<string, SadoDistrict> = {
  // 逆ジオ/手入力で "佐渡市奈良町" の形が来るケース → 相川地区
  奈良町: "相川",
};

/**
 * 判定できなかった住所を記録するセット（開発環境用）
 */
const unknownAddresses = new Set<string>();

/**
 * 佐渡の地区キーワードマッピング（佐渡市公式データ準拠）
 * より具体的な地名から地区を判定
 *
 * @description
 * 住所に含まれるキーワードから対応する地区を特定するためのマッピング。
 * 長いキーワードから順にチェックすることで、より具体的な判定を実現。
 * 佐渡市公式サイト（2025年8月20日現在）のデータに完全準拠。
 *
 * @see https://www.city.sado.niigata.jp/soshiki/2002/2359.html
 * @internal
 */
const DISTRICT_KEYWORDS: Record<string, SadoDistrict> = {
  // ========================================
  // 両津地区（公式データより）
  // ========================================
  両津湊: "両津",
  両津夷: "両津",
  両津夷新: "両津",
  両津大川: "両津",
  両津福浦一丁目: "両津",
  両津福浦二丁目: "両津",
  両津福浦三丁目: "両津",
  両津: "両津",
  春日: "両津",
  浜田: "両津",
  加茂歌代: "両津",
  梅津: "両津",
  羽吉: "両津",
  椿: "両津",
  北五十里: "両津",
  白瀬: "両津",
  玉崎: "両津",
  和木: "両津",
  馬首: "両津",
  北松ケ崎: "両津",
  平松: "両津",
  浦川: "両津",
  歌見: "両津",
  黒姫: "両津",
  虫崎: "両津", // 公式データで確認：両津地区
  羽二生: "両津",
  両尾: "両津",
  椎泊: "両津",
  真木: "両津",
  河崎: "両津",
  下久知: "両津",
  久知河内: "両津",
  城腰: "両津",
  住吉: "両津",
  原黒: "両津",
  吾潟: "両津",
  立野: "両津",
  上横山: "両津",
  長江: "両津",
  秋津: "両津",
  潟端: "両津",
  下横山: "両津",
  旭: "両津",
  水津: "両津",
  片野尾: "両津",
  月布施: "両津",
  野浦: "両津", // 公式データで確認：両津地区
  東強清水: "両津",
  東立島: "両津",
  岩首: "両津", // 公式データで確認：両津地区
  東鵜島: "両津",
  柿野浦: "両津",
  豊岡: "両津",
  立間: "両津",
  赤玉: "両津",
  蚫: "両津",
  北小浦: "両津",
  見立: "両津",
  鷲崎: "両津",
  願: "両津",
  北鵜島: "両津",
  真更川: "両津",
  藻浦: "両津",

  // ========================================
  // 相川地区（公式データより）
  // ========================================
  相川大浦: "相川",
  相川水金町: "相川",
  相川柴町: "相川",
  相川大間町: "相川",
  相川紙屋町: "相川",
  相川炭屋町: "相川",
  相川濁川町: "相川",
  相川坂下町: "相川",
  相川北沢町: "相川",
  相川下山之神町: "相川",
  相川柄杓町: "相川",
  相川奈良町: "相川",
  相川嘉左衛門町: "相川",
  相川清右衛門町: "相川",
  相川銀山町: "相川",
  相川小右衛門町: "相川",
  相川勘四郎町: "相川",
  上相川町: "相川",
  相川五郎右衛門町: "相川",
  相川宗徳町: "相川",
  相川庄右衛門町: "相川",
  相川次助町: "相川",
  相川諏訪町: "相川",
  相川大工町: "相川",
  相川新五郎町: "相川",
  相川六右衛門町: "相川",
  相川上京町: "相川",
  相川左門町: "相川",
  相川大床屋町: "相川",
  相川中京町: "相川",
  相川下京町: "相川",
  相川八百屋町: "相川",
  相川会津町: "相川",
  相川味噌屋町: "相川",
  相川米屋町: "相川",
  相川夕白町: "相川",
  相川弥十郎町: "相川",
  相川四十物町: "相川",
  相川広間町: "相川",
  相川西坂町: "相川",
  相川長坂町: "相川",
  相川上寺町: "相川",
  相川中寺町: "相川",
  相川下寺町: "相川",
  相川南沢町: "相川",
  相川小六町: "相川",
  相川新西坂町: "相川",
  相川石扣町: "相川",
  相川塩屋町: "相川",
  相川板町: "相川",
  相川材木町: "相川",
  相川新材木町: "相川",
  相川羽田町: "相川",
  相川江戸沢町: "相川",
  相川一町目: "相川",
  相川一町目裏町: "相川",
  相川一町目浜町: "相川",
  相川二町目: "相川",
  相川五郎左衛門町: "相川",
  相川二町目浜町: "相川",
  相川二町目新浜町: "相川",
  相川三町目: "相川",
  相川三町目浜町: "相川",
  相川三町目新浜町: "相川",
  相川四町目: "相川",
  相川四町目浜町: "相川",
  相川市町: "相川",
  相川新浜町: "相川",
  相川馬町: "相川",
  相川羽田村: "相川",
  相川下戸町: "相川",
  相川下戸浜町: "相川",
  相川下戸炭屋町: "相川",
  相川下戸炭屋裏町: "相川",
  相川下戸炭屋浜町: "相川",
  相川海士町: "相川",
  相川下戸村: "相川",
  相川鹿伏: "相川",
  相川栄町: "相川",
  相川: "相川",
  下相川: "相川",
  高瀬: "相川",
  橘: "相川",
  稲鯨: "相川",
  米郷: "相川",
  二見: "相川",
  小川: "相川",
  達者: "相川",
  姫津: "相川",
  北狄: "相川",
  戸地: "相川",
  戸中: "相川",
  南片辺: "相川",
  北片辺: "相川",
  石花: "相川",
  後尾: "相川",
  北川内: "相川",
  北立島: "相川",
  入川: "相川",
  高千: "相川",
  北田野浦: "相川",
  小野見: "相川",
  石名: "相川",
  小田: "相川",
  大倉: "相川",
  矢柄: "相川",
  関: "相川",
  五十浦: "相川",
  岩谷口: "相川",

  // ========================================
  // 佐和田地区（公式データより）
  // ========================================
  八幡: "佐和田",
  八幡新町: "佐和田",
  八幡町: "佐和田",
  河原田本町: "佐和田",
  河原田諏訪町: "佐和田",
  河原田: "佐和田",
  中原: "佐和田",
  鍛冶町: "佐和田",
  石田: "佐和田",
  上長木: "佐和田",
  下長木: "佐和田",
  長木: "佐和田",
  上矢馳: "佐和田",
  二宮: "佐和田",
  市野沢: "佐和田",
  真光寺: "佐和田",
  山田: "佐和田",
  青野: "佐和田",
  窪田: "佐和田",
  東大通: "佐和田",
  沢根五十里: "佐和田",
  沢根篭町: "佐和田",
  沢根炭屋町: "佐和田",
  沢根: "佐和田",
  沢根町: "佐和田",
  佐和田: "佐和田",

  // ========================================
  // 金井地区（公式データより）
  // ========================================
  平清水: "金井",
  泉: "金井",
  中興: "金井",
  千種: "金井",
  金井新保: "金井",
  貝塚: "金井",
  吉井: "金井",
  大和: "金井",
  吉井本郷: "金井",
  安養寺: "金井",
  三瀬川: "金井",
  水渡田: "金井",
  金井: "金井",

  // ========================================
  // 新穂地区（公式データより）
  // ========================================
  新穂皆川: "新穂",
  新穂舟下: "新穂",
  下新穂: "新穂",
  新穂武井: "新穂",
  新穂大野: "新穂",
  新穂井内: "新穂",
  上新穂: "新穂",
  新穂瓜生屋: "新穂",
  新穂正明寺: "新穂",
  新穂田野沢: "新穂",
  新穂潟上: "新穂",
  新穂青木: "新穂",
  新穂長畝: "新穂",
  新穂北方: "新穂",
  新穂: "新穂",

  // ========================================
  // 畑野地区（公式データより）
  // ========================================
  畑野: "畑野",
  寺田: "畑野", // 公式データで確認：畑野地区
  飯持: "畑野",
  宮川: "畑野",
  三宮: "畑野",
  畉田: "畑野",
  大久保: "畑野",
  猿八: "畑野",
  小倉: "畑野",
  長谷: "畑野",
  坊ケ浦: "畑野",
  栗野江: "畑野",
  目黒町: "畑野",
  松ケ崎: "畑野", // 公式データで確認：畑野地区
  多田: "畑野",
  浜河内: "畑野",
  丸山: "畑野",

  // ========================================
  // 真野地区（公式データより）
  // ========================================
  金丸: "真野",
  四日町: "真野",
  長石: "真野",
  真野新町: "真野",
  豊田: "真野",
  滝脇: "真野",
  背合: "真野",
  大須: "真野",
  静平: "真野",
  下黒山: "真野",
  真野: "真野",
  吉岡: "真野",
  真野大川: "真野",
  名古屋: "真野",
  国分寺: "真野",
  竹田: "真野",
  阿仏坊: "真野",
  大小: "真野",
  大倉谷: "真野",
  田切須: "真野",
  西三川: "真野", // 公式データで確認：真野地区
  椿尾: "真野",

  // ========================================
  // 小木地区（公式データより）
  // ========================================
  小木町: "小木",
  小木木野浦: "小木",
  小比叡: "小木",
  小木堂釜: "小木",
  井坪: "小木",
  小木大浦: "小木",
  木流: "小木",
  田野浦: "小木",
  江積: "小木",
  沢崎: "小木",
  深浦: "小木",
  犬神平: "小木",
  小木強清水: "小木",
  宿根木: "小木", // 公式データで確認：小木地区
  琴浦: "小木",
  小木: "小木",
  小木金田新田: "小木",

  // ========================================
  // 羽茂地区（公式データより）
  // ========================================
  羽茂滝平: "羽茂",
  羽茂大崎: "羽茂",
  羽茂飯岡: "羽茂",
  羽茂上山田: "羽茂",
  羽茂本郷: "羽茂",
  羽茂大橋: "羽茂",
  羽茂大石: "羽茂",
  羽茂三瀬: "羽茂",
  羽茂村山: "羽茂",
  羽茂亀脇: "羽茂",
  羽茂小泊: "羽茂",
  羽茂: "羽茂",

  // ========================================
  // 赤泊地区（公式データより）
  // ========================================
  大杉: "赤泊",
  杉野浦: "赤泊",
  南新保: "赤泊",
  柳沢: "赤泊",
  真浦: "赤泊",
  赤泊: "赤泊",
  徳和: "赤泊",
  三川: "赤泊",
  莚場: "赤泊",
  外山: "赤泊",
  上川茂: "赤泊",
  下川茂: "赤泊",
};

/**
 * 住所の正規化処理
 * @param address 住所文字列
 * @returns 正規化された住所
 */
const normalizeAddress = (address: string): string => {
  let normalized = address
    .trim()
    .replace(/\s+/g, "")
    .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xfee0)) // 全角数字→半角
    .replace(/[Ａ-Ｚａ-ｚ]/g, s =>
      String.fromCharCode(s.charCodeAt(0) - 0xfee0)
    ); // 全角英字→半角

  // 異体字置換
  normalized = normalized.replace(/./g, ch => VARIANT_CHAR_MAP[ch] ?? ch);

  // ノイズ除去
  for (const pattern of NOISE_PATTERNS) {
    normalized = normalized.replace(pattern, "");
  }

  // 連続ハイフン/残留記号の簡易整理（郵便番号除去後の残骸対策）
  normalized = normalized.replace(/--+/g, "-");

  return normalized;
};

/**
 * キーワードベースの地区判定
 * @param normalizedAddress 正規化された住所
 * @returns 判定された地区、判定できない場合は null
 */
const findDistrictByKeywords = (
  normalizedAddress: string
): SadoDistrict | null => {
  // 地区キーワードでマッチング（長いキーワードから順にチェック）
  const sortedKeywords = Object.keys(DISTRICT_KEYWORDS).sort(
    (a, b) => b.length - a.length
  );

  for (const keyword of sortedKeywords) {
    if (normalizedAddress.includes(keyword)) {
      return DISTRICT_KEYWORDS[keyword];
    }
  }

  // エイリアス判定 (短縮表現など)
  for (const alias in DISTRICT_ALIASES) {
    if (normalizedAddress.includes(alias)) {
      return DISTRICT_ALIASES[alias];
    }
  }

  return null;
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

  // 住所を正規化
  const normalizedAddress = normalizeAddress(address);

  // 基本的なキーワードマッチング
  let district = findDistrictByKeywords(normalizedAddress);
  if (district) {
    return district;
  }

  // 佐渡市から始まる場合の特別処理
  if (normalizedAddress.startsWith("佐渡市")) {
    const addressWithoutCity = normalizedAddress.substring(3);
    district = findDistrictByKeywords(addressWithoutCity);
    if (district) {
      return district;
    }
  }

  // 新潟県佐渡市から始まる場合の特別処理
  if (normalizedAddress.startsWith("新潟県佐渡市")) {
    const addressWithoutPrefecture = normalizedAddress.substring(5);
    district = findDistrictByKeywords(addressWithoutPrefecture);
    if (district) {
      return district;
    }
  }

  // どの地区にも該当しない場合 → 条件付き郵便番号フォールバック

  // 郵便番号抽出 (7桁 / ハイフン任意)
  const postalRegex = /(\d{3})-?(\d{4})/;
  const postalMatch = postalRegex.exec(address);
  if (postalMatch) {
    const postalCode = `${postalMatch[1]}${postalMatch[2]}`; // 7桁連結

    // フォールバック適用条件:
    // 1) 既に district 未確定
    // 2) 住所文字列に漢字の地名らしき >=2文字連続が存在しない (番号 + 国/県のみ想定)
    // 3) postalDistrictMap に登録済み
    // 4) 開発環境（運用前検証目的）
    const hasKanjiPlaceToken = /[\u4E00-\u9FFF]{2,}/.test(
      address.replace(/佐渡市|新潟県|日本/g, "")
    );
    if (
      !hasKanjiPlaceToken &&
      (postalDistrictMap as any)[postalCode] &&
      import.meta.env.DEV
    ) {
      const fallbackDistrict = (postalDistrictMap as any)[
        postalCode
      ] as SadoDistrict;
      console.info(
        `[district:fallback:postal] ${postalCode} → ${fallbackDistrict} (住所に有効地名要素なし)`
      );
      return fallbackDistrict;
    }
  }

  // それでも判定できない場合
  if (import.meta.env.DEV) {
    // 既に記録済みなら warn を再出力しない（ノイズ抑制）
    if (!unknownAddresses.has(address)) {
      unknownAddresses.add(address);
      console.warn(`地区を判定できませんでした: ${address}`);
    }
  }
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

/**
 * 判定できなかった住所のリストを取得（開発環境のみ）
 * @returns 未判定住所の配列
 */
export const getUnknownAddresses = (): readonly string[] => {
  if (process.env.NODE_ENV !== "development") {
    return [];
  }
  return Array.from(unknownAddresses).sort((a, b) => a.localeCompare(b, "ja"));
};

/**
 * 未判定住所の統計情報を出力（開発環境のみ）
 */
export const logUnknownAddressStats = (): void => {
  if (!import.meta.env.DEV || unknownAddresses.size === 0) {
    return;
  }

  console.group("📍 地区判定統計（佐渡市公式データ v2.0.0 準拠）");
  console.log(`未判定住所数: ${unknownAddresses.size}`);
  console.log("未判定住所一覧:");
  Array.from(unknownAddresses)
    .sort((a, b) => a.localeCompare(b, "ja"))
    .forEach((address, index) => {
      console.log(`  ${index + 1}. ${address}`);
    });
  console.log("\n📝 改善のヒント:");
  console.log(
    "  - 新しい地名が見つかった場合は、佐渡市公式サイトで地区を確認してください"
  );
  console.log("  - https://www.city.sado.niigata.jp/soshiki/2002/2359.html");
  console.groupEnd();
};

/**
 * 地区判定の精度をテストする関数（開発環境のみ）
 * @param testCases テストケースの配列
 */
export const testDistrictAccuracy = (
  testCases: Array<{ address: string; expected: SadoDistrict }>
): void => {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  let correct = 0;
  const total = testCases.length;
  const errors: Array<{
    address: string;
    expected: SadoDistrict;
    actual: SadoDistrict;
  }> = [];

  console.group("🧪 地区判定精度テスト");

  testCases.forEach(({ address, expected }) => {
    const actual = getDistrictFromAddress(address);
    if (actual === expected) {
      correct++;
    } else {
      errors.push({ address, expected, actual });
    }
  });

  const accuracy = (correct / total) * 100;
  console.log(`精度: ${accuracy.toFixed(1)}% (${correct}/${total})`);

  if (errors.length > 0) {
    console.log("\n❌ 判定エラー:");
    errors.forEach(({ address, expected, actual }) => {
      console.log(`  "${address}" → 期待値: ${expected}, 実際: ${actual}`);
    });
  }

  console.groupEnd();
};
