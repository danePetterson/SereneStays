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
   options.tableName = 'Spots'

    await queryInterface.bulkInsert(options,[
      {
        ownerId: 1,
        address: '11111 NE Rd',
        city: 'Portland',
        state: 'Oregon',
        country: 'United States of America',
        lat: 45.5152,
        lng: 122.6784,
        name: 'Spot 1 in Portland',
        description: 'This is a cool spot with lots of trees',
        price: 500
      },
      {
        ownerId: 2,
        address: '22222 NE Rd',
        city: 'Portland',
        state: 'Oregon',
        country: 'United States of America',
        lat: 46.5152,
        lng: 123.6784,
        name: 'Spot 2 in Portland',
        description: 'This is a spot with some water',
        price: 800
      },
      {
        ownerId: 3,
        address: '33333 NE Rd',
        city: 'Portland',
        state: 'Oregon',
        country: 'United States of America',
        lat: 47.5152,
        lng: 124.6784,
        name: 'Spot 3 in Portland',
        description: 'This is a cool spot with some mountains',
        price: 200
      },

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
