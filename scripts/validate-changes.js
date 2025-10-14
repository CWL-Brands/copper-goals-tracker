/**
 * Validation Script for Priorities 1-3 Changes
 * Run with: node scripts/validate-changes.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Priorities 1-3 Changes...\n');

let errors = 0;
let warnings = 0;

// Check 1: Verify GoalPeriod type doesn't include 'daily'
console.log('✓ Check 1: GoalPeriod type');
const typesFile = fs.readFileSync(path.join(__dirname, '../types/index.ts'), 'utf8');
if (typesFile.includes("'daily'") && typesFile.includes("export type GoalPeriod")) {
  console.error('  ❌ ERROR: GoalPeriod still includes "daily"');
  errors++;
} else {
  console.log('  ✅ PASS: GoalPeriod does not include "daily"');
}

// Check 2: Verify dashboard doesn't reference dailyProgress
console.log('\n✓ Check 2: Dashboard dailyProgress references');
const dashboardFile = fs.readFileSync(path.join(__dirname, '../app/dashboard/page.tsx'), 'utf8');
if (dashboardFile.includes('dailyProgress')) {
  console.error('  ❌ ERROR: Dashboard still references "dailyProgress"');
  errors++;
} else {
  console.log('  ✅ PASS: No dailyProgress references in dashboard');
}

// Check 3: Verify quarterlyProgress exists
console.log('\n✓ Check 3: Quarterly progress implementation');
if (!dashboardFile.includes('quarterlyProgress')) {
  console.error('  ❌ ERROR: Dashboard missing "quarterlyProgress"');
  errors++;
} else {
  console.log('  ✅ PASS: quarterlyProgress implemented');
}

// Check 4: Verify period toggle has 3 options
console.log('\n✓ Check 4: Period toggle options');
const periodToggleMatch = dashboardFile.match(/\['weekly','monthly','quarterly'\]/);
if (!periodToggleMatch) {
  console.error('  ❌ ERROR: Period toggle not updated to weekly/monthly/quarterly');
  errors++;
} else {
  console.log('  ✅ PASS: Period toggle has correct options');
}

// Check 5: Verify default period is weekly
console.log('\n✓ Check 5: Default period');
if (!dashboardFile.includes("useState<GoalPeriod>('weekly')")) {
  console.warn('  ⚠️  WARNING: Default period might not be "weekly"');
  warnings++;
} else {
  console.log('  ✅ PASS: Default period is weekly');
}

// Check 6: Verify test endpoint exists
console.log('\n✓ Check 6: JustCall test endpoint');
const testEndpointPath = path.join(__dirname, '../app/api/test-justcall/route.ts');
if (!fs.existsSync(testEndpointPath)) {
  console.warn('  ⚠️  WARNING: Test endpoint not found');
  warnings++;
} else {
  console.log('  ✅ PASS: Test endpoint exists');
}

// Check 7: Verify documentation exists
console.log('\n✓ Check 7: Documentation files');
const docs = [
  'JUSTCALL_WEBHOOK_STATUS.md',
  'PERIOD_DATA_ANALYSIS.md',
  'GOAL_SYSTEM_SIMPLIFICATION.md',
  'PRIORITIES_1-3_SUMMARY.md',
  'QUICK_REFERENCE.md'
];

docs.forEach(doc => {
  const docPath = path.join(__dirname, '../docs', doc);
  if (!fs.existsSync(docPath)) {
    console.warn(`  ⚠️  WARNING: Missing ${doc}`);
    warnings++;
  } else {
    console.log(`  ✅ ${doc}`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(50));
console.log(`Errors: ${errors}`);
console.log(`Warnings: ${warnings}`);

if (errors === 0 && warnings === 0) {
  console.log('\n✅ ALL CHECKS PASSED! Ready for deployment.');
  process.exit(0);
} else if (errors === 0) {
  console.log('\n⚠️  All critical checks passed, but there are warnings.');
  process.exit(0);
} else {
  console.log('\n❌ VALIDATION FAILED! Please fix errors before deployment.');
  process.exit(1);
}
