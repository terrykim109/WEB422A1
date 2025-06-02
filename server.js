/********************************************************************************
 * WEB422 – Assignment 1
 *
 * I declare that this assignment is my own work in accordance with Seneca's
 * Academic Integrity Policy:
 *
 * https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
 *
 * Name: Hyun Joon Kim Student ID: 117639237 Date: May 18 2025
 *
 * Published URL: https://web-422-a1-g6pb.vercel.app/
 *
 ********************************************************************************/
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;
const ListingsDB = require("./modules/listingsDB.js");
const db = new ListingsDB();

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.json({ message: "API Listening" });
});

// This route uses the body of the request to add a new "Listing" document to the collection
// and return the newly created listing object / fail message to the client.

app.post("/api/listings", async (req, res) => {
  try {
    // db.addNewListing(data): Create a new listing in the collection using the object
    // passed in the "data" parameter.
    const newListing = await db.addNewListing(req.body);
    res.status(201).json(newListing);
  } catch (err) {
    res.status(500).json({ message: "Unable to add listing", error: err });
  }
});

// This route must accept the numeric query parameters "page" and "perPage" as well as the (optional) string
// parameter "name". It will use these values to return all "Listings" objects for a specific "page" to the client as well as optionally filtering by
// "name", if provided (in this case, it will show both listings containing the name “Volcanoes National Park”).

app.get("/api/listings", async (req, res) => {
  const page = parseInt(req.query.page); // converting to integer
  const perPage = parseInt(req.query.perPage);
  const name = req.query.name; // optional param

  if (isNaN(page) || isNaN(perPage)) {
    // checking if page and perPage are numbers
    return res
      .status(400)
      .json({
        message: "Page or perPage are in an incorrect non-numerical format.",
      });
  }

  try {
    // db.getAllListing(page, perPage, name): Return an array of all listing for a specific page
    //  (sorted by number_of_reviews), given the number of items per page
    const listings = await db.getAllListings(page, perPage, name);
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: "Unable to get listings", error: err });
  }
});

// app.get("/api/listings", async (req, res) => {
//   const page = parseInt(req.query.page);
//   const perPage = parseInt(req.query.perPage);
//   const name = req.query.name;

//   console.log("Incoming request:", { page, perPage, name });

//   if (isNaN(page) || isNaN(perPage)) {
//     return res.status(400).json({
//       message: "Page or perPage are in an incorrect non-numerical format.",
//     });
//   }

//   try {
//     const listings = await db.getAllListings(page, perPage, name);
//     console.log("Listings returned:", listings.length);
//     res.json(listings);
//   } catch (err) {
//     console.error("Error getting listings:", err);
//     res.status(500).json({ message: "Unable to get listings", error: err });
//   }
// });




// This route must accept a route parameter that represents the _id of the desired listing object.
// It will use this parameter to return a specific "Listing" object to the client.

app.get("/api/listings/:id", async (req, res) => {
  try {
    // db.getListingById(Id): Return a single listing object whose "_id" value matches the "Id" parameter
    const listObj = await db.getListingById(req.params.id);
    if (!listObj) {
      res.status(404).json({ message: "No listing found" });
    } else {
      res.json(listObj);
    }
  } catch (err) {
    res.status(500).json({ message: "Unable to get listing", error: err });
  }
});

// This route must accept a route parameter that represents the _id of the desired listing object
//  as well as read the contents of the request body. It will use these values to update a
// specific "Listing" document in the collection and return a success / fail message to the client.

app.put("/api/listings/:id", async (req, res) => {
  try {
    const result = await db.updateListingById(req.body, req.params.id);
    if (result) {
      res.json({ message: "Listing update complete" });
    } else {
      res.status(404).json({ message: "No listing found for update" });
    }
  } catch (err) {
    res.status(500).json({ message: "Unable to update listing", error: err });
  }
});

// This route must accept a route parameter that represents the _id of the desired listing object, ie:
// It will use this value to delete a specific "Listing" document from the collection and
// return a success / fail message to the client.

app.delete("/api/listings/:id", async (req, res) => {
  try {
    // deleteListingById(Id): Delete an existing listing whose "_id" value matches the "Id" parameter
    const result = await db.deleteListingById(req.params.id);
    if (result) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "No listing found for deletion" });
    }
  } catch (err) {
    res.status(500).json({ message: "Unable to delete listing", error: err });
  }
});

// For Vercel
async function vercelHandler(req, res) {
  if (!db.Listing) {
    try {
      await db.initialize(process.env.MONGODB_CONN_STRING);
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Unable to initialize db", error: err.toString() });
    }
  }
  app(req, res);
}

if (process.env.VERCEL) {
  // For grading on vercel
  module.exports = vercelHandler;
} else {
  // db.initialize(connectionString): Establish a connection with the MongoDB server and initialize the "Listing"
  // model with the " listingsAndReviews" collection

  db.initialize(process.env.MONGODB_CONN_STRING)
    .then(() => {
      app.listen(process.env.PORT || 8080, () => {
        console.log(`server listening on: ${process.env.PORT || 8080}`);
      });
    })
    .catch((err) => {
      console.error("Failed to initialize DB:", err);
    });
}
