const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const config = require('./src/config');
const prisma = new PrismaClient();
const http = require('http');

async function measureRequest(path, token) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = http.get(`http://localhost:5001/api${path}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const end = Date.now();
        resolve({
          path,
          status: res.statusCode,
          timeMs: end - start,
          dataLength: data.length
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    const user = await prisma.user.findUnique({ where: { id: 5 } });
    if (!user) return;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, restaurantId: user.restaurant_id || null },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
    
    console.log(`Testing with user: ${user.email}`);
    
    const results = await Promise.all([
      measureRequest('/users/profile', token),
      measureRequest('/courses', token)
    ]);
    
    console.table(results);
  } catch(err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
