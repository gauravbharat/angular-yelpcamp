/** 16102020 - Gaurav - Export resuable graphql fragments  */
import { gql } from 'apollo-angular';

export const fragments = {
  User: {
    UserBasicInfo: `
      fragment UserBasicInfo on User {
        _id
        username
        email
        firstName
        lastName
        avatar
        createdAt
      }
    `,
  },
};
