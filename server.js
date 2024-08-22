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
const OneToOneMessage = require("./models/OneToOneMessages");
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

      const user = await User.findOne({ _id: user_id }).select("friends");
      const my_friends = user.friends;
      const onlineFriends = await User.find({
        _id: { $in: my_friends },
        status: "Online",
      }).select("socket_id");

      onlineFriends.forEach((friend) => {
        io.to(friend.socket_id).emit("online_status", {
          id: user_id,
          status: "Online",
        });
      });
    } catch (e) {
      console.log(e);
    }
  }

  // We can write our socket event listeners in here...

  socket.on("appointment_request", async (data) => {
    console.log("data", data);
    const from = await User.findById(data.from).select("socket_id");
    if (data.to === 0) {
      io.to(from?.socket_id).emit("request_sent", {
        message: "All fields are required!",
        status: "error",
      });
      return;
    }
    const to = await User.findById(data.to).select("socket_id");

    // save appointment to database
    let new_appointment;
    try {
      new_appointment = await Appointment.create(data);
    } catch (err) {
      if (err.name === "ValidationError") {
        io.to(from?.socket_id).emit("request_sent", {
          message: "All fields are required!",
          status: "error",
        });
      }
      return;
    }

    if (!new_appointment) {
      io.to(from?.socket_id).emit("request_sent", {
        message: "Not able to handle this request. Please try after sometime",
        status: "error",
      });
      return;
    }
    // emit event request received to recipient
    console.log(new_appointment);
    io.to(to?.socket_id).emit("new_appointment_request", {
      message: "You have received a new Appointment request",
      data: new_appointment,
    });
    io.to(from?.socket_id).emit("request_sent", {
      message: "Request Sent successfully!",
      status: "success",
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

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  socket.on("send_message", async (data) => {
    // const { from, to, text,type } = data;
    const to_id = data.to;
    const from_id = data.from;

    const to = await User.findById(to_id).select("socket_id");
    const from = await User.findById(from_id).select("socket_id");

    const existing_conversations = await OneToOneMessage.find({
      $or: [
        { from: from_id, to: to_id },
        { from: to_id, to: from_id },
      ],
    });
    console.log(existing_conversations);
    if (existing_conversations.length !== 0) {
      const len = existing_conversations.length;

      const last_conversation_time = new Date(
        existing_conversations[existing_conversations.length - 1].created_at
      );

      if (!isToday(last_conversation_time)) {
        const message = await OneToOneMessage.create({
          to: to_id,
          from: from_id,
          type: "Divider",
        });
        console.log("The last conversation time is not today.");

        io.to(to?.socket_id).emit("got_new_message", {
          message: "New message is received",
          status: "success",
          data: { message },
        });

        io.to(from?.socket_id).emit("got_new_message", {
          message: "Message sent successfully",
          status: "success",
          data: { message },
        });
      }
    } else {
      const message = await OneToOneMessage.create({
        to: to_id,
        from: from_id,
        type: "Divider",
        text: Date.now(),
      });
      console.log("The last conversation time is not today.");

      io.to(to?.socket_id).emit("got_new_message", {
        message: "New message is received",
        status: "success",
        data: message,
      });

      io.to(from?.socket_id).emit("got_new_message", {
        message: "Message sent successfully",
        status: "success",
        data: message,
      });
    }
    const message = await OneToOneMessage.create(data);

    // console.log("user_to", to, from);

    const user_to = await User.findById({ _id: to_id });
    //
    console.log("user_to", to_id);
    const index = user_to.friends.findIndex((el) => {
      return el.toString() === from_id;
    });
    console.log("index", index);
    if (index === -1) {
      const updated_to = await User.findByIdAndUpdate(
        to_id, // Directly pass the ID
        { $push: { friends: from_id } }, // Correct syntax for $push
        { new: true } // Option to return the updated document
      );

      io.to(to?.socket_id).emit("new_friend_added", {
        message: "New friend is added",
        status: "success",
        data: updated_to,
      });
    }
    // console.log("new message", {
    //   ...message._doc,
    //   incoming: true,
    //   outgoing: false,
    // });

    io.to(to?.socket_id).emit("got_new_message", {
      message: "New message is received",
      status: "success",
      data: { ...message._doc, incoming: true, outgoing: false },
    });

    io.to(from?.socket_id).emit("got_new_message", {
      message: "Message sent successfully",
      status: "success",
      data: { ...message._doc, incoming: false, outgoing: true },
    });

    //updation of friendData

    const updated_to = await User.findByIdAndUpdate(
      { _id: to_id },
      { lastMessageId: message._id }
    );

    const updated_from = await User.findByIdAndUpdate(
      { _id: from_id },
      { lastMessageId: message._id }
    );

    io.to(to?.socket_id).emit("update_friendData", {
      message: "New message is received",
      status: "success",
      data: {
        id: from_id,
        lastMessageId: {
          _id: message._id,
          text: message.text,
          created_at: message.created_at,
        },
      },
    });

    io.to(from?.socket_id).emit("update_friendData", {
      message: "Message sent successfully",
      status: "success",
      data: {
        id: to_id,
        lastMessageId: {
          _id: message._id,
          text: message.text,
          created_at: message.created_at,
        },
      },
    });
  });

  socket.on("get_conversations", async (data, callback) => {
    const my_id = data.id;
    const friend_id = data.friend_id;
    // console.log("my_id: ", my_id);
    // console.log("frined_id: ", friend_id);
    const sentConversations = await OneToOneMessage.find({
      from: my_id,
      to: friend_id,
    });
    const receivedConversation = await OneToOneMessage.find({
      from: friend_id,
      to: my_id,
    });
    // console.log("sentconversations", sentConversations);
    // console.log("recieved converstions", receivedConversation);
    callback({ sent: sentConversations, received: receivedConversation });
  });

  // socket.on("request_toget_myfriends", async (data) => {
  //   const { id } = data;
  //   console.log("this is data", data);
  //   const me = await User.findOne({ _id: id });
  //   const my_friends = me.friends;
  //   const my_socket_id = me.socket_id;
  //   const friendsData = await User.find({ _id: { $in: my_friends } }).select(
  //     "_id name status socket_id"
  //   );
  //   console.log("friends:", friendsData);
  //   console.log("socket_id", my_socket_id);
  //   io.to(my_socket_id).emit("friends_data_sent", {
  //     status: "success",
  //     data: friendsData,
  //   });
  // });

  socket.on("end", async (data) => {
    // Find user by ID and set status as offline
    // console.log("logout data: ", data);

    if (data.user_id) {
      await User.findByIdAndUpdate(data.user_id, { status: "Offline" });
    }

    const user = await User.findOne({ _id: data.user_id }).select("friends");
    const my_friends = user.friends;
    const onlineFriends = await User.find({
      _id: { $in: my_friends },
      status: "Online",
    }).select("socket_id");

    onlineFriends.forEach((friend) => {
      io.to(friend.socket_id).emit("online_status", {
        id: user_id,
        status: "Offline",
      });
    });

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
