const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:Farehanzan%40786@localhost:5432/postgres"
  });

  try {
    await client.connect();
    const res = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false;");
    console.log("Databases on localhost:");
    res.rows.forEach(row => console.log(`- ${row.datname}`));
  } catch (err) {
    console.error("Error connecting to PG:", err.message);
  } finally {
    await client.end();
  }
}

main();
