// Imports ----------------------------
const sequelize = require('sequelize')
const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const { setTokenCookie, restoreUser, requireAuth } = require('../../utils/auth');
const { Spot, SpotImage, Review, ReviewImage, User, SpotReview } = require('../../db/models');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const router = express.Router();


//-----------------------------------------------------------

/* Get all of the Current User's Bookings
Return all the bookings that the current user has made.

Require Authentication: true */














// exports -------------------
module.exports = router;
//----------------------------
