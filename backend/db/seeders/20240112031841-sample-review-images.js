'use strict';

/** @type {import('sequelize-cli').Migration} */
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
   queryInterface.bulkInsert('ReviewImages', [
    {
      url: 'www.google.com/images/image1',
      reviewId: 1
    },
    {
      url: 'www.google.com/images/image2',
      reviewId: 2
    },
    {
      url: 'www.google.com/images/image3',
      reviewId: 3
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
