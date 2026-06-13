// run_rbac_tests.js
const { spawn } = require('child_process');
const server = spawn('node', ['src/server.js'], { stdio: 'inherit' });

setTimeout(async () => {
  console.log('--- STARTING RBAC TESTS ---');
  const BASE_URL = 'http://localhost:5000/api';
  
  // Helper to get token
  async function getToken(role) {
    const email = `${role.toLowerCase()}@test.com`;
    // Try login first
    let res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Password123' })
    });
    
    if (res.status !== 200) {
      // Register if not found
      await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: role, email, password: 'Password123', role })
      });
      res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Password123' })
      });
    }
    const data = await res.json();
    return data.token;
  }

  const tokens = {
    EMPLOYEE: await getToken('EMPLOYEE'),
    BRANCH_OWNER: await getToken('BRANCH_OWNER'),
    CUSTOMER: await getToken('CUSTOMER'),
    TECHNICIAN: await getToken('TECHNICIAN'),
  };

  // 1. EMPLOYEE -> /api/branches (403)
  const res1 = await fetch(`${BASE_URL}/branches`, {
    headers: { 'Authorization': `Bearer ${tokens.EMPLOYEE}` }
  });
  console.log(res1.status === 403 ? '[PASS] EMPLOYEE blocked from /branches' : `[FAIL] EMPLOYEE /branches: got ${res1.status}`);

  // 2. BRANCH_OWNER -> POST /api/parts (403)
  const res2 = await fetch(`${BASE_URL}/parts`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokens.BRANCH_OWNER}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: "Ghost Part", category: "Engine", price: 100 })
  });
  console.log(res2.status === 403 ? '[PASS] BRANCH_OWNER blocked from creating global parts' : `[FAIL] BRANCH_OWNER POST /parts: got ${res2.status}`);

  // 3. BRANCH_OWNER -> DELETE /api/branches/1 (403)
  const res3 = await fetch(`${BASE_URL}/branches/1`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokens.BRANCH_OWNER}` }
  });
  console.log(res3.status === 403 ? '[PASS] BRANCH_OWNER cannot delete branches' : `[FAIL] BRANCH_OWNER DELETE /branches: got ${res3.status}`);

  // 4. CUSTOMER -> PUT /api/appointments/1 (403)
  const res4 = await fetch(`${BASE_URL}/appointments/1`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${tokens.CUSTOMER}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'COMPLETED' })
  });
  console.log(res4.status === 403 ? '[PASS] CUSTOMER cannot update appointment status' : `[FAIL] CUSTOMER PUT /appointments: got ${res4.status}`);

  // 5. TECHNICIAN -> /api/reports/revenue/summary (403)
  const res5 = await fetch(`${BASE_URL}/reports/revenue/summary`, {
    headers: { 'Authorization': `Bearer ${tokens.TECHNICIAN}` }
  });
  console.log(res5.status === 403 ? '[PASS] TECHNICIAN blocked from reports' : `[FAIL] TECHNICIAN /reports: got ${res5.status}`);

  console.log('--- RBAC TESTS COMPLETE ---');
  server.kill();
  process.exit(0);
}, 5000);
