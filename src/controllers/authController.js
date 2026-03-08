const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { db } = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/bcrypt');

const register = catchAsync(async (req, res, next) => {
  const { email, password, first_name, last_name, avatar_url } = req.body;

  const existing = await db('users').where({ email }).first();
  if (existing) {
    return next(ApiError.conflict('Email already in use'));
  }

  const hashed = await hashPassword(password);

  const [user] = await db('users')
    .insert({
      email,
      password: hashed,
      first_name,
      last_name,
      avatar_url: avatar_url || null,
    })
    .returning(['id', 'email', 'first_name', 'last_name', 'avatar_url']);

  req.session.userId = user.id;

  res.status(201).json({ user });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await db('users').where({ email }).first();
  if (!user || !user.is_active) {
    return next(ApiError.unauthorized('Invalid credentials'));
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    return next(ApiError.unauthorized('Invalid credentials'));
  }

  await db('users').where({ id: user.id }).update({ last_login_at: db.fn.now() });

  req.session.userId = user.id;

  res.json({
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url,
    },
  });
});

const logout = catchAsync(async (req, res) => {
  if (!req.session) {
    return res.status(204).send();
  }

  req.session.destroy(() => {
    res.clearCookie('wabbitworks.sid');
    res.status(200).json({ message: 'Logged out' });
  });
});

const me = catchAsync(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { register, login, logout, me };
