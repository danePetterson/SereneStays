// Imports ----------------------------
const sequelize = require('sequelize')
const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const { setTokenCookie, restoreUser, requireAuth } = require('../../utils/auth');
const { Spot, SpotImage, Review, User, SpotReview } = require('../../db/models');

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

//---------------------------------------

//Get all Spots owned by the Current User

// requires authentication

router.get('/current', requireAuth, async (req, res, next) => {

    const { user } = req;
    const userId = user.dataValues.id

/*     const spotsOwnedByUser = await User.findByPk(userId, {
        attributes: ['id'],
        include: [
            {
                model: Spot,
                include: [
                    {
                        model: Review,
                        attributes: [[
                            sequelize.fn('AVG', sequelize.col('stars')), 'avgRating'
                        ]]
                    },
                    {
                        model: SpotImage,
                        attributes: ['url'],
                        where: {preview: true},
                        limit: 1
                    }
                ],
                group: ['Spot.id']
            }
        ],
    })
 */

    const spotsOwnedByUser = await Spot.findAll({
        where: {
            ownerId: userId
        },
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
                attributes:['url'],
                where: {preview: true},
                limit: 1
            }
        ],
        group: ['Spot.id']
    })


    const formattedResponse = {
        Spots: []
    }
    
    spotsOwnedByUser.forEach(element => {


        if (element.dataValues.Reviews && element.dataValues.Reviews[0]) {
            element.dataValues.avgRating = element.dataValues.Reviews[0].dataValues.avgRating;
            delete element.dataValues.Reviews;
        }

        if (element.dataValues.SpotImages && element.dataValues.SpotImages[0]) {
            element.dataValues.previewImage = element.dataValues.SpotImages[0].dataValues.url;
            delete element.dataValues.SpotImages;
        }
        formattedResponse.Spots.push(element)

    });
    console.log(formattedResponse)
    console.log(spotsOwnedByUser)

   res.json(formattedResponse)

})

//----------------------------------------

//Get details of a Spot from id
//returns details of a spot specified by its id

router.get('/:spotId', async (req, res, next) => {

    const spotId = req.params.spotId

    const spotDetails = await Spot.findByPk(spotId, {
        include: [
            {
                model: Review,
                attributes: [[
                    sequelize.fn('COUNT', sequelize.col('Reviews.id')), 'numReviews'
                ]]
            },
            {
                model: Review,
                attributes:[[
                    sequelize.fn('AVG', sequelize.col('stars')), 'avgStarRating'
                ]]
            },
            {
                model: SpotImage,
                attributes: ['id','url','preview']
            },
            {
                model: User,
                attributes: ['id','firstName','lastName']
            }
        ]
    })

    //not found error handle
    console.log(spotDetails)

    if(!spotDetails.dataValues.id) return res.status(404).json({
        "message": "Spot couldn't be found"
      })
    //----------------------


    spotDetails.dataValues.numReviews = spotDetails.dataValues.Reviews[0].dataValues.numReviews
    spotDetails.dataValues.avgStarRating = spotDetails.dataValues.Reviews[0].dataValues.avgStarRating


    //below is extra code done so that the body of the request matches the docs EXACTLY
    spotDetails.dataValues.SpotImagesDeleteMe = spotDetails.dataValues.SpotImages
    delete spotDetails.dataValues.SpotImages
    spotDetails.dataValues.SpotImages = spotDetails.dataValues.SpotImagesDeleteMe
    delete spotDetails.dataValues.SpotImagesDeleteMe
    //-----------------------

    spotDetails.dataValues.Owner = spotDetails.dataValues.User

    delete spotDetails.dataValues.Reviews
    delete spotDetails.dataValues.User

    console.log(spotDetails.dataValues.Reviews)

    res.json(spotDetails)

})

//-------------------------------------------

//Create a Spot
//requires authentication


router.post('/', requireAuth, async (req, res, next) => {
    const ownerId = req.user.id
    const { address, city, state, country, lat, lng, name, description, price }
    = req.body

    const newSpot = await Spot.create({ownerId, address, city, state, country, lat, lng, name, description, price })

    if(newSpot){
       return res.status(201).json(newSpot)
    }else{
        return res.status(400).json(
            {
                "message": "Bad Request", // (or "Validation error" if generated by Sequelize),
                "errors": {
                  "address": "Street address is required",
                  "city": "City is required",
                  "state": "State is required",
                  "country": "Country is required",
                  "lat": "Latitude is not valid",
                  "lng": "Longitude is not valid",
                  "name": "Name must be less than 50 characters",
                  "description": "Description is required",
                  "price": "Price per day is required"
                }
              }
        )
    }
    //not sure how to do error handling for this route since it is handled by validations and constraints
    //the endpoint is functional otherwise.
})

//---------------------------------------------

//Add an Image to a Spot based on the Spot's id
//create and return a new image for a spot specified by id

//requires authentication


router.post('/:spotId/images', requireAuth, async (req, res, next) => {


})






// exports -------------------
module.exports = router;
//----------------------------
