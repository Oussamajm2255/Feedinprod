const axios = require('axios');

async function createTestUser() {
  try {
    const userData = {
      email: 'test@test.com',
      password: 'test123',
      first_name: 'Test',
      last_name: 'User',
      role: 'farmer'
    };

    console.log('Creating test user...');
    const response = await axios.post('http://localhost:3000/api/v1/users/register', userData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Test user created successfully:', response.data.email);
    console.log('You can now login with:');
    console.log('Email: test@test.com');
    console.log('Password: test123');
  } catch (error) {
    if (error.response) {
      console.error('❌ Error creating user:', error.response.data);
    } else {
      console.error('❌ Network error:', error.message);
    }
  }
}

createTestUser();
