const { pool } = require('../config/db');
const https = require('https');

async function listModels() {
  const [rows] = await pool.query('SELECT setting_value FROM system_settings WHERE setting_key = ?', ['openai_api_key']);
  const key = rows[0]?.setting_value;
  if (!key) { console.log('No OpenAI key found in DB'); process.exit(1); }

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/models',
    method: 'GET',
    headers: { Authorization: 'Bearer ' + key }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const json = JSON.parse(data);
      if (json.data) {
        const models = json.data
          .map(m => m.id)
          .filter(id => id.match(/^(gpt|o[0-9])/))
          .sort();
        console.log('\n✅ Available GPT/reasoning models for your project:\n');
        models.forEach(m => console.log(' -', m));
      } else {
        console.log('API response:', JSON.stringify(json, null, 2));
      }
      process.exit(0);
    });
  });
  req.on('error', e => { console.error(e); process.exit(1); });
  req.end();
}

listModels();
