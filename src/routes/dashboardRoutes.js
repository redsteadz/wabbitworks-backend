const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const { getDashboard } = require('../controllers/dashboardController');

const router = express.Router();

router.use(requireAuth);
router.get('/', getDashboard);

module.exports = router;
