// 料理ジャンル分析スクリプト
async function analyzeCuisineTypes() {
  const apiKey = 'AIzaSyCjVZMr4HYsGF90Zlso5m6Zu5FQYuckkQI';
  const spreadsheetId = '1tcZhzPFHiZeb0NiVgedcN_44TgxmpsJKgu4onaaCbZs';
  const sheetName = 'restaurants';
  const range = `${sheetName}!A:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
  
  try {
    console.log('🔍 Google Sheets APIを呼び出しています...');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://localhost:5173/'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ データ取得成功');
    
    if (data.values) {
      const headers = data.values[0];
      console.log(`📋 総行数: ${data.values.length}`);
      console.log('📋 ヘッダー分析（最初の20列）:');
      headers.slice(0, 20).forEach((h, i) => {
        console.log(`  ${i.toString().padStart(2)}: "${h}"`);
      });
      
      // storeType列（店舗タイプ）とstoreDescription列を探す
      const storeTypeIndex = headers.findIndex(h => h && h.includes('店舗タイプ'));
      const descIndex = headers.findIndex(h => h && h.includes('エディトリアル要約'));
      
      console.log(`\n🏪 店舗タイプ列インデックス: ${storeTypeIndex}`);
      console.log(`📝 説明列インデックス: ${descIndex}`);
      
      if (storeTypeIndex >= 0) {
        console.log(`\n📊 店舗タイプと説明の分析（サンプル20件）:`);
        
        const storeTypes = {};
        const cuisineClassification = {};
        const sampleData = data.values.slice(1, 21);
        
        sampleData.forEach((row, i) => {
          const name = row[1] || '';
          const storeType = row[storeTypeIndex] || '';
          const description = descIndex >= 0 ? (row[descIndex] || '') : '';
          
          // 改良された料理ジャンル分類をシミュレート（店舗名を含む）
          const combined = `${name} ${storeType} ${description}`.toLowerCase();
          let cuisineType = "その他";
          
          // 🍣 寿司関連
          if (combined.includes("寿司") || combined.includes("sushi") || combined.includes("すし")) {
            cuisineType = "寿司";
          }
          // 🐟 海鮮関連
          else if (combined.includes("海鮮") || combined.includes("魚") || combined.includes("刺身")) {
            cuisineType = "海鮮";
          }
          // 🥩 焼肉・焼鳥関連
          else if (combined.includes("焼肉") || combined.includes("焼鳥") || combined.includes("ホルモン")) {
            cuisineType = "焼肉・焼鳥";
          }
          // 🍜 ラーメン関連
          else if (combined.includes("ラーメン") || combined.includes("麺")) {
            cuisineType = "ラーメン";
          }
          // 🍝 そば・うどん関連
          else if (combined.includes("そば") || combined.includes("うどん") || combined.includes("蕎麦")) {
            cuisineType = "そば・うどん";
          }
          // 🥟 中華関連
          else if (combined.includes("中華") || combined.includes("餃子") || combined.includes("チャーハン")) {
            cuisineType = "中華";
          }
          // 🍝 イタリアン関連
          else if (combined.includes("イタリア") || combined.includes("パスタ") || combined.includes("ピザ")) {
            cuisineType = "イタリアン";
          }
          // ☕ カフェ・喫茶店関連
          else if (combined.includes("カフェ") || combined.includes("コーヒー") || combined.includes("喫茶") || storeType.includes("カフェ")) {
            cuisineType = "カフェ・喫茶店";
          }
          // 🍺 バー・居酒屋関連
          else if (combined.includes("バー") || combined.includes("居酒屋") || combined.includes("酒") || storeType.includes("バー")) {
            cuisineType = "バー・居酒屋";
          }
          // 🧁 デザート・スイーツ関連
          else if (combined.includes("デザート") || combined.includes("ケーキ") || combined.includes("パン")) {
            cuisineType = "デザート・スイーツ";
          }
          // 🍱 定食・食堂関連
          else if (combined.includes("定食") || combined.includes("食堂") || combined.includes("レストラン")) {
            cuisineType = "日本料理";
          }
          
          storeTypes[storeType] = (storeTypes[storeType] || 0) + 1;
          cuisineClassification[cuisineType] = (cuisineClassification[cuisineType] || 0) + 1;
          
          console.log(`  ${(i+1).toString().padStart(2)}: "${name}" (${storeType}) → ${cuisineType}`);
        });
        
        console.log('\n📈 店舗タイプ分布:');
        Object.entries(storeTypes)
          .sort(([,a], [,b]) => b - a)
          .forEach(([type, count]) => {
            console.log(`  "${type}": ${count}件`);
          });
          
        console.log('\n🎨 料理ジャンル分類結果:');
        Object.entries(cuisineClassification)
          .sort(([,a], [,b]) => b - a)
          .forEach(([type, count]) => {
            console.log(`  "${type}": ${count}件`);
          });
      } else {
        console.log('\n❌ 店舗タイプ列が見つかりませんでした');
      }
    } else {
      console.log('❌ データが空です');
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

analyzeCuisineTypes();
