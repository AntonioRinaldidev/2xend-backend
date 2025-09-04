const bycrpt = require('bcrypt');

const SALT_ROUNDS = 12;

async function hashPassword(plainTextPassword) {
    if (!plainTextPassword) {
        throw new Error('Password cannot be empty');
    }
    if(plainTextPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
    }
    if(plainTextPassword.length > 24) {
        throw new Error('Password must not exceed 24 characters');
    }
    return await bycrpt.hash(plainTextPassword, SALT_ROUNDS);
}

async function verifyPassword(plainTextPassword, hashedPassword) {
    if (!plainTextPassword || !hashedPassword) {
        throw new Error('Both plain text and hashed passwords are required');
    }
    return await bycrpt.compare(plainTextPassword, hashedPassword);
}

module.exports = {
    hashPassword,
    verifyPassword
};