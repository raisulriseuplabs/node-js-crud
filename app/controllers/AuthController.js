import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../models/prismaClient.js';

const accessTokenSecret = process.env.JWT_ACCESS_SECRET;
const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
const accessTokenExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function generateAccessToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, accessTokenSecret, { expiresIn: accessTokenExpiresIn });
}

function generateRefreshToken(user) {
  return jwt.sign({ userId: user.id }, refreshTokenSecret, { expiresIn: refreshTokenExpiresIn });
}

const AuthController = {
  async register(req, res) {
    try {
      const { name, email, password, designation } = req.body;
      if (!name || !email || !password || !designation) return res.status(400).json({ error: 'All fields required' });
      const existing = await prisma.employee.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ error: 'Email already registered' });
      const hashed = await bcrypt.hash(password, 12);
      const user = await prisma.employee.create({ data: { name, email, password: hashed, designation } });
      delete user.password;
      res.status(201).json({ id: user.id, name: user.name, email: user.email, designation: user.designation });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
      const user = await prisma.employee.findUnique({ where: { email } });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });
      res.json({ accessToken, refreshToken });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
      const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
      if (!stored) return res.status(401).json({ error: 'Invalid refresh token' });
      jwt.verify(refreshToken, refreshTokenSecret, async (err, payload) => {
        if (err) return res.status(401).json({ error: 'Invalid refresh token' });
        const user = await prisma.employee.findUnique({ where: { id: payload.userId } });
        if (!user) return res.status(401).json({ error: 'User not found' });
        const accessToken = generateAccessToken(user);
        res.json({ accessToken });
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
      res.json({ message: 'Logged out' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export { generateAccessToken, generateRefreshToken };
export default AuthController;
