const {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
  getAllUsers,
  updateUserRole,
} = require('../services/auth.service');

/**
 * Handle user registration
 */
async function handleRegister(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const result = await registerUser({ name, email, password });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      error: 'RegistrationFailed',
      message: error.message || 'Failed to register user.',
    });
  }
}

/**
 * Handle user login
 */
async function handleLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });

    res.json({
      success: true,
      message: `Welcome back, ${result.user.name || result.user.email}!`,
      ...result,
    });
  } catch (error) {
    res.status(401).json({
      error: 'LoginFailed',
      message: error.message || 'Invalid credentials.',
    });
  }
}

/**
 * Get current authenticated user profile
 */
async function handleGetMe(req, res, next) {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'NotFound', message: 'User not found.' });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update current authenticated user profile
 */
async function handleUpdateProfile(req, res, next) {
  try {
    const { name, image, currentPassword, newPassword } = req.body;
    const updatedUser = await updateUserProfile(req.user.id, {
      name,
      image,
      currentPassword,
      newPassword,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    res.status(400).json({
      error: 'UpdateProfileFailed',
      message: error.message || 'Failed to update profile.',
    });
  }
}

/**
 * List all users (SuperAdmin only)
 */
async function handleGetUsers(req, res, next) {
  try {
    const users = await getAllUsers();
    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user role (SuperAdmin only)
 */
async function handleUpdateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const result = await updateUserRole(id, role);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: 'UpdateRoleFailed',
      message: error.message || 'Failed to update user role.',
    });
  }
}

module.exports = {
  handleRegister,
  handleLogin,
  handleGetMe,
  handleUpdateProfile,
  handleGetUsers,
  handleUpdateUserRole,
};
