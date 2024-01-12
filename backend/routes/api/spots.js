// Imports ----------------------------
const sequelize = require('sequelize')
const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const { setTokenCookie, restoreUser } = require('../../utils/auth');
const { Spot, SpotImage, Review } = require('../../db/models');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const router = express.Router();


//---------------------------------------

//Get all Spots

router.get('/', async (req, res, next) => {
    const allSpots = await Spot.findAll({
        include: [
            {
                model: Review,
                attributes: [
                    [
                        sequelize.fn('AVG', sequelize.col('stars')), 'avgRating'
                    ]
                ]
            },
            {
                model: SpotImage,
                attributes: ['url'],
                where: {preview: true},
                limit: 1
            }
        ],
        group: ['Spot.id']
    });

    allSpots.forEach(element => {
       element.dataValues.avgRating = element.dataValues.Reviews[0].dataValues.avgRating;
       element.dataValues.previewImage = element.dataValues.SpotImages[0].dataValues.url;

       delete element.dataValues.Reviews;
       delete element.dataValues.SpotImages;
    });

    res.json(allSpots)
})

//






// exports -------------------
module.exports = router;
//----------------------------
