const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/users', verifyToken, authorizeRoles('admin'), authController.getAllUsers);
router.delete('/users/:id', verifyToken, authorizeRoles('admin'), authController.deleteUser);

module.exports = router;
