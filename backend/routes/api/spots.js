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
        if (element.dataValues.Reviews && element.dataValues.Reviews[0]) {
            element.dataValues.avgRating = element.dataValues.Reviews[0].dataValues.avgRating;
            delete element.dataValues.Reviews;
        }

        if (element.dataValues.SpotImages && element.dataValues.SpotImages[0]) {
            element.dataValues.previewImage = element.dataValues.SpotImages[0].dataValues.url;
            delete element.dataValues.SpotImages;
        }
    });

    res.json(allSpots)
})

//---------------------------------------

//Get all Spots owned by the Current User

// requires authentication

router.get('/current', requireAuth, async (req, res, next) => {

    const { user } = req;
    const userId = user.dataValues.id

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

    if (spotDetails.dataValues.Reviews && spotDetails.dataValues.Reviews[0]){
        spotDetails.dataValues.numReviews = spotDetails.dataValues.Reviews[0].dataValues.numReviews
        spotDetails.dataValues.avgStarRating = spotDetails.dataValues.Reviews[0].dataValues.avgStarRating
    }else{
        spotDetails.dataValues.numReviews = 0;
        spotDetails.dataValues.avgRating = null;
    }

    //below is extra code done so that the body of the request matches the docs EXACTLY
    if(spotDetails.dataValues.SpotImages){
        spotDetails.dataValues.SpotImagesDeleteMe = spotDetails.dataValues.SpotImages
        delete spotDetails.dataValues.SpotImages
        spotDetails.dataValues.SpotImages = spotDetails.dataValues.SpotImagesDeleteMe
        delete spotDetails.dataValues.SpotImagesDeleteMe
    }

    //-----------------------

    spotDetails.dataValues.Owner = spotDetails.dataValues.User

    delete spotDetails.dataValues.Reviews
    delete spotDetails.dataValues.User

    console.log(spotDetails.dataValues.Reviews)

    res.json(spotDetails)

})

//-------------------------------------------

/* Get all Reviews by a Spot's id
Returns all the reviews that belong to a spot specified by id. */

router.get('/:spotId/reviews', async (req, res, next) => {
    const spotId = req.params.spotId
    const reviews = await Review.findAll({
        where: {
            id: spotId
        },
        include: [
            {
                model: User,
                attributes: ['id', 'firstName', 'lastName']
            },
            {
                model: ReviewImage,
                attributes: ['id', 'url']
            }
        ],
        group: ['Review.id']
    })

    if(!reviews){
        res.status(404).json({
            "message": "Spot couldn't be found"
          })
    }

    const formattedResponse = {
        Reviews: [...reviews]
    }
    res.json(formattedResponse)
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
//Require proper authorization: Spot must belong to the current user


router.post('/:spotId/images', requireAuth, async (req, res, next) => {

    const spotId = req.params.spotId
    const currentUserId = req.user.id

    const spot = await Spot.findByPk(spotId)

    if(!spot || spot.dataValues.ownerId != currentUserId){
        return res.status(404).json({
            "message": "Spot couldn't be found"
          })
    }

    const { url, preview } = req.body

    const newSpotImage = await SpotImage.create({url, preview, spotId})

    if(newSpotImage){
        delete newSpotImage.dataValues.spotId
        return res.json(newSpotImage)
    }

})

//------------------------------------------------

/* Create a Review for a Spot based on the Spot's id
Create and return a new review for a spot specified by id.

Require Authentication: true */


router.post('/:spotId/reviews', requireAuth, async (req, res, next) => {

    const spotId = req.params.spotId
    const userId = req.user.id

    const { review, stars } = req.body

    const spot = await Spot.findByPk(spotId, {
        include: [
            {
                model: Review
            }
        ]
    });

    if(!spot){
       return res.status(404).json({
            "message": "Spot couldn't be found"
          })
    }

    if(spot.dataValues.Reviews){
       return res.status(500).json({
            "message": "User already has a review for this spot"
          })
    }

    const newReview = await Review.create({
        userId,
        spotId,
        review,
        stars
    })

    if(!newReview){
        return res.status(400).json({
            "message": "Bad Request", // (or "Validation error" if generated by Sequelize),
            "errors": {
              "review": "Review text is required",
              "stars": "Stars must be an integer from 1 to 5",
            }
          })
    }

    res.status(201).json(newReview)

})

//------------------------------------------------

//Edit a Spot
//Updates and returns an existing spot

//Requires authentication
//Spot must belong to the current user


router.put("/:spotId", requireAuth, async (req, res, next) => {

    const updateData = req.body
    const spotId = req.params.spotId
    const currentUserId = req.user.id

    const spot = await Spot.findByPk(spotId)

    if(spot && (!currentUserId || currentUserId != spot.dataValues.ownerId)){
        res.status(404).json({
            "message": "Spot couldn't be found"
          })
    }

    try {
        await Spot.update(updateData, {
            where: {
                id: spotId
            }
        })
    } catch (error) {
       return res.status(400).json({
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
          })
    }

    const updatedSpot = await Spot.findByPk(spotId)

    if(updatedSpot){
        return res.json(updatedSpot)
    }
})

//-----------------------------------------------------

//Delete a Spot
//Deletes an existing spot

//Requires Authentication
//Spot must belong to the current user

router.delete('/:spotId', requireAuth, async (req, res, next) => {

    const spotId = req.params.spotId;
    const currentUser = req.user.id;

    const spot = await Spot.findByPk(spotId);


    if(!spot || !currentUser || spot.dataValues.ownerId !== currentUser){

        return res.status(404).json({
            "message": "Spot couldn't be found"
          })
    }

   await Spot.destroy({
        where: {
            id: spotId
        }
    })

    res.json({
        "message": "Successfully deleted"
      })

})

//------------------------------------------------------






// exports -------------------
module.exports = router;
//----------------------------
