import axios from 'axios';
import { faker } from '@faker-js/faker';

const url = 'http://localhost:3000/users';

function takeExecutionTime(callback) {
  return function (...args) {
    const start = performance.now();
    const result = callback.apply(this, args);
    const end = performance.now();
    console.log(`Execution time: ${end - start} milliseconds`);
    return result;
  };
}

const insertFakeUsers = takeExecutionTime(
  function () {
    console.log('Inserting fake users...');
    for (let i = 0; i < 1000; i++) {
      axios
        .post(url, {
          fullName: faker.name.fullName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
        })
        .then((response) => {
          console.log(response.data);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }
);

insertFakeUsers();
