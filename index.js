require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors(
  origin['https://hotelify-3e03f.web.app']
));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kdx8l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});



async function run() {
  try {
    // Connect the client to the server	(starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // rooms related apis
    const roomsCollection = client.db("hotelify").collection("rooms");
    const bookingsCollection = client.db("hotelify").collection("bookings");
    const reviewsCollection = client.db("hotelify").collection("reviews");

    // Rooms Related Methods
    // app.get("/rooms", async (req, res) => {
    //   const cursor = roomsCollection.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    // Endpoint to fetch rooms with sorting
    app.get("/rooms", async (req, res) => {
      // console.log("Query Parameters:", req.query); 

      try {
        const { sort } = req.query;

        let sortOption = {};
        if (sort === "low") {
          sortOption = { pricePerNight: 1 }; // Ascending
        } else if (sort === "high") {
          sortOption = { pricePerNight: -1 }; // Descending
        }

        // console.log("Sort Option:", sortOption); 
        const rooms = await roomsCollection.find().sort(sortOption).toArray();
        res.send(rooms);
      } catch (error) {
        console.error("Error fetching rooms:", error.message);
        res.status(500).send("Internal Server Error");
      }
    });


    

    app.get("/room-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await roomsCollection.findOne(query);
      res.send(result);
    });

    // Bookings Related Methods
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    // app.get("/bookings", async (req, res) => {
    //   const cursor = bookingsCollection.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    // app.get("/bookings", async (req, res) => {
    //   const userEmail = req.query.userEmail;

    //   // Check if userEmail is provided in the query
    //   if (!userEmail) {
    //     return res
    //       .status(400)
    //       .send({ message: "Email query parameter is required" });
    //   }

    //   try {
    //     // Filter bookings based on userEmail
    //     const query = { userEmail: userEmail };
    //     const cursor = bookingsCollection.find(query);
    //     const result = await cursor.toArray();
    //     res.send(result); // Send the filtered bookings
    //   } catch (error) {
    //     console.error("Error fetching bookings:", error);
    //     res.status(500).send({ message: "Failed to fetch bookings" });
    //   }
    // });

    app.get("/bookings", async (req, res) => {
      const { userEmail, roomId } = req.query;

      // Check if at least one parameter is provided
      if (!userEmail && !roomId) {
        return res.status(400).send({
          message: "Either userEmail or roomId query parameter is required",
        });
      }

      try {
        // Build a dynamic query based on provided parameters
        const query = {};
        if (userEmail) query.userEmail = userEmail; // Filter by userEmail if provided
        if (roomId) query.roomId = roomId; // Filter by roomId if provided

        const cursor = bookingsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result); // Send the filtered bookings
      } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).send({ message: "Failed to fetch bookings" });
      }
    });

    // Update
    app.put("/bookings/:id", async (req, res) => {
      const { id } = req.params;
      const { startDate, endDate } = req.body;

      try {
        const query = { _id: new ObjectId(id) };
        const update = { $set: { startDate, endDate } };
        const result = await bookingsCollection.updateOne(query, update);

        if (result.modifiedCount > 0) {
          res.send({ success: true, message: "Booking updated successfully" });
        } else {
          res
            .status(404)
            .send({ success: false, message: "Booking not found" });
        }
      } catch (error) {
        console.error("Error updating booking:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    });

    // Update
    // app.put("/bookings/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const updatedDates = req.body;
    //   const filter = { _id: new ObjectId(id) };
    //   const update = { $set: { ...updatedDates } };
    //   const result = await bookingsCollection.updateOne(filter, update);
    //   res.send(result);
    // });

    // Review
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    // Delete
    app.delete("/bookings/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const query = { _id: new ObjectId(id) };
        const result = await bookingsCollection.deleteOne(query);

        if (result.deletedCount > 0) {
          res.send({ success: true, message: "Booking deleted successfully" });
        } else {
          res
            .status(404)
            .send({ success: false, message: "Booking not found" });
        }
      } catch (error) {
        console.error("Error deleting booking:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    });

    // reviews releted api
    app.post("/reviews", async (req, res) => {
      const reviewData = req.body;

      try {
        const result = await reviewsCollection.insertOne(reviewData);
        res.send({
          success: true,
          message: "Review added successfully",
          result,
        });
      } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).send({
          success: false,
          message: "Internal server error",
        });
      }
    });

    // app.get("/reviews", async (req, res) => {
    //   const cursor = reviewsCollection.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    app.get("/reviews", async (req, res) => {
      const { roomId } = req.query;
      if (!roomId) {
        // console.log("No roomId provided in query.");
        return res
          .status(400)
          .send({ message: "Room ID query parameter is required" });
      }

      try {
        // console.log("Filtering reviews for roomId:", roomId);
        const query = { roomId: roomId.toString() };
        const cursor = reviewsCollection.find(query);
        const result = await cursor.toArray();

        res.send(result);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).send({ message: "Failed to fetch reviews" });
      }
    });

    // 6 leatest reviews
    app.get("/latest-reviews", async (req, res) => {
      const limit = parseInt(req.query.limit) || 6;
      try {
        const reviews = await reviewsCollection
          .find()
          .sort({ _id: -1 })
          .limit(limit)
          .toArray();
        res.send(reviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).send({ message: "Failed to fetch reviews" });
      }
    });
    // 6 leatest Rooms
    app.get("/latest-rooms", async (req, res) => {
      const limit = parseInt(req.query.limit) || 6;
      try {
        const reviews = await roomsCollection
          .find()
          .sort({ _id: -1 })
          .limit(limit)
          .toArray();
        res.send(reviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).send({ message: "Failed to fetch reviews" });
      }
    });
  } finally {
    // Ensures that the client will close when you finish/erro
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/", (req, res) => {
  res.send("Your Server is Ready");
});

app.listen(port, () => {
  console.log(`Server Running at: ${port}`);
});
