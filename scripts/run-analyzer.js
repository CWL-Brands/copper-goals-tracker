/**
 * Wrapper script to load environment variables and run the analyzer
 */

require('dotenv').config({ path: '.env.local' });

// Now run the analyzer
require('./analyze-fishbowl-schema.js');
