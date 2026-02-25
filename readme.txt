1. Execute Test Case: npx playwright test 
2. Generate Allure Report : allure generate --single-file allure-results --clean -o allure-report
3. Install Testmo CLI: npm install -g @testmo/testmo-cli 
4. npm install
5. Command to run testmo uipath Script :npm run submit:testmo

npm install --save-dev @types/node

#set ignore casing to false
git config core.ignorecase false

# Stop tracking changes to this file
git update-index --skip-worktree src/testmo/testmo-reporter.ts
# Verify it's set
git ls-files -v | findstr testmo-reporter.ts
#undo Skip testmo-reporter.ts
git update-index --no-skip-worktree src/testmo/testmo-reporter.ts
