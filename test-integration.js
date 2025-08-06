const SPREADSHEET_ID = '1tcZhzPFHiZeb0NiVgedcN_44TgxmpsJKgu4onaaCbZs';
const API_KEY = 'AIzaSyCjVZMr4HYsGF90Zlso5m6Zu5FQYuckkQI';

console.log('=== 🔍 統合マップポイント取得テスト ===');

async function testIntegratedMapPoints() {
  const worksheets = ['restaurants', 'parkings', 'toilets'];
  let totalPoints = 0;
  
  for (const worksheet of worksheets) {
    console.log(`\n📋 ${worksheet} データ取得中...`);
    
    try {
      const range = `${worksheet}!A:Z`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'http://localhost:5173/'
        }
      });
      
      if (!response.ok) {
        console.log(`❌ ${worksheet} データ取得失敗: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const values = data.values || [];
      const count = values.length - 1; // ヘッダーを除く
      
      console.log(`✅ ${worksheet}: ${count} 件取得成功`);
      totalPoints += count;
      
      // 最初の数行のサンプルを表示
      if (values.length > 1) {
        const headers = values[0];
        const sampleRow = values[1];
        
        console.log(`📝 サンプル（${worksheet}）:`);
        console.log(`   ID: ${sampleRow[0] || 'N/A'}`);
        console.log(`   名前: ${sampleRow[1] || 'N/A'}`);
        console.log(`   住所: ${sampleRow[2] || 'N/A'}`);
        console.log(`   座標: (${sampleRow[3] || 'N/A'}, ${sampleRow[4] || 'N/A'})`);
      }
      
    } catch (error) {
      console.log(`❌ ${worksheet} エラー:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎯 統合テスト結果: 総計 ${totalPoints} 件のマップポイント`);
  console.log('期待値: 飲食店 444件 + 駐車場 112件 + トイレ 70件 = 626件');
  
  if (totalPoints >= 600) {
    console.log('✅ データ取得成功！統合マップポイントシステムが正常に動作しています。');
  } else {
    console.log('⚠️ データ不足：一部のワークシートでデータ取得に問題がある可能性があります。');
  }
}

testIntegratedMapPoints();
