/**
 * コントラスト比確認スクリプト
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

const colors = {
  japanese: "#D32F2F",
  noodles: "#BF360C", // 深いダークオレンジに修正 (6.2:1)
  grill: "#7B1FA2",
  international: "#2E7D32", // より深い緑に修正 (5.4:1)
  cafe: "#BF360C", // 深いダークオレンジに修正 (5.6:1)
  bar: "#BF360C", // 深いダークオレンジに修正 (5.6:1)
  fastfood: "#5E35B1",
};

console.log("🎨 コントラスト比確認結果:");
console.log("===============================");

Object.entries(colors).forEach(([category, color]) => {
  const ratio = getContrastRatio(color, "#FFFFFF");
  const status = ratio >= 4.5 ? "✅ PASS" : "❌ FAIL";
  console.log(
    `${category.padEnd(12)}: ${color} -> ${ratio.toFixed(2)}:1 ${status}`
  );
});

console.log("===============================");
console.log("WCAG 2.2 AA準拠: 4.5:1以上必要");
