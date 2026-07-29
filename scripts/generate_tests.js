import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories
const TARGET_DIR = path.join(__dirname, '..', 'test_cases');
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// CSV Header
const CSV_HEADER = 'Test Case ID,Module,Priority,Test Objective,Pre-conditions,Test Steps,Expected Result,Status\n';

// Helper to escape CSV fields
function escapeCSV(text) {
  return `"${text.replace(/"/g, '""')}"`;
}

// Data Sets for Combinatorics
const products = ['Milk', 'Cheese', 'Chicken', 'Bread', 'Apple', 'Tomato', 'Yogurt', 'Canned Beans', 'Oats'];
const categories = ['dairy', 'meat', 'pantry', 'vegetables', 'canned'];
const modules = ['Scanner', 'Pantry', 'Notifications', 'Freshness Tracker', 'Auth'];
const statuses = ['Pending', 'Passed', 'Failed'];
const dates = ['Today', 'Tomorrow', 'In 3 Days', 'Next Week', 'Expired Yesterday', 'Expires in 1 Month'];

// Generators for specific test suites

function generateSeleniumTest(i) {
  const product = products[i % products.length];
  const module = modules[i % modules.length];
  return [
    `SEL_TC_${(i + 1).toString().padStart(3, '0')}`,
    module,
    'High',
    `Verify user can interact with ${module} for ${product}`,
    `User is logged in on Web Browser`,
    `1. Navigate to ${module} page\n2. Click on ${product} element\n3. Verify UI state changes`,
    `${module} UI updates correctly for ${product}`,
    'Pending'
  ];
}

function generateUnitTest(i) {
  const category = categories[i % categories.length];
  const mfgOffset = -(i % 30) - 1;
  const expOffset = (i % 60) - 10;
  return [
    `UNIT_TC_${(i + 1).toString().padStart(3, '0')}`,
    'Core Logic',
    'Critical',
    `Calculate freshness for ${category} (MFG: ${mfgOffset}d, EXP: ${expOffset}d)`,
    `System active`,
    `1. Call calculateFreshness(mfgDate, expDate, '${category}')\n2. Assert returned percentage`,
    `Freshness score mathematically matches formula without throwing errors`,
    'Pending'
  ];
}

function generateValidationTest(i) {
  const product = products[i % products.length];
  const invalidInputs = ['Empty Date', 'Past Expiry', 'Invalid Format (DD-MM-YYYY)', 'No Name', 'Negative Quantity'];
  const invalid = invalidInputs[i % invalidInputs.length];
  return [
    `VAL_TC_${(i + 1).toString().padStart(3, '0')}`,
    'Form Validation',
    'Medium',
    `Test form submission for ${product} with ${invalid}`,
    `Add Product Form is open`,
    `1. Enter ${product}\n2. Enter ${invalid}\n3. Click Submit`,
    `Form prevents submission and shows validation error for ${invalid}`,
    'Pending'
  ];
}

function generateVulnerabilityTest(i) {
  const attacks = ['SQLi (SELECT * FROM users)', 'XSS (<script>alert(1)</script>)', 'NoSQL Injection ({$gt: ""})', 'Broken Auth Header', 'Mass Assignment'];
  const attack = attacks[i % attacks.length];
  return [
    `SEC_TC_${(i + 1).toString().padStart(3, '0')}`,
    'Security',
    'Critical',
    `Prevent ${attack} attack on API endpoint`,
    `Attacker has network access`,
    `1. Send payload ${attack} in request body or headers\n2. Analyze API response`,
    `API returns 400/403/401 and sanitizes input. No data leaked.`,
    'Pending'
  ];
}

function generateLoadTest(i) {
  const load = (i + 1) * 10;
  return [
    `LOAD_TC_${(i + 1).toString().padStart(3, '0')}`,
    'Performance',
    'High',
    `Handle ${load} concurrent API requests to OCR scanner`,
    `Server is running normally`,
    `1. Ramp up to ${load} virtual users\n2. Send POST /api/scan with image payload simultaneously\n3. Monitor response time`,
    `Response time remains under 2000ms with <1% error rate`,
    'Pending'
  ];
}

function generateAppiumTest(i) {
  const actions = ['Swipe Left to Delete', 'Tap Camera Button', 'Pull to Refresh', 'Rotate Device Landscape', 'Background App and Resume'];
  const action = actions[i % actions.length];
  return [
    `APP_TC_${(i + 1).toString().padStart(3, '0')}`,
    'Mobile UI',
    'High',
    `Verify native mobile action: ${action}`,
    `App installed on iOS/Android Emulator`,
    `1. Launch App\n2. Perform ${action}\n3. Assert screen state`,
    `App handles ${action} gracefully without crashing`,
    'Pending'
  ];
}

const testSuites = [
  { file: 'selenium_test_cases.csv', generator: generateSeleniumTest },
  { file: 'unit_test_cases.csv', generator: generateUnitTest },
  { file: 'validation_test_cases.csv', generator: generateValidationTest },
  { file: 'vulnerability_test_cases.csv', generator: generateVulnerabilityTest },
  { file: 'load_test_cases.csv', generator: generateLoadTest },
  { file: 'appium_test_cases.csv', generator: generateAppiumTest }
];

testSuites.forEach(suite => {
  let csvContent = CSV_HEADER;
  for (let i = 0; i < 400; i++) {
    const row = suite.generator(i);
    csvContent += row.map(escapeCSV).join(',') + '\n';
  }
  
  const filePath = path.join(TARGET_DIR, suite.file);
  fs.writeFileSync(filePath, csvContent, 'utf-8');
  console.log(`Generated 400 test cases for ${suite.file}`);
});

console.log('All 2400 test cases generated successfully in test_cases/');
