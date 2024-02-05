// Imports ----------------------------
const sequelize = require('sequelize')
const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const { setTokenCookie, restoreUser, requireAuth } = require('../../utils/auth');
const { Spot, SpotImage, Review, ReviewImage, User, SpotReview, Booking } = require('../../db/models');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const router = express.Router();


//----------------------------------------------------------------


/* Delete a Spot Image
Delete an existing image for a Spot.

Require Authentication: true

Require proper authorization: Spot must belong to the current user */


router.delete('/:imageId', requireAuth, async (req, res, next) => {

    const imageId = req.params.imageId
    const userId = req.user.id

    const imageOwner = await SpotImage.findByPk(imageId, {
        include: [
            {
                model: Spot,
                attributes: ['ownerId']
            }
        ]
    })
    console.log(imageOwner)

    if(!imageOwner){
        return res.status(404).json({
            "message": "Spot Image couldn't be found"
          })
    }

    if(imageOwner.dataValues.Spot.dataValues.ownerId != userId){
        return res.status(403).json({
            "message": "Forbidden"
          })
    }

    await SpotImage.destroy({
        where: {
            id: imageId
        }
    })

    res.json({
        "message": "Successfully deleted"
      })

})





























// exports -------------------
module.exports = router;
//----------------------------
