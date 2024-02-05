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

    options.tableName = 'SpotImages'

   await queryInterface.bulkInsert(options,[
    {
      url: 'www.google.com/images/someImage',
      preview: true,
      spotId: 1
    },
    {
      url: 'www.google.com/images2/someImage2',
      preview: true,
      spotId: 2
    },
    {
      url: 'www.google.com/images3/someImage3',
      preview: true,
      spotId: 3
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
