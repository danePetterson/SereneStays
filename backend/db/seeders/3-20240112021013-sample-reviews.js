'use strict';

/** @type {import('sequelize-cli').Migration} */

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}


module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
   options.tableName = 'Reviews'

   await queryInterface.bulkInsert(options, 'Reviews', [
    {
      userId: 1,
      spotId: 1,
      review: 'spot was most excellent',
      stars: 5
    },
    {
      userId: 2,
      spotId: 2,
      review: 'spot was good',
      stars: 4
    },
    {
      userId: 3,
      spotId: 3,
      review: 'spot was bad',
      stars: 2
    }
   ])
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
