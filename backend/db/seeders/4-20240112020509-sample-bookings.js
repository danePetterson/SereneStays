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
    options.tableName = 'Bookings'
    
   return queryInterface.bulkInsert(options, 'Bookings', [
    {
      spotId: 1,
      userId: 1,
      startDate: new Date(),
      endDate: new Date()
    },
    {
      spotId: 2,
      userId: 2,
      startDate: new Date(),
      endDate: new Date()
    },
    {
      spotId: 3,
      userId: 3,
      startDate: new Date(),
      endDate: new Date()
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
