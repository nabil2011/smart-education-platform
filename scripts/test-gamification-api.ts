import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Test credentials (you'll need to use actual credentials from your database)
const TEST_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'admin123'
};

async function testGamificationAPI() {
  console.log('🧪 Testing Gamification API...');

  try {
    // 1. Login to get authentication token
    console.log('\n1. Authenticating...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, TEST_CREDENTIALS);
    const token = loginResponse.data.accessToken;
    console.log('✅ Authentication successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Get all badges
    console.log('\n2. Fetching all badges...');
    const badgesResponse = await axios.get(`${API_BASE_URL}/gamification/badges`, { headers });
    console.log(`✅ Found ${badgesResponse.data.length} badges`);
    console.log('Badges:', badgesResponse.data.map((b: any) => `${b.name} (${b.rarity})`).join(', '));

    // 3. Get leaderboard
    console.log('\n3. Fetching leaderboard...');
    const leaderboardResponse = await axios.get(`${API_BASE_URL}/gamification/leaderboard`, { headers });
    console.log(`✅ Leaderboard has ${leaderboardResponse.data.entries.length} entries`);

    // 4. Get gamification statistics (admin only)
    console.log('\n4. Fetching gamification statistics...');
    try {
      const statsResponse = await axios.get(`${API_BASE_URL}/gamification/stats`, { headers });
      console.log('✅ Statistics retrieved:');
      console.log(`   - Total points awarded: ${statsResponse.data.totalPointsAwarded}`);
      console.log(`   - Total badges earned: ${statsResponse.data.totalBadgesEarned}`);
      console.log(`   - Active students: ${statsResponse.data.activeStudents}`);
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('⚠️  Statistics endpoint requires admin role');
      } else {
        throw error;
      }
    }

    // 5. Test with a student ID (if available)
    console.log('\n5. Testing student-specific endpoints...');
    
    // First, let's try to find a student ID from the leaderboard
    if (leaderboardResponse.data.entries.length > 0) {
      const studentId = leaderboardResponse.data.entries[0].studentId;
      console.log(`Using student ID: ${studentId}`);

      // Get student points
      const pointsResponse = await axios.get(`${API_BASE_URL}/gamification/students/${studentId}/points`, { headers });
      console.log(`✅ Student has ${pointsResponse.data.totalPoints} points`);

      // Get student badges
      const studentBadgesResponse = await axios.get(`${API_BASE_URL}/gamification/students/${studentId}/badges`, { headers });
      console.log(`✅ Student has ${studentBadgesResponse.data.length} badges`);

      // Get student progress
      const progressResponse = await axios.get(`${API_BASE_URL}/gamification/students/${studentId}/progress`, { headers });
      console.log(`✅ Student progress retrieved - Level: ${progressResponse.data.levelProgress.currentLevel}`);

    } else {
      console.log('⚠️  No students found in leaderboard to test student-specific endpoints');
    }

    console.log('\n🎉 All gamification API tests completed successfully!');

  } catch (error: any) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Make sure you have valid credentials in the database');
      console.log('💡 You can create an admin user using the auth endpoints');
    }
  }
}

// Run the test
testGamificationAPI();