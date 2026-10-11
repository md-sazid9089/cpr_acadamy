import '../src/db.js'; // must load before http.js and sms.js: the migrations and the modules import each other
import { loadConfig } from '../src/config.js';
import { sendWithReve } from '../src/sms.js';
import { mobile } from '../src/http.js';

// Sends one real SMS to check the Reve keys, sender ID, address and number format.
// It prints only whether Reve accepted the message: the keys and the request address are never shown.
const target = mobile.safeParse(process.argv[2]);
if (!target.success) {
  console.error('Usage: npm run sms:test -- 01XXXXXXXXX   (a Bangladesh mobile number you control)');
  process.exitCode = 1;
} else {
  try {
    const config = loadConfig();
    if (config.smsMode !== 'reve') throw new Error('SMS_MODE is not reve');
    await sendWithReve(config, { mobile: target.data, message: 'CPR Academy SMS test. If you can read this, SMS delivery works.' });
    console.log('Reve accepted the message. Check that it reaches the phone.');
  } catch (error) {
    console.error(`Not sent: ${error.message}`);
    process.exitCode = 1;
  }
}
