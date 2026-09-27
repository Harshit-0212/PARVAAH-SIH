import http from 'node:http';
import { app } from './src/app.ts';

const server = http.createServer(app);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

let res = await fetch('http://127.0.0.1:' + port + '/api/v1/scenarios/clear-state', { method: 'POST' });
console.log('CLEAR-STATE', JSON.stringify(await res.json()));

res = await fetch('http://127.0.0.1:' + port + '/api/v1/risk/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rainfall_24h_mm: 115.0,
    forecast_rainfall_24h_mm: 128.0,
    soil_moisture_percent: 93.0,
    slope_degrees: 45.0,
    historical_landslide_density: 0.88,
    verified_report_count: 9,
    zoneId: 'ZONE-SKM-01'
  })
});
console.log('RISK-CALC', JSON.stringify(await res.json(), null, 2));
server.close();
