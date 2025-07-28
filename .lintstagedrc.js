module.exports = {
  // Lint các file TypeScript
  '*.{ts,tsx}': ['prettier --write'],
  // Lint các file JavaScript
  '*.{js,jsx}': ['prettier --write'],
  // Định dạng các file JSON
  '*.json': ['prettier --write'],
  // Định dạng các file HTML
  '*.html': ['prettier --write'],
  // Định dạng các file CSS/SCSS
  '*.{css,scss}': ['prettier --write'],
  // Sắp xếp các file package.json để duy trì thứ tự nhất quán
  './package.json': ['npx sort-package-json'],
  // Xác thực các file GitHub Actions
  '.github/actions/**/action.yml': ['npx action-validator'],
};
