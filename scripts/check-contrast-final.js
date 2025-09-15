/**
 * 最終コントラスト比確認スクリプト
 */

// 簡易コントラスト比計算
function getLuminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const sRGB = [r, g, b].map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
}

// 最終修正版の色設定
const colorsFinal = {
  japanese: "#D32F2F", // そのまま (4.98:1 -> ✅)
  noodles: "#BF360C", // #E65100 -> #BF360C に変更
  grill: "#7B1FA2", // そのまま (8.20:1 -> ✅)
  international: "#2E7D32", // そのまま (5.13:1 -> ✅)
  cafe: "#E65100", // #F57F17 -> #E65100 に変更
  bar: "#C62828", // #D84315 -> #C62828 に変更
  fastfood: "#5E35B1", // そのまま (8.02:1 -> ✅)
};

console.log("🎨 最終版コントラスト比確認結果:");
console.log("===============================");

let allPass = true;
let totalRatio = 0;
Object.entries(colorsFinal).forEach(([category, color]) => {
  const ratio = getContrastRatio(color, "#FFFFFF");
  totalRatio += ratio;
  const status = ratio >= 4.5 ? "✅ PASS" : "❌ FAIL";
  if (ratio < 4.5) allPass = false;

  // 品質評価
  let quality = "";
  if (ratio >= 7.0) quality = "🏆 AAA級";
  else if (ratio >= 4.5) quality = "✅ AA級";
  else quality = "❌ 不合格";

  console.log(
    `${category.padEnd(12)}: ${color} -> ${ratio.toFixed(2)}:1 ${status} ${quality}`
  );
});

const avgRatio = totalRatio / Object.keys(colorsFinal).length;

console.log("===============================");
console.log(`WCAG 2.2 AA準拠: 4.5:1以上必要`);
console.log(`平均コントラスト比: ${avgRatio.toFixed(2)}:1`);
console.log(`総合判定: ${allPass ? "✅ 全色PASS" : "❌ 要改善"}`);

if (allPass) {
  console.log("🎉 アクセシビリティ対応完了！");
  console.log("📊 品質レベル: WCAG 2.2 AA準拠達成");
}
