const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUserModel() {
  try {
    console.log('🧪 Testing User model...');
    
    // Test 1: Creare un utente
    const newUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'temporary_plain_password', // ⚠️ Cambieremo questo con hash!
        firstName: 'John',
        lastName: 'Doe'
      }
    });
    
    console.log('✅ User created:', {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt
    });
    
    // Test 2: Trovare l'utente
    const foundUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    console.log('✅ User found:', foundUser ? 'Yes' : 'No');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUserModel();