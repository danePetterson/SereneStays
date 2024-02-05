// Imports ----------------------------
const sequelize = require('sequelize')
const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const { setTokenCookie, restoreUser, requireAuth } = require('../../utils/auth');
const { Spot, SpotImage, Review, ReviewImage, User, Booking, SpotReview } = require('../../db/models');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const router = express.Router();

const validateSpots = [
    check("address")
    .exists({checkFalsy: true})
    .isLength({min: 1})
    .withMessage("Street address is required"),

    check("city")
    .exists({checkFalsy: true})
    .isLength({min: 1})
    .withMessage("City is required"),

    check("state")
    .exists({checkFalsy: true})
    .isLength({min: 1})
    .withMessage("State is required"),

    check("country")
    .exists({checkFalsy: true})
    .isLength({min: 1})
    .withMessage("Country is required"),

    check("lat")
    .exists({checkFalsy: true})
    .isFloat({min: -90, max: 90})
    .withMessage("Latitude is not valid"),

    check("lng")
    .exists({checkFalsy: true})
    .isFloat({min: -180, max: 180})
    .withMessage("Longitude is not valid"),

    check("name")
    .exists({checkFalsy: true})
    .isLength({min: 1, max: 50})
    .withMessage("Name must be less than 50 characters"),

    check("description")
    .exists({checkFalsy: true})
    .isLength({min: 1})
    .withMessage("Description is required"),

    check("price")
    .exists({checkFalsy: true})
    .isFloat({min: 0})
    .withMessage("Price per day is required and must be more than 0"),

    handleValidationErrors
]

const validateReview = [
    check("review")
    .exists({checkFalsy: true})
    .isLength({min: 1})
    .withMessage("Review text is required"),

    check("stars")
    .exists({checkFalsy: true})
    .isFloat({min: 1, max: 5})
    .withMessage("Stars must be an integer from 1 to 5"),

    handleValidationErrors
]

const getAllSpotsValidation = [

    check("page")
    .isFloat({min: 1})
    .withMessage("Page must be greater than or equal to 1")
    .optional(),

    check("size")
    .isFloat({min: 1})
    .withMessage("Size must be greater than or equal to 1")
    .optional(),

    check("minLat")
    .isFloat({min: -90, max: 90})
    .withMessage("Minimum latitude is invalid")
    .optional(),

    check("maxLat")
    .isFloat({min: -90, max: 90})
    .withMessage("Maximum latitude is invalid")
    .optional(),

    check("minLng")
    .isFloat({min: -180, max: 180})
    .withMessage("Minimum longitude is invalid")
    .optional(),

    check("maxLng")
    .isFloat({min: -180, max: 180})
    .withMessage("Maximum longitude is invalid")
    .optional(),

    check("minPrice")
    .isFloat({min: 0})
    .withMessage("Minimum price must be greater than or equal to 0")
    .optional(),

    check("maxPrice")
    .isFloat({min: 0})
    .withMessage("Maximum price must be greater than or equal to 0")
    .optional(),

    handleValidationErrors

]


//---------------------------------------

//Get all Spots

router.get('/', getAllSpotsValidation, async (req, res, next) => {


      // Validate and parse query parameters
      const page = parseInt(req.query.page) || 1;
      const size = parseInt(req.query.size) || 20;
      const minLat = parseFloat(req.query.minLat) || -90;
      const maxLat = parseFloat(req.query.maxLat) || 90;
      const minLng = parseFloat(req.query.minLng) || -180;
      const maxLng = parseFloat(req.query.maxLng) || 180;
      const minPrice = parseFloat(req.query.minPrice) || 0;
      const maxPrice = parseFloat(req.query.maxPrice) || 99999999999;

    const allSpots = await Spot.findAll({
        include: [
            {
                model: Review,
                attributes: [
                    [
                        sequelize.fn('AVG', sequelize.col('Reviews.stars')), 'avgRating'
                    ]
                ]
            },
            {
                model: SpotImage,
                attributes: ['url'],
                where: {preview: true},
                limit: 1,
                required: false
            }
        ],
        where: {
            lat: { [Op.between]: [minLat, maxLat] },
            lng: { [Op.between]: [minLng, maxLng] },
            price: { [Op.between]: [minPrice, maxPrice] }
        },
        group: ['Spot.id', 'Reviews.id'],
        offset: ((page - 1) * size),
        subQuery: false,
        limit: size

    });

    allSpots.forEach(element => {
        if (element.dataValues.Reviews && element.dataValues.Reviews[0]) {
            element.dataValues.avgRating = element.dataValues.Reviews[0].dataValues.avgRating;
            delete element.dataValues.Reviews;
        }
        delete element.dataValues.Reviews;

        if (element.dataValues.SpotImages && element.dataValues.SpotImages[0]) {
            element.dataValues.previewImage = element.dataValues.SpotImages[0].dataValues.url;
            delete element.dataValues.SpotImages;
        }
        delete element.dataValues.SpotImages;
    });

    res.json({Spots: allSpots})

/*
        // Validate and parse query parameters
        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 20;
        const minLat = parseFloat(req.query.minLat) || -90;
        const maxLat = parseFloat(req.query.maxLat) || 90;
        const minLng = parseFloat(req.query.minLng) || -180;
        const maxLng = parseFloat(req.query.maxLng) || 180;
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || 99999999999;

        // Validate query parameters
        if (page < 1 || size < 1 || minLat < -90 || maxLat > 90 || minLng < -180 || maxLng > 180 || minPrice < 0 || maxPrice < 0) {
            return res.status(400).json({
                message: "Bad Request",  // (or "Validation error" if generated by Sequelize),
                errors: {
                    "page": "Page must be greater than or equal to 1",
                    "size": "Size must be greater than or equal to 1",
                    "maxLat": "Maximum latitude is invalid",
                    "minLat": "Minimum latitude is invalid",
                    "minLng": "Maximum longitude is invalid",
                    "maxLng": "Minimum longitude is invalid",
                    "minPrice": "Minimum price must be greater than or equal to 0",
                    "maxPrice": "Maximum price must be greater than or equal to 0"
                }
            });
        }

        // Modify the Sequelize query to include filters

        const allSpots = await Spot.findAll({

            include: [
                {
                    model: Review,
                    attributes: [
                        [sequelize.fn('AVG', sequelize.col('stars')), 'avgRating']
                    ]
                },
                {
                    model: SpotImage,
                    attributes: ['url'],
                    where: { preview: true },
                    limit: 1
                }
            ],
            where: {
                lat: { [Op.between]: [minLat, maxLat] },
                lng: { [Op.between]: [minLng, maxLng] },
                price: { [Op.between]: [minPrice, maxPrice] }
            },
            group: ['Spot.id'],
            //subQuery: false,
            offset: (page - 1) * size,
            limit: size,
        });

        console.log(allSpots)

      /*   if(!allSpots[0].dataValues.id){
            return res.status(400).json({
                "message": "Bad Request", // (or "Validation error" if generated by Sequelize),
                "errors": {
                  "page": "Page must be greater than or equal to 1",
                  "size": "Size must be greater than or equal to 1",
                  "maxLat": "Maximum latitude is invalid",
                  "minLat": "Minimum latitude is invalid",
                  "minLng": "Maximum longitude is invalid",
                  "maxLng": "Minimum longitude is invalid",
                  "minPrice": "Minimum price must be greater than or equal to 0",
                  "maxPrice": "Maximum price must be greater than or equal to 0"
                }
              })
        } */

        /* // Process and format the result as needed
        allSpots.forEach(element => {
            if (element.dataValues.Reviews  && element.dataValues.Reviews[0]) {
                element.dataValues.avgRating = element.dataValues.Reviews[0].dataValues.avgRating;
                //delete element.dataValues.Reviews;
            }
            delete element.dataValues.Reviews;

            if (element.dataValues.SpotImages && element.dataValues.SpotImages[0]) {
                element.dataValues.previewImage = element.dataValues.SpotImages[0].dataValues.url;
                //delete element.dataValues.SpotImages;
            }
            delete element.dataValues.SpotImages;
        });

        res.json({
            Spots: allSpots,
            page: page,
            size: size
        }); */

});




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
                        sequelize.fn('AVG', sequelize.col('Reviews.stars')), 'avgRating'
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
        group: ['Spot.id', 'Reviews.id']
    })


    const formattedResponse = {
        Spots: []
    }

    spotsOwnedByUser.forEach(element => {


        if (element.dataValues.Reviews && element.dataValues.Reviews[0]) {
            element.dataValues.avgRating = element.dataValues.Reviews[0].dataValues.avgRating;
            delete element.dataValues.Reviews;
        }else {
            element.dataValues.avgRating = null;
            delete element.dataValues.Reviews
        }

        if (element.dataValues.SpotImages && element.dataValues.SpotImages[0]) {
            element.dataValues.previewImage = element.dataValues.SpotImages[0].dataValues.url;
            delete element.dataValues.SpotImages;
        }else {
            element.dataValues.previewImage = null;
            delete element.dataValues.SpotImages
        }
        formattedResponse.Spots.push(element)

    });
    //console.log(formattedResponse)
    //console.log(spotsOwnedByUser)

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
                    sequelize.fn('AVG', sequelize.col('Reviews.stars')), 'avgStarRating'
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
    //console.log(spotDetails)

    if(!spotDetails.dataValues.id) return res.status(404).json({
        "message": "Spot couldn't be found"
      })
    //----------------------

    if (spotDetails.dataValues.Reviews && spotDetails.dataValues.Reviews[0]){
        spotDetails.dataValues.numReviews = spotDetails.dataValues.Reviews[0].dataValues.numReviews
        spotDetails.dataValues.avgStarRating = spotDetails.dataValues.Reviews[0].dataValues.avgStarRating
    }else{
        spotDetails.dataValues.numReviews = 0;
        spotDetails.dataValues.avgStarRating = null;
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

   // console.log(spotDetails.dataValues.Reviews)

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
        group: ['Review.id', 'User.id']
    })

    if(!reviews || !reviews[0]){
       return res.status(404).json({
            "message": "Spot couldn't be found"
          })
    }

    const formattedResponse = {
        Reviews: [...reviews]
    }


    res.json(formattedResponse)
})


//------------------------------------------------------

/* Get all Bookings for a Spot based on the Spot's id
Return all the bookings for a spot specified by id.

Require Authentication: true */


router.get('/:spotId/bookings', requireAuth, async (req, res, next) => {

    const spot = req.params.spotId
    const user = req.user.id

    let ownerOfSpot = await Spot.findByPk(spot)

    if(!ownerOfSpot){
        return res.status(404).json({
            "message": "Spot couldn't be found"
          })
    }

    ownerOfSpot = ownerOfSpot.dataValues.ownerId

    if(user !== ownerOfSpot){
        const allBookings = await Booking.findAll({
            where: {
                spotId: spot
            },
            attributes: ['spotId', 'startDate', 'endDate'],
            group: ['Booking.id']
        })

        return res.json(allBookings)
    }

    if(user === ownerOfSpot){

        const allBookings = await Booking.findAll({
            where: {
                spotId: spot
            },
            include: [
                {
                    model: User,
                    attributes: ['id','firstName','lastName']
                }
            ],
            group: ['Booking.id']
        })
        return res.json(allBookings)
    }

})


//-------------------------------------------

//Create a Spot
//requires authentication


router.post('/', requireAuth, validateSpots, async (req, res, next) => {
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

    if(spot && spot.dataValues && spot.dataValues.ownerId != currentUserId){
        res.status(403).json({
            "message": "Forbidden"
          })
    }

    if(!spot /* || spot.dataValues.ownerId != currentUserId */){
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


router.post('/:spotId/reviews', requireAuth, validateReview, async (req, res, next) => {

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

    const hasUserReviewedSpot = await Review.findAll({
        where: {
            userId: userId,
            spotId: spotId
        }
    })

    if(hasUserReviewedSpot[0]){
        //console.log(hasUserReviewedSpot)
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

/* Create a Booking from a Spot based on the Spot's id
Create and return a new booking from a spot specified by id.

Require Authentication: true

Require proper authorization: Spot must NOT belong to the current user */


router.post('/:spotId/bookings', requireAuth, async (req, res, next) => {

    const spotId = req.params.spotId
    const userId = req.user.id

    const { startDate, endDate } = req.body

    const currentDate = new Date();

    const spot = await Spot.findByPk(spotId, {
        include: [
            {
                model: User
            }
        ]
    })

    if(!spot){
        return res.status(404).json({
            "message": "Spot couldn't be found"
          })
    }

    if(spot && spot.dataValues.User.dataValues.id == userId){

       return res.status(403).json({
            "message": "Forbidden"
          })
    }

    const checkAvailability = await Booking.findAll({
        /*
        where: {
            [Op.or]: [
                {startDate: startDate},
                {endDate: endDate},
                {startDate: endDate},
                {endDate: startDate}
            ]
        }
        */
            where: {
              [Op.or]: [
                {
                  [Op.and]: [
                    { startDate: { [Op.lte]: startDate } },
                    { endDate: { [Op.gte]: startDate } },
                  ],
                },
                {
                  [Op.and]: [
                    { startDate: { [Op.lte]: endDate } },
                    { endDate: { [Op.gte]: endDate } },
                  ],
                },
                {
                  [Op.and]: [
                    { startDate: { [Op.gte]: startDate } },
                    { endDate: { [Op.lte]: endDate } },
                  ],
                },
              ],
            }

    })

    if(new Date(startDate) < currentDate){

        return res.status(400).json(
            {
                "message": "Bad Request",
                "errors": {
                    "startDate": "Booking date cannot be in the past"
                }
            }
        )

    }

    if(startDate === endDate || endDate < startDate){
        return res.status(400).json(
            {
                "message": "Bad Request", // (or "Validation error" if generated by Sequelize),
                "errors": {
                  "endDate": "endDate cannot be on or before startDate"
                }
              }
        )
    }

    if(checkAvailability[0]){
        return res.status(403).json({
            "message": "Sorry, this spot is already booked for the specified dates",
            "errors": {
              "startDate": "Start date conflicts with an existing booking",
              "endDate": "End date conflicts with an existing booking"
            }
          })
    }

    const newBooking = await Booking.create({
        spotId,
        userId,
        startDate,
        endDate
    })

    if(!newBooking){
        res.status(400).json({
            "message": "Bad Request", // (or "Validation error" if generated by Sequelize),
            "errors": {
              "endDate": "endDate cannot be on or before startDate"
            }
          })
    }

    res.json(newBooking)
})


//------------------------------------------------

//Edit a Spot
//Updates and returns an existing spot

//Requires authentication
//Spot must belong to the current user


router.put("/:spotId", requireAuth, validateSpots, async (req, res, next) => {

    const updateData = req.body
    const spotId = req.params.spotId
    const currentUserId = req.user.id

    const spot = await Spot.findByPk(spotId)

    if(!spot){
        res.status(404).json({
            "message": "Spot couldn't be found"
          })
    }else if(spot && (!currentUserId || currentUserId != spot.dataValues.ownerId)){
        res.status(403).json({
            "message": "Forbidden"
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


    if(!spot){
        return res.status(404).json({
            "message": "Spot couldn't be found"
          })
    }else if(!currentUser || spot.dataValues.ownerId !== currentUser){
        return res.status(403).json({
            "message": "Forbidden"
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
