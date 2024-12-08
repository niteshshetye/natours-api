const express = require('express');
const {
  getUsersList,
  updateUserDetails,
  deleteUser,
  uploadUserPhoto,
  resizeUserPhoto
} = require('../controller/users');
const { verifyToken, allowedRoles } = require('../controller/auth');

const routes = express.Router();

routes
  .route('/')
  .get(verifyToken, allowedRoles('admin'), getUsersList)
  .delete(verifyToken, deleteUser)
  .patch(verifyToken, uploadUserPhoto, resizeUserPhoto, updateUserDetails);

module.exports = routes;
