const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:Farehanzan%40786@localhost:5432/postgres"
  });

  try {
    await client.connect();
    // Query to list all tables in the public schema of 'postgres' database
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);
    console.log("Tables in default 'postgres' database:");
    if (res.rows.length === 0) {
      console.log("No tables found.");
    } else {
      res.rows.forEach(row => console.log(`- ${row.table_name}`));
    }
  } catch (err) {
    console.error("Error connecting to PG:", err.message);
  } finally {
    await client.end();
  }
}

main();
