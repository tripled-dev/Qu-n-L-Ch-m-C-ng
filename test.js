const month = "05/2024";
let m = month;
if (m.includes('/')) {
  const mParts = m.split('/');
  if (mParts.length === 2) {
    const mm = mParts[0].padStart(2, '0');
    const y = mParts[1];
    if (y.length === 4) m = `${y}-${mm}`;
  }
}
console.log("month:", m);
