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

//-----------------------------------------------------------


//Get all Reviews of the Current User
//Returns all the reviews written by the current user.

//Requires Authentication

router.get('/current', requireAuth, async (req, res, next) => {

    const currentUserId = req.user.id

    const reviewsByCurrentUser = await Review.findAll({

        where: {
            userId: currentUserId
        },
        include: [
            {
                model: User,
                attributes: ['id','firstName','lastName']
            },
            {
                model: Spot,
                attributes: [
                    'id',
                    'ownerId',
                    'address',
                    'city',
                    'state',
                    'country',
                    'lat',
                    'lng',
                    'name',
                    'price'
                ],
                include: [
                    {
                        model: SpotImage,
                        attributes: ['url'],
                        where: {preview: true},
                        limit: 1
                    }

                ]
            },
            {
                model: ReviewImage,
                attributes: ['id', 'url']
            }
        ],
        group: ['Review.id']

    })

    //console.log(reviewsByCurrentUser[0].dataValues.Spot.dataValues.SpotImages[0].dataValues.url)

    const formattedResponse = {
        Reviews: []
    }

    reviewsByCurrentUser.forEach(element => {

        if(element.dataValues.Spot.dataValues.SpotImages[0].dataValues.url){
            element.dataValues.Spot.dataValues.previewImage = element.dataValues.Spot.dataValues.SpotImages[0].dataValues.url
            delete element.dataValues.Spot.dataValues.SpotImages
        }
    });

    formattedResponse.Reviews = [...reviewsByCurrentUser]

    res.json(formattedResponse)

})

//-----------------------------------------------------------------

/* Add an Image to a Review based on the Review's id
Create and return a new image for a review specified by id.

Require Authentication: true

Require proper authorization: Review must belong to the current user */

router.post('/:reviewId/images', requireAuth, async (req, res, next) => {

    const reviewId = req.params.reviewId

    const url = req.body.url

    const userId = req.user.id



    const review = await Review.findByPk(reviewId, {
        include: [
            {
                model: ReviewImage
            }
        ]
    })

    if(!review){
        return res.status(404).json({
            "message": "Review couldn't be found"
          })
    }

    if(review.dataValues.userId != userId){
        return res.status(403).json({
            "message": "Forbidden"
          })
    }

    if(review && review.dataValues.ReviewImages.length >= 10){
       return res.status(403).json({
            "message": "Maximum number of images for this resource was reached"
          })
    }

    const newReviewImage = await ReviewImage.create({
        url,
        reviewId
    })

    delete newReviewImage.dataValues.reviewId

    res.json(newReviewImage)
})

//---------------------------------------------------------------

/* Edit a Review
Update and return an existing review.

Require Authentication: true

Require proper authorization: Review must belong to the current user */

router.put('/:reviewId', requireAuth, validateReview, async (req, res, next) => {

    const reviewId = req.params.reviewId
    const updateData = req.body
    const userId = req.user.id

    const review = await Review.findByPk(reviewId, {
        include: [
            {
                model: User
            }
        ]
    })

    if(!review){
        return res.status(404).json({
            "message": "Review couldn't be found"
          })
    }
    //console.log(review.dataValues)
    if(review && review.dataValues.User.dataValues.id != userId ){

       return res.status(403).json({
            "message": "Forbidden"
          })
    }


    const editedReview = await Review.update(updateData, {
        where: {
            id: reviewId
        }
    })


    if(!editedReview){
        res.status(400).json({
            "message": "Bad Request", // (or "Validation error" if generated by Sequelize),
            "errors": {
              "review": "Review text is required",
              "stars": "Stars must be an integer from 1 to 5",
            }
          })
    }

    const returnedEditedReview = await Review.findByPk(reviewId)

    res.json(returnedEditedReview)

})

//-----------------------------------------------------------------


/* Delete a Review
Delete an existing review.

Require Authentication: true

Require proper authorization: Review must belong to the current user
 */

router.delete('/:reviewId', requireAuth, async (req, res, next) => {

    const reviewId = req.params.reviewId
    const userId = req.user.id


    const review = await Review.findByPk(reviewId, {
        include: [
            {
                model: User
            }
        ]
    })
    if(!review){
        return res.status(404).json({
            "message": "Review couldn't be found"
          })
    }
    //console.log(review.dataValues)
    if(review && review.dataValues.userId !== userId){

        return res.status(403).json({
             "message": "Forbidden"
           })
     }else{

        await Review.destroy({
            where: {
                id: reviewId
            }
         })
         return res.json({
            "message": "Successfully deleted"
          })
     }

})

//------------------------------------------------------------------




// exports -------------------
module.exports = router;
//----------------------------
