const app = require("./app");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
// const multer = require("multer");
// const GridFsStorage = require("multer");
// const Grid = require("gridfs-stream");
// const methodOverride = require("method-override");

// app.use(methodOverride("_method"));

dotenv.config({ path: "./config.env" });

process.on("uncaughtException", (err) => {
  console.log(err);
  process.exit(1);
});

const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

const User = require("./models/user");
const Appointment = require("./models/appointment");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then((connection) => {
    console.log("DB connection is successful");
  })
  .catch((err) => {
    console.log(err);
  });

// mongoose
//   .connect(DB)
//   .then(() => {
//     console.log("DB connection is successful");
//     // Initialize gfs once the connection is open
//     gfs = Grid(mongoose.connection.db, mongoose.mongo);
//     gfs.collection("uploads");
//   })
//   .catch((err) => {
//     console.error(err);
//   });

// mongoose.connection
//   .once("open", () => {
//     console.log("Connection open, GridFS initialized");
//   })
//   .on("error", (error) => {
//     console.error("Some error", error);
//   });

// const storage = new GridFsStorage({
//   url: DB,
//   file: (req, file) => {
//     return new Promise((resolve, reject) => {
//       const filename = file.originalname;
//       const fileInfo = {
//         filename: filename,
//         bucketName: "uploads",
//       };
//       resolve(fileInfo);
//     });
//   },
// });

// const upload = multer({ storage });

const port = process.env.PORT || 8000;
server.listen(port, () => {
  console.log(`App running on port ${port} ...`);
});

io.on("connection", async (socket) => {
  console.log(JSON.stringify(socket.handshake.query));
  const user_id = socket.handshake.query["user_id"];

  console.log(`User connected ${socket.id}`);

  if (user_id != null && Boolean(user_id)) {
    try {
      await User.findByIdAndUpdate(user_id, {
        socket_id: socket.id,
        status: "Online",
      });
    } catch (e) {
      console.log(e);
    }
  }

  // We can write our socket event listeners in here...

  socket.on("appointment_request", async (data) => {
    const to = await User.findById(data.to).select("socket_id");
    const from = await User.findById(data.from).select("socket_id");

    // save appointment to database
    const new_appointment = await Appointment.create(data);
    // emit event request received to recipient
    io.to(to?.socket_id).emit("new_appointment_request", {
      message: "You have received a new Appointment request",
      data: new_appointment,
    });
    io.to(from?.socket_id).emit("request_sent", {
      message: "Request Sent successfully!",
    });
  });

  socket.on("approve_reject_appointment", async (data) => {
    const { id, status } = data;

    // console.log("appoint sfv:", data);

    const updated_appointment = await Appointment.findByIdAndUpdate(
      id,
      { status: status },
      {
        new: true,
      }
    );

    const to_id = updated_appointment.to;
    const from_id = updated_appointment.from;
    const to = await User.findById(to_id).select("socket_id");
    const from = await User.findById(from_id).select("socket_id");

    // emit event request received to recipient
    io.to(to?.socket_id).emit("approve_reject_sent", {
      message:
        status === "Approved"
          ? `You have successfully approved the request of ${updated_appointment.studentName}`
          : `You have successfully rejected the request of ${updated_appointment.studentName}`,
      status: "success",
      data: updated_appointment,
    });
    io.to(from?.socket_id).emit("approve_reject_recieved", {
      message:
        status === "Approved"
          ? `Your Request is Approved by ${updated_appointment.doctorName}`
          : `Your Request is Rejected by ${updated_appointment.doctorName}`,
      status: status === "Approved" ? "success" : "error",
      data: updated_appointment,
    });
  });

  socket.on("add_remark", async (data) => {
    const { id, remark } = data;
    // console.log("this is data", data);
    const updated_appointment = await Appointment.findByIdAndUpdate(
      id,
      { remark: remark },
      {
        new: true,
      }
    );
    const to_id = updated_appointment.to;
    const from_id = updated_appointment.from;
    const to = await User.findById(to_id).select("socket_id");
    const from = await User.findById(from_id).select("socket_id");

    io.to(to?.socket_id).emit("remark_sent", {
      message: `Remark is sent to ${updated_appointment.studentName}`,
      status: "success",
      data: updated_appointment,
    });

    io.to(from?.socket_id).emit("remark_recieved", {
      message: `${updated_appointment.doctorName} sent your a remark`,
      status: "success",
      data: updated_appointment,
    });
  });

  socket.on("end", async (data) => {
    // Find user by ID and set status as offline
    // console.log("logout data: ", data);
    if (data.user_id) {
      await User.findByIdAndUpdate(data.user_id, { status: "Offline" });
    }

    // broadcast to all conversation rooms of this user that this user is offline (disconnected)

    console.log("closing connection");
    socket.disconnect(0);
  });
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
