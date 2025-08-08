const SPREADSHEET_ID = '1tcZhzPFHiZeb0NiVgedcN_44TgxmpsJKgu4onaaCbZs';
const API_KEY = 'AIzaSyCjVZMr4HYsGF90Zlso5m6Zu5FQYuckkQI';

console.log('=== 🔍 スプレッドシート構造の詳細調査 ===');
console.log('スプレッドシートID:', SPREADSHEET_ID.substring(0, 20) + '...');

async function investigateSpreadsheet() {
  try {
    // メタデータ取得のURL
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}`;
    
    console.log('🌐 メタデータURL:', metadataUrl);
    
    const response = await fetch(metadataUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://localhost:5173/'
      }
    });
    
    console.log('📡 レスポンスステータス:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ エラーレスポンス:', errorText.substring(0, 500));
      return;
    }
    
    const data = await response.json();
    const sheets = data.sheets || [];
    
    console.log(`\n📋 ワークシート一覧 (${sheets.length}個):`);
    console.log('='.repeat(50));
    
    for (let i = 0; i < sheets.length; i++) {
      const sheet = sheets[i];
      const sheetName = sheet.properties.title;
      const sheetId = sheet.properties.sheetId;
      
      console.log(`${i+1}. ワークシート名: "${sheetName}"`);
      console.log(`   シートID: ${sheetId}`);
      
      // URLエンコード表示
      const encodedName = encodeURIComponent(sheetName);
      console.log(`   URLエンコード: ${encodedName}`);
      
      // 簡単なデータ確認
      try {
        const rangeStr = `'${sheetName}'!A1:A10`;
        const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(rangeStr)}?key=${API_KEY}`;
        
        const dataResponse = await fetch(dataUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'http://localhost:5173/'
          }
        });
        
        if (dataResponse.ok) {
          const sheetData = await dataResponse.json();
          const values = sheetData.values || [];
          console.log(`   ✅ データ確認: 最初の${values.length}行取得`);
          
          if (values.length > 0) {
            const header = values[0].slice(0, 5);
            console.log(`   📝 ヘッダーサンプル: ${JSON.stringify(header)}`);
          }
        } else {
          console.log(`   ❌ データ取得失敗: ${dataResponse.status}`);
        }
        
      } catch (dataError) {
        console.log(`   ⚠️ データ確認エラー: ${dataError.message}`);
      }
      
      console.log('');
    }
    
    // 推奨修正の提案
    console.log('='.repeat(50));
    console.log('📊 ワークシート名分析:');
    
    sheets.forEach(sheet => {
      const sheetName = sheet.properties.title;
      if (sheetName.includes('飲食') || sheetName.includes('まとめ') || sheetName.toLowerCase().includes('merged') || sheetName.toLowerCase().includes('restaurant')) {
        console.log(`🍽️  飲食店データ: "${sheetName}"`);
      } else if (sheetName.includes('駐車') || sheetName.toLowerCase().includes('parking')) {
        console.log(`🅿️  駐車場データ: "${sheetName}"`);
      } else if (sheetName.includes('トイレ') || sheetName.toLowerCase().includes('toilet')) {
        console.log(`🚽 トイレデータ: "${sheetName}"`);
      } else {
        console.log(`❓ その他: "${sheetName}"`);
      }
    });
    
  } catch (error) {
    console.log('❌ 全体エラー:', error.message);
  }
}

investigateSpreadsheet();
