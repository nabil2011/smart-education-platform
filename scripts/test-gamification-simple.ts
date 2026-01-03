import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testPublicEndpoints() {
  console.log('🧪 Testing public endpoints...');

  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ Health check passed:', healthResponse.data.status);

    // Test API info endpoint
    console.log('\n2. Testing API info endpoint...');
    const apiInfoResponse = await axios.get(`${API_BASE_URL}`);
    console.log('✅ API info retrieved:', apiInfoResponse.data.message);
    console.log('Available endpoints:', Object.keys(apiInfoResponse.data.endpoints));

    console.log('\n🎉 Public endpoint tests completed successfully!');
    console.log('\n📝 To test gamification endpoints, you need to:');
    console.log('   1. Create a user account using POST /api/v1/auth/register');
    console.log('   2. Login using POST /api/v1/auth/login');
    console.log('   3. Use the returned token for authenticated requests');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testPublicEndpoints();