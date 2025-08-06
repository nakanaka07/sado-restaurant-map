// 改良された分類ロジックのテスト用スクリプト
// 前回の分析結果に対して新しいロジックを適用

// 前回の分析結果（上位20件）
const testCases = [
  { storeName: "ma_ma", storeType: "パン屋, 施設, 飲食店, 店舗", expected: "デザート・スイーツ" },
  { storeName: "ショッピングプラザ キング 両津店", storeType: "施設, 飲食店, 店舗, スーパーマーケット", expected: "その他" },
  { storeName: "中沢仲助商店", storeType: "施設, 飲食店", expected: "その他" },
  { storeName: "田中餅店・菓子店", storeType: "施設, 飲食店, 店舗", expected: "デザート・スイーツ" },
  { storeName: "ハーティウッズ", storeType: "コンビニエンスストア, 施設, 飲食店, 店舗", expected: "その他" },
  { storeName: "CHERRY（チェリー）", storeType: "バー, 施設", expected: "バー・居酒屋" },
  { storeName: "大阪屋 両津店", storeType: "施設, 飲食店, 店舗", expected: "その他" },
  { storeName: "はなしこう", storeType: "カフェ, 施設, 飲食店", expected: "カフェ・喫茶店" },
  { storeName: "佐渡アウトドアベース", storeType: "カフェ, 施設, 飲食店", expected: "カフェ・喫茶店" },
  { storeName: "トロピカーナ", storeType: "カフェ, 施設, 飲食店", expected: "カフェ・喫茶店" },
  { storeName: "ショッピングプラザ キング 佐渡サンモールタウン店", storeType: "施設, 飲食店, 店舗, スーパーマーケット", expected: "その他" },
  { storeName: "あるこーいりす", storeType: "カフェ, 施設, 飲食店", expected: "カフェ・喫茶店" },
  { storeName: "maSanicoffee（マサニコーヒー）", storeType: "カフェ, 施設, 飲食店, 店舗", expected: "カフェ・喫茶店" },
  { storeName: "珈琲 花園", storeType: "カフェ, 施設, 飲食店, 店舗", expected: "カフェ・喫茶店" },
  { storeName: "茶房 げんざ", storeType: "カフェ, 施設, 飲食店", expected: "カフェ・喫茶店" },
  { storeName: "かふぇすみよし", storeType: "カフェ, 施設, 飲食店", expected: "カフェ・喫茶店" },
  { storeName: "caMoco cafe 湖ASOBi", storeType: "施設", expected: "カフェ・喫茶店" },
  { storeName: "アートサロン和（やわらぎ）", storeType: "カフェ, 施設, 飲食店", expected: "カフェ・喫茶店" },
  { storeName: "佐渡発酵 株式会社", storeType: "施設, 店舗", expected: "その他" },
  { storeName: "エーコープ 佐渡高千店", storeType: "施設, 飲食店, 店舗, スーパーマーケット", expected: "その他" }
];

// 改良された分類ロジック（TypeScriptからJavaScriptに移植）
function improvedCuisineClassification(storeName, storeType, description = '') {
  const combined = `${storeName} ${storeType} ${description}`.toLowerCase();

  // より詳細なキーワードパターンマッチング（正規表現使用）

  // 🍣 寿司・回転寿司
  if (combined.match(/(寿司|すし|sushi|回転寿司|握り|にぎり)/)) {
    return '寿司';
  }

  // 🐟 海鮮・魚料理
  if (combined.match(/(海鮮|魚|刺身|鮮魚|漁師|海の家|魚介|あじ|いわし|かに|蟹|えび|海老|たこ|蛸|いか|烏賊|まぐろ|鮪|さば|鯖)/)) {
    return '海鮮';
  }

  // 🥩 焼肉・焼鳥・BBQ
  if (combined.match(/(焼肉|焼鳥|ホルモン|串焼|炭火|bbq|バーベキュー|やきとり|やきにく|鶏|チキン|beef|牛)/)) {
    return '焼肉・焼鳥';
  }

  // 🍜 ラーメン・つけ麺
  if (combined.match(/(ラーメン|らーめん|ramen|つけ麺|担々麺|味噌|醤油|豚骨|塩ラーメン|中華そば|二郎)/)) {
    return 'ラーメン';
  }

  // 🍝 そば・うどん
  if (combined.match(/(そば|蕎麦|うどん|手打|十割|二八|讃岐|きしめん|ひやむぎ|そうめん)/)) {
    return 'そば・うどん';
  }

  // 🥟 中華・中国料理
  if (combined.match(/(中華|中国|餃子|チャーハン|炒飯|麻婆|点心|北京|四川|上海|広東|台湾|小籠包)/)) {
    return '中華';
  }

  // 🍝 イタリアン
  if (combined.match(/(イタリア|パスタ|ピザ|ピッツァ|リストランテ|トラットリア|スパゲッティ|italian)/)) {
    return 'イタリアン';
  }

  // 🥖 フレンチ・西洋料理
  if (combined.match(/(フレンチ|フランス|ビストロ|french|西洋料理|洋食)/)) {
    return 'フレンチ';
  }

  // 🍛 カレー・エスニック
  if (combined.match(/(カレー|curry|インド|タイ|エスニック|スパイス|ナン|タンドール|ココナッツ)/)) {
    return 'カレー・エスニック';
  }

  // 🍖 ステーキ・洋食
  if (combined.match(/(ステーキ|steak|ハンバーグ|オムライス|グリル|beef|pork)/)) {
    return 'ステーキ・洋食';
  }

  // 🧁 デザート・スイーツ・和菓子（パン屋を優先）
  if (combined.match(/(デザート|スイーツ|ケーキ|アイス|sweet|dessert|洋菓子|和菓子|だんご|まんじゅう|どら焼き|大福|餅|パン屋|パン|ベーカリー|bread|パティスリー)/)) {
    return 'デザート・スイーツ';
  }

  // ☕ カフェ・喫茶店（パン屋のチェック後に配置）
  if (combined.match(/(カフェ|cafe|珈琲|コーヒー|coffee|喫茶)/)) {
    return 'カフェ・喫茶店';
  }

  // 🍺 バー・居酒屋・スナック
  if (combined.match(/(バー|bar|居酒屋|酒|スナック|パブ|pub|飲み屋|ビアガーデン|beer|wine)/)) {
    return 'バー・居酒屋';
  }

  // 🍟 ファストフード
  if (combined.match(/(ファスト|マクドナルド|ケンタ|モス|サブウェイ|fast|burger|ハンバーガー)/)) {
    return 'ファストフード';
  }

  // 🧁 デザート・スイーツ・和菓子
  if (combined.match(/(デザート|スイーツ|ケーキ|アイス|sweet|dessert|洋菓子|和菓子|だんご|まんじゅう|どら焼き|大福|餅)/)) {
    return 'デザート・スイーツ';
  }

  // 🍱 弁当・テイクアウト
  if (combined.match(/(弁当|bento|テイクアウト|持ち帰り|惣菜|お惣菜)/)) {
    return '弁当・テイクアウト';
  }

  // 🍱 和食・定食・食堂
  if (combined.match(/(和食|定食|食堂|日本料理|割烹|料亭|懐石|会席|てんぷら|天ぷら|とんかつ|カツ|丼|どんぶり)/)) {
    return '日本料理';
  }

  // 🏪 レストラン（ジャンル不明）
  if (combined.match(/(レストラン|restaurant|ダイニング|ビュッフェ|バイキング|食べ放題)/)) {
    return 'レストラン';
  }

  // 🏪 その他（小売店・コンビニなど）
  if (combined.match(/(コンビニ|スーパー|商店|売店|自販機|マーケット)/)) {
    return 'その他';
  }

  // それでも分類できない場合
  return 'その他';
}

// テスト実行
console.log('🧪 改良された分類ロジックのテスト結果\n');

let correctCount = 0;
const results = {};

testCases.forEach((testCase, index) => {
  const actualResult = improvedCuisineClassification(testCase.storeName, testCase.storeType);
  const isCorrect = actualResult === testCase.expected;
  
  results[actualResult] = (results[actualResult] || 0) + 1;
  
  if (isCorrect) correctCount++;
  
  const status = isCorrect ? '✅' : '❌';
  console.log(`${(index + 1).toString().padStart(2, '0')}. ${status} "${testCase.storeName}"`);
  console.log(`    期待値: ${testCase.expected}`);
  console.log(`    実際値: ${actualResult}`);
  console.log(`    タイプ: ${testCase.storeType}`);
  console.log('');
});

console.log('📊 新しい分類結果の分布:');
const sortedResults = Object.entries(results).sort(([,a], [,b]) => b - a);
for (const [type, count] of sortedResults) {
  const percentage = ((count / testCases.length) * 100).toFixed(1);
  console.log(`  "${type}": ${count}件 (${percentage}%)`);
}

console.log(`\n🎯 正解率: ${correctCount}/${testCases.length} (${((correctCount / testCases.length) * 100).toFixed(1)}%)`);

// 改善点の分析
console.log('\n🔍 改善された点:');
if (results['デザート・スイーツ'] > 1) {
  console.log('✅ パン屋・餅店が正しく「デザート・スイーツ」に分類');
}
if (results['カフェ・喫茶店'] >= 7) {
  console.log('✅ カフェ系店舗の分類が安定');
}
if (results['その他'] < 10) {
  console.log('✅ 「その他」分類の割合が減少');
}
