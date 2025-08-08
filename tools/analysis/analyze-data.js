const SPREADSHEET_ID = '1tcZhzPFHiZeb0NiVgedcN_44TgxmpsJKgu4onaaCbZs';
const API_KEY = 'AIzaSyCjVZMr4HYsGF90Zlso5m6Zu5FQYuckkQI';

console.log('=== 📊 詳細データ構造調査 ===');

async function analyzeDataStructure() {
  const worksheets = ['restaurants', 'parkings', 'toilets'];
  
  for (const worksheet of worksheets) {
    console.log(`\n🔍 ワークシート: ${worksheet}`);
    console.log('='.repeat(50));
    
    try {
      const range = `${worksheet}!A1:Z10`;
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
      
      console.log(`📋 データ行数: ${values.length}`);
      
      if (values.length > 0) {
        // ヘッダー行の表示
        const headers = values[0];
        console.log(`🏷️  ヘッダー (${headers.length}列):`);
        headers.forEach((header, index) => {
          console.log(`   [${index + 1}] ${header}`);
        });
        
        // サンプルデータの表示
        if (values.length > 1) {
          console.log(`\n📝 サンプルデータ (2行目):`);
          const sampleRow = values[1];
          for (let i = 0; i < Math.min(sampleRow.length, 10); i++) {
            console.log(`   [${i + 1}] ${headers[i] || 'Unknown'}: "${sampleRow[i] || ''}"`);
          }
          
          if (sampleRow.length > 10) {
            console.log(`   ... (${sampleRow.length - 10}列省略)`);
          }
        }
        
        // 全体の件数確認
        const countRange = `${worksheet}!A:A`;
        const countUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(countRange)}?key=${API_KEY}`;
        
        const countResponse = await fetch(countUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'http://localhost:5173/'
          }
        });
        
        if (countResponse.ok) {
          const countData = await countResponse.json();
          const totalRows = (countData.values || []).length - 1; // ヘッダーを除く
          console.log(`\n📊 総データ件数: ${totalRows} 件`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ${worksheet} 分析エラー:`, error.message);
    }
  }
  
  // 合計統計
  console.log('\n' + '='.repeat(50));
  console.log('📈 データベース全体統計:');
  
  let totalCount = 0;
  for (const worksheet of worksheets) {
    try {
      const countRange = `${worksheet}!A:A`;
      const countUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(countRange)}?key=${API_KEY}`;
      
      const countResponse = await fetch(countUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'http://localhost:5173/'
        }
      });
      
      if (countResponse.ok) {
        const countData = await countResponse.json();
        const count = (countData.values || []).length - 1;
        console.log(`${worksheet}: ${count} 件`);
        totalCount += count;
      }
    } catch (error) {
      console.log(`${worksheet}: 取得失敗`);
    }
  }
  
  console.log(`\n🎯 総合計: ${totalCount} 件のマップポイント`);
  console.log('（期待値: 627件のうち、飲食店444件 + 駐車場112件 + トイレ71件）');
}

analyzeDataStructure();
