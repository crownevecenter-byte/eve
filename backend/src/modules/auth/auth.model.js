// backend/src/modules/auth/auth.model.js
const prisma = require('../../config/db');

// This file can contain custom logic or complex queries for the User model
// that are specific to authentication/authorization.

const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email },
    include: { branch: true }
  });
};

const createUser = async (data) => {
  return await prisma.user.create({
    data
  });
};

module.exports = {
  findUserByEmail,
  createUser
};
