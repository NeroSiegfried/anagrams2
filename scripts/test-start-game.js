import fetch from 'node-fetch';
import { query } from '../lib/db.js';
import { v4 as uuidv4 } from 'uuid';

async function testStartGameFlow() {
  let gameId;
  let hostId;
  let guestId;

  try {
    // 1. Create a host user
    hostId = uuidv4();
    const hostUsername = `test-host-${Date.now()}`;
    console.log(`Creating host user: ${hostUsername} (ID: ${hostId})`);
    await query(`
      INSERT INTO users (id, username, email, password) 
      VALUES ($1, $2, $3, 'password')
    `, [hostId, hostUsername, `${hostUsername}@test.com`]);

    // 2. Create a game
    console.log('Host is creating a new game...');
    const createResponse = await fetch('http://localhost:3000/api/games/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: hostId,
        isPublic: true,
        timeLimit: 120,
        maxPlayers: 2,
      }),
    });
    const createData = await createResponse.json();
    if (!createResponse.ok) throw new Error(`Failed to create game: ${createData.error}`);
    gameId = createData.game.id;
    console.log(`Game created with ID: ${gameId}`);

    // 3. Create and join a guest user
    guestId = uuidv4();
    const guestUsername = `test-guest-${Date.now()}`;
    console.log(`Creating guest user: ${guestUsername} (ID: ${guestId})`);
    await query(`
      INSERT INTO users (id, username, email, password) 
      VALUES ($1, $2, $3, 'password')
    `, [guestId, guestUsername, `${guestUsername}@test.com`]);
    
    console.log('Guest is joining the game...');
    const joinResponse = await fetch('http://localhost:3000/api/games/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: guestId, gameId: gameId }),
    });
    const joinData = await joinResponse.json();
    if (!joinResponse.ok) throw new Error(`Guest failed to join: ${joinData.error}`);

    // 4. Host tries to start game (should fail, guest not ready)
    console.log('\n--- TEST 1: Host starts with guest NOT ready ---');
    const startResponse1 = await fetch(`http://localhost:3000/api/games/${gameId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: hostId }),
    });
    const startData1 = await startResponse1.json();
    console.log(`Status Code: ${startResponse1.status}`);
    console.log('Response Body:', startData1);
    if (startResponse1.status === 400 && startData1.error.includes('All players must be ready')) {
      console.log('✅ TEST 1 PASSED: Server correctly prevented game start.');
    } else {
      console.log('❌ TEST 1 FAILED.');
      throw new Error('Test 1 Failed');
    }

    // 5. Guest marks themselves as ready
    console.log('\nGuest is marking themselves as ready...');
    await fetch(`http://localhost:3000/api/games/${gameId}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: guestId })
    });
    // Also mark host as ready
    await fetch(`http://localhost:3000/api/games/${gameId}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: hostId })
    });

    // 6. Host tries to start game again (should succeed)
    console.log('\n--- TEST 2: Host starts with ALL players ready ---');
    const startResponse2 = await fetch(`http://localhost:3000/api/games/${gameId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: hostId }),
    });
    const startData2 = await startResponse2.json();
    console.log(`Status Code: ${startResponse2.status}`);
    console.log('Response Body:', startData2);
    if (startResponse2.ok) {
        console.log('✅ TEST 2 PASSED: Server correctly started the game.');
    } else {
        console.log('❌ TEST 2 FAILED.');
        throw new Error('Test 2 Failed');
    }

  } catch (error) {
    console.error('\n--- TEST FAILED ---');
    console.error(error);
  } finally {
    // Cleanup
    if (gameId) {
      console.log('\nCleaning up created game...');
      await query('DELETE FROM games WHERE id = $1', [gameId]);
    }
    if (hostId) {
      console.log('Cleaning up host user...');
      await query('DELETE FROM users WHERE id = $1', [hostId]);
    }
    if (guestId) {
      console.log('Cleaning up guest user...');
      await query('DELETE FROM users WHERE id = $1', [guestId]);
    }
  }
}

testStartGameFlow(); 