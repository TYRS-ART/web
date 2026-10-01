import { defineQuery } from "next-sanity";

import { imageFields } from "./shared";

const rentableSpaces = /* groq */ `*[_type == "space" && rentable == true] | order(order asc, name.cs asc){
  _id, name, capacity, area, features,
  photo{ ${imageFields} }
}`;

/** Rentable spaces in Studio order (the enquiry action checks the chosen space against these). */
export const RENTAL_SPACES_QUERY = defineQuery(rentableSpaces);

export const RENTAL_QUERY = defineQuery(`{
  "page": *[_type == "rentalPage" && _id == "rentalPage"][0]{
    headline, intro, formIntro, quote,
    included[]{ _key, title, body }
  },
  "spaces": ${rentableSpaces},
  "email": *[_type == "settings" && _id == "settings"][0].email
}`);
