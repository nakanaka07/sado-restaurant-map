// より詳細な料理ジャンル分析スクリプト - 改良された分類ロジックのテスト用

async function detailedCuisineAnalysis() {
  const apiKey = 'AIzaSyATbNMVfbfFa1UAOP1HGLIzCHjGCjHq_cQ';
  const spreadsheetId = '1P_DUIz-ZbLiEHoZH4hX1YFKqZWE1E5Qv1Yze9Eu7xA8';
  const sheetName = 'restaurants';
  const range = sheetName + '!A:Z';
  const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values/' + range + '?key=' + apiKey;

  try {
    console.log('🔍 Google Sheets APIを呼び出しています...');
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.values) {
      throw new Error('データが見つかりません');
    }
    
    console.log('✅ データ取得成功');
    console.log(`📋 総行数: ${data.values.length}`);
    
    const headers = data.values[0];
    const storeNameIndex = headers.findIndex(h => h && h.includes('店舗名'));
    const storeTypeIndex = headers.findIndex(h => h && h.includes('店舗タイプ'));
    const descriptionIndex = headers.findIndex(h => h && h.includes('説明'));
    
    console.log('\n📊 分析対象フィールド:');
    console.log(`   店舗名インデックス: ${storeNameIndex} (${headers[storeNameIndex]})`);
    console.log(`   店舗タイプインデックス: ${storeTypeIndex} (${headers[storeTypeIndex]})`);
    console.log(`   説明インデックス: ${descriptionIndex} (${headers[descriptionIndex]})`);
    
    // より多くのサンプルを分析（50件）
    const sampleSize = Math.min(50, data.values.length - 1);
    console.log(`\n📝 詳細分析（${sampleSize}件のサンプル）:`);
    
    const analysisResults = {};
    const detailedData = [];
    
    for (let i = 1; i <= sampleSize; i++) {
      const row = data.values[i];
      if (!row) continue;
      
      const storeName = row[storeNameIndex] || '';
      const storeType = row[storeTypeIndex] || '';
      const description = row[descriptionIndex] || '';
      
      // 改良された分類ロジックを適用
      const cuisineType = improvedCuisineClassification(storeName, storeType, description);
      
      analysisResults[cuisineType] = (analysisResults[cuisineType] || 0) + 1;
      
      detailedData.push({
        index: i,
        storeName,
        storeType,
        description: description.substring(0, 50), // 最初の50文字のみ
        cuisineType
      });
      
      console.log(`   ${i.toString().padStart(2, '0')}: "${storeName}" (${storeType}) → ${cuisineType}`);
    }
    
    console.log('\n🎨 改良された分類結果の分布:');
    const sortedResults = Object.entries(analysisResults).sort(([,a], [,b]) => b - a);
    for (const [type, count] of sortedResults) {
      const percentage = ((count / sampleSize) * 100).toFixed(1);
      console.log(`  "${type}": ${count}件 (${percentage}%)`);
    }
    
    // 「その他」分類の詳細分析
    console.log('\n🔍 "その他"に分類された店舗の詳細:');
    const otherStores = detailedData.filter(item => item.cuisineType === 'その他');
    otherStores.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.storeName}"`);
      console.log(`      タイプ: ${item.storeType}`);
      if (item.description) {
        console.log(`      説明: ${item.description}...`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

// 改良された料理ジャンル分類ロジック
function improvedCuisineClassification(storeName, storeType, description) {
  const combined = `${storeName} ${storeType} ${description}`.toLowerCase();
  
  // より詳細なキーワードパターンマッチング
  
  // 🍣 寿司・回転寿司
  if (combined.match(/(寿司|すし|sushi|回転寿司|握り)/)) {
    return '寿司';
  }
  
  // 🐟 海鮮・魚料理
  if (combined.match(/(海鮮|魚|刺身|鮮魚|漁師|海の家|魚介|あじ|いわし|かに|えび|たこ|いか)/)) {
    return '海鮮';
  }
  
  // 🥩 焼肉・焼鳥・BBQ
  if (combined.match(/(焼肉|焼鳥|ホルモン|串焼|炭火|bbq|バーベキュー|やきとり|やきにく)/)) {
    return '焼肉・焼鳥';
  }
  
  // 🍜 ラーメン・つけ麺
  if (combined.match(/(ラーメン|らーめん|ramen|麺|つけ麺|担々麺|味噌|醤油|豚骨|塩ラーメン|中華そば)/)) {
    return 'ラーメン';
  }
  
  // 🍝 そば・うどん
  if (combined.match(/(そば|蕎麦|うどん|手打|十割|二八|讃岐|きしめん|ひやむぎ)/)) {
    return 'そば・うどん';
  }
  
  // 🥟 中華・中国料理
  if (combined.match(/(中華|中国|餃子|チャーハン|麻婆|点心|北京|四川|上海|広東|台湾)/)) {
    return '中華';
  }
  
  // 🍝 イタリアン
  if (combined.match(/(イタリア|パスタ|ピザ|リストランテ|トラットリア|スパゲッティ|italian|ピッツァ)/)) {
    return 'イタリアン';
  }
  
  // 🥖 フレンチ・西洋料理
  if (combined.match(/(フレンチ|フランス|ビストロ|french|西洋|洋食)/)) {
    return 'フレンチ';
  }
  
  // ☕ カフェ・喫茶店・パン屋
  if (combined.match(/(カフェ|cafe|珈琲|コーヒー|喫茶|パン屋|ベーカリー|bread|パティスリー)/)) {
    return 'カフェ・喫茶店';
  }
  
  // 🍺 バー・居酒屋・スナック
  if (combined.match(/(バー|bar|居酒屋|酒|スナック|パブ|飲み屋|ビアガーデン|beer)/)) {
    return 'バー・居酒屋';
  }
  
  // 🍟 ファストフード
  if (combined.match(/(ファスト|マクドナルド|ケンタ|モス|サブウェイ|fast|burger|ハンバーガー)/)) {
    return 'ファストフード';
  }
  
  // 🧁 デザート・スイーツ・和菓子
  if (combined.match(/(デザート|スイーツ|ケーキ|アイス|sweet|dessert|洋菓子|和菓子|だんご|まんじゅう|どら焼き)/)) {
    return 'デザート・スイーツ';
  }
  
  // 🍱 和食・定食・食堂
  if (combined.match(/(和食|定食|食堂|日本料理|割烹|料亭|懐石|会席|てんぷら|天ぷら|とんかつ|カツ)/)) {
    return '日本料理';
  }
  
  // 🍛 カレー・インド料理
  if (combined.match(/(カレー|curry|インド|タイ|エスニック|スパイス|ナン|タンドール)/)) {
    return 'カレー・エスニック';
  }
  
  // 🍖 ステーキ・洋食
  if (combined.match(/(ステーキ|steak|ハンバーグ|オムライス|グリル|洋食|beef)/)) {
    return 'ステーキ・洋食';
  }
  
  // 🍱 弁当・テイクアウト
  if (combined.match(/(弁当|bento|テイクアウト|持ち帰り|惣菜|お惣菜)/)) {
    return '弁当・テイクアウト';
  }
  
  // 🏪 その他のカテゴリ
  if (combined.match(/(レストラン|restaurant|ダイニング|ビュッフェ|バイキング)/)) {
    return 'レストラン';
  }
  
  // それでも分類できない場合
  return 'その他';
}

// 実行
detailedCuisineAnalysis();
