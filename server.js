const app = require("./app");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
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
    if (!updated_appointment) {
      res.status(404).json({
        status: "error",
        message: "Not able to Approve or Reject the request. Please try later",
        data: updated_appointment,
      });
      return;
    }
    const to_id = updated_appointment.to;
    const from_id = updated_appointment.from;
    const to = await User.findById(to_id).select("socket_id");
    const from = await User.findById(from_id).select("socket_id");

    // emit event request received to recipient
    io.to(to?.socket_id).emit("approve_reject_sent", {
      message:
        status === "Approved"
          ? "You have successfully approved the request"
          : "You have successfully rejected the request",
      status: "success",
      data: updated_appointment,
    });
    io.to(from?.socket_id).emit("approve_reject_recieved", {
      message:
        status === "Approved"
          ? "Your Request is approved!"
          : "Your Request is Rejected",
      status: status === "Approved" ? "success" : "error",
      data: updated_appointment,
    });
  });

  socket.on("end", async (data) => {
    // Find user by ID and set status as offline
    console.log("logout data: ", data);
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
