/**
 * 修正後のコントラスト比確認スクリプト
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

// 修正後の色設定
const colorsFixed = {
  japanese: "#D32F2F", // そのまま (4.98:1 -> ✅)
  noodles: "#E65100", // #F57C00 -> #E65100 に変更
  grill: "#7B1FA2", // そのまま (8.20:1 -> ✅)
  international: "#2E7D32", // #388E3C -> #2E7D32 に変更
  cafe: "#F57F17", // #F9A825 -> #F57F17 に変更
  bar: "#D84315", // #E65100 -> #D84315 に変更
  fastfood: "#5E35B1", // そのまま (8.02:1 -> ✅)
};

console.log("🎨 修正後コントラスト比確認結果:");
console.log("===============================");

let allPass = true;
Object.entries(colorsFixed).forEach(([category, color]) => {
  const ratio = getContrastRatio(color, "#FFFFFF");
  const status = ratio >= 4.5 ? "✅ PASS" : "❌ FAIL";
  if (ratio < 4.5) allPass = false;
  console.log(
    `${category.padEnd(12)}: ${color} -> ${ratio.toFixed(2)}:1 ${status}`
  );
});

console.log("===============================");
console.log(`WCAG 2.2 AA準拠: 4.5:1以上必要`);
console.log(`総合判定: ${allPass ? "✅ 全色PASS" : "❌ 要改善"}`);

if (allPass) {
  console.log("🎉 アクセシビリティ対応完了！");
}
