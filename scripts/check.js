const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: "postgresql://postgres:AFqtQkYHxeRkAJJEDuZjRcImtZzRWuCj@thomas.proxy.rlwy.net:32880/railway" });
  await client.connect();
  
  // Get the user ID
  const uRes = await client.query('SELECT id FROM "users" WHERE email = $1', ['issamchowera02@gmail.com']);
  if (uRes.rowCount > 0) {
    const userId = uRes.rows[0].id;
    // Delete location updates
    const locRes = await client.query('DELETE FROM "location_updates" WHERE "driverId" = $1', [userId]);
    console.log("Deleted location updates:", locRes.rowCount);
    
    // Delete driver deliveries (unlink them) or delete them? Wait, just unlink
    await client.query('UPDATE "deliveries" SET "driverId" = NULL WHERE "driverId" = $1', [userId]);
    
    // Delete user
    const res = await client.query('DELETE FROM "users" WHERE id = $1', [userId]);
    console.log("Deleted user:", res.rowCount);
  } else {
    console.log("User not found in DB.");
  }
  
  await client.end();
}
main().catch(console.error).finally(() => process.exit(0));
