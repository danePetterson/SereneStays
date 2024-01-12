'use strict';

/** @type {import('sequelize-cli').Migration} */

const bcrypt = require("bcryptjs");

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
   queryInterface.bulkInsert('Users', [
    {
      firstName: 'FirstUser',
      lastName: 'FirstLastname',
      email: 'firstuser@gmail.com',
      username: 'FirstUser',
      hashedPassword: bcrypt.hashSync('password1')
    },
    {
      firstName: 'SecondUser',
      lastName: 'SecondLastname',
      email: 'Seconduser@gmail.com',
      username: 'SecondUser',
      hashedPassword: bcrypt.hashSync('password2')
    },
    {
      firstName: 'ThirdUser',
      lastName: 'ThirdLastname',
      email: 'Thirduser@gmail.com',
      username: 'ThirdUser',
      hashedPassword: bcrypt.hashSync('password3')
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
